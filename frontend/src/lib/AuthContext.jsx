import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  accessToken: 'fitops_cognito_access_token',
  idToken: 'fitops_cognito_id_token',
  refreshToken: 'fitops_cognito_refresh_token',
  expiresAt: 'fitops_cognito_expires_at',
  pkceVerifier: 'fitops_cognito_pkce_verifier',
  oauthState: 'fitops_cognito_oauth_state',
  returnTo: 'fitops_cognito_return_to'
};

const COGNITO_CONFIG = {
  region: import.meta.env.VITE_COGNITO_REGION,
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
  hostedUiBaseUrl: import.meta.env.VITE_COGNITO_HOSTED_UI_BASE_URL,
  redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
  logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL
};

const OAUTH_SCOPES = ['openid', 'email', 'profile'];

function assertCognitoConfig() {
  const missing = Object.entries(COGNITO_CONFIG)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Cognito frontend configuration: ${missing.join(', ')}`);
  }
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomString(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return crypto.subtle.digest('SHA-256', data);
}

async function createPkcePair() {
  const verifier = randomString(64);
  const challengeBuffer = await sha256(verifier);
  const challenge = base64UrlEncode(challengeBuffer);

  return {
    verifier,
    challenge
  };
}

function decodeJwt(token) {
  if (!token) return null;

  const [, payload] = token.split('.');

  if (!payload) return null;

  try {
    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');

    const decoded = atob(normalizedPayload);
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

function getStoredSession() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const idToken = localStorage.getItem(STORAGE_KEYS.idToken);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  const expiresAtRaw = localStorage.getItem(STORAGE_KEYS.expiresAt);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;

  if (!accessToken || !idToken) {
    return null;
  }

  return {
    accessToken,
    idToken,
    refreshToken,
    expiresAt
  };
}

function saveSession(tokenResponse) {
  const expiresInSeconds = Number(tokenResponse.expires_in || 3600);
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  if (tokenResponse.access_token) {
    localStorage.setItem(STORAGE_KEYS.accessToken, tokenResponse.access_token);
  }

  if (tokenResponse.id_token) {
    localStorage.setItem(STORAGE_KEYS.idToken, tokenResponse.id_token);
  }

  if (tokenResponse.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokenResponse.refresh_token);
  }

  localStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt));
}

function clearSession() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Cleanup leftovers from the Base44-generated app.
  localStorage.removeItem('base44_access_token');
  sessionStorage.removeItem('base44_access_token');
}

function isSessionExpired(session) {
  if (!session?.expiresAt) return true;

  const safetyWindowMs = 60 * 1000;
  return Date.now() >= session.expiresAt - safetyWindowMs;
}

function buildUserFromIdToken(idToken) {
  const claims = decodeJwt(idToken);

  if (!claims) return null;

  const fullName =
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
    claims.email ||
    'FitOps User';

  return {
    id: claims.sub,
    userId: claims.sub,
    sub: claims.sub,
    email: claims.email,
    full_name: fullName,
    name: fullName,
    given_name: claims.given_name,
    family_name: claims.family_name,
    picture: claims.picture,
    claims
  };
}

async function exchangeCodeForTokens(code) {
  assertCognitoConfig();

  const verifier =
    sessionStorage.getItem(STORAGE_KEYS.pkceVerifier) ||
    localStorage.getItem(STORAGE_KEYS.pkceVerifier);

  if (!verifier) {
    throw new Error('Missing PKCE verifier. Please login again.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: COGNITO_CONFIG.clientId,
    code,
    redirect_uri: COGNITO_CONFIG.redirectUri,
    code_verifier: verifier
  });

  const response = await fetch(`${COGNITO_CONFIG.hostedUiBaseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange Cognito code for tokens: ${response.status} ${text}`);
  }

  return response.json();
}

async function refreshTokens(refreshToken) {
  assertCognitoConfig();

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: COGNITO_CONFIG.clientId,
    refresh_token: refreshToken
  });

  const response = await fetch(`${COGNITO_CONFIG.hostedUiBaseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Cognito tokens: ${response.status} ${text}`);
  }

  return response.json();
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Compatibility with old Base44-generated code.
  // We no longer load Base44 public settings.
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const applySessionToState = (session) => {
    const currentUser = buildUserFromIdToken(session.idToken);

    if (!currentUser) {
      throw new Error('Could not build user from Cognito ID token.');
    }

    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      let session = getStoredSession();

      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        return null;
      }

      if (isSessionExpired(session)) {
        if (!session.refreshToken) {
          clearSession();
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          return null;
        }

        const refreshedTokens = await refreshTokens(session.refreshToken);

        saveSession({
          ...refreshedTokens,
          refresh_token: refreshedTokens.refresh_token || session.refreshToken
        });

        session = getStoredSession();
      }

      applySessionToState(session);
      setAuthChecked(true);

      return buildUserFromIdToken(session.idToken);
    } catch (error) {
      console.error('Cognito auth check failed:', error);

      clearSession();
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError({
        type: 'auth_required',
        message: error.message || 'Authentication required'
      });

      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(false);
      await checkUserAuth();
    } catch (error) {
      console.error('Unexpected auth state error:', error);

      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected authentication error occurred'
      });

      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAuthChecked(true);
    }
  };

  const navigateToLogin = async (returnTo = window.location.pathname + window.location.search + window.location.hash) => {
    try {
      assertCognitoConfig();

      const { verifier, challenge } = await createPkcePair();
      const state = randomString(32);

      sessionStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier);
      sessionStorage.setItem(STORAGE_KEYS.oauthState, state);
      sessionStorage.setItem(STORAGE_KEYS.returnTo, returnTo || '/dashboard');

      localStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier);
      localStorage.setItem(STORAGE_KEYS.oauthState, state);
      localStorage.setItem(STORAGE_KEYS.returnTo, returnTo || '/dashboard');

      const params = new URLSearchParams({
        client_id: COGNITO_CONFIG.clientId,
        response_type: 'code',
        scope: OAUTH_SCOPES.join(' '),
        redirect_uri: COGNITO_CONFIG.redirectUri,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state
      });

      window.location.assign(`${COGNITO_CONFIG.hostedUiBaseUrl}/oauth2/authorize?${params.toString()}`);
    } catch (error) {
      console.error('Failed to start Cognito login:', error);
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Failed to start login'
      });
    }
  };

  const navigateToSignUp = async (returnTo = '/dashboard') => {
    // Cognito Hosted UI direct /signup can lose the PKCE verifier during
    // the signup + confirmation flow. Start from the standard authorize
    // endpoint instead; users can choose "Sign up" inside Hosted UI.
    return navigateToLogin(returnTo);
  };

const handleAuthCallback = async () => {
  try {
    setIsLoadingAuth(true);
    setAuthError(null);

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      throw new Error(errorDescription || error);
    }

    if (!code) {
      throw new Error('Missing Cognito authorization code.');
    }

    const expectedState =
      sessionStorage.getItem(STORAGE_KEYS.oauthState) ||
      localStorage.getItem(STORAGE_KEYS.oauthState);

    const pkceVerifier =
      sessionStorage.getItem(STORAGE_KEYS.pkceVerifier) ||
      localStorage.getItem(STORAGE_KEYS.pkceVerifier);

    if (!pkceVerifier) {
      throw new Error('Missing PKCE verifier. Please login again.');
    }

    if (expectedState && state && expectedState !== state) {
      throw new Error('Invalid OAuth state. Please login again.');
    }

    const tokenResponse = await exchangeCodeForTokens(code);
    saveSession(tokenResponse);

    sessionStorage.removeItem(STORAGE_KEYS.pkceVerifier);
    sessionStorage.removeItem(STORAGE_KEYS.oauthState);
    sessionStorage.removeItem(STORAGE_KEYS.returnTo);

    localStorage.removeItem(STORAGE_KEYS.pkceVerifier);
    localStorage.removeItem(STORAGE_KEYS.oauthState);
    localStorage.removeItem(STORAGE_KEYS.returnTo);

    const session = getStoredSession();
    applySessionToState(session);

    setAuthChecked(true);
    setIsLoadingAuth(false);

    window.location.replace('/dashboard');
    return;
  } catch (error) {
    console.error('Cognito callback failed:', error);

    setAuthError({
      type: 'callback_failed',
      message: error.message || 'Login failed'
    });

    setIsLoadingAuth(false);
    setAuthChecked(true);

    throw error;
  }
};

const logout = () => {
  const logoutUrl =
    `${COGNITO_CONFIG.hostedUiBaseUrl}/logout` +
    `?client_id=${encodeURIComponent(COGNITO_CONFIG.clientId)}` +
    `&logout_uri=${encodeURIComponent(window.location.origin)}`;

  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.idToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
  localStorage.removeItem(STORAGE_KEYS.pkceVerifier);
  localStorage.removeItem(STORAGE_KEYS.oauthState);
  localStorage.removeItem(STORAGE_KEYS.returnTo);

  sessionStorage.removeItem(STORAGE_KEYS.pkceVerifier);
  sessionStorage.removeItem(STORAGE_KEYS.oauthState);
  sessionStorage.removeItem(STORAGE_KEYS.returnTo);

  localStorage.removeItem('base44_access_token');
  localStorage.removeItem('base44_refresh_token');
  sessionStorage.removeItem('base44_access_token');
  sessionStorage.removeItem('base44_refresh_token');

  window.location.replace(logoutUrl);
};

  const getAccessToken = async () => {
    const session = getStoredSession();

    if (!session) {
      return null;
    }

    if (!isSessionExpired(session)) {
      return session.accessToken;
    }

    if (!session.refreshToken) {
      clearSession();
      return null;
    }

    const refreshedTokens = await refreshTokens(session.refreshToken);

    saveSession({
      ...refreshedTokens,
      refresh_token: refreshedTokens.refresh_token || session.refreshToken
    });

    return localStorage.getItem(STORAGE_KEYS.accessToken);
  };

  const getAuthHeaders = async () => {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${accessToken}`
    };
  };

  const loginWithTokens = (tokenResponse) => {
    saveSession(tokenResponse);
    const session = getStoredSession();
    if (!session) throw new Error('Failed to save session after sign-in.');
    applySessionToState(session);
    setAuthChecked(true);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,

      cognitoConfig: COGNITO_CONFIG,

      logout,
      navigateToLogin,
      navigateToSignUp,
      handleAuthCallback,
      checkUserAuth,
      checkAppState,
      getAccessToken,
      getAuthHeaders,
      loginWithTokens
    }),
    [
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};