import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';

const pool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
});

function makeUser(email) {
  return new CognitoUser({ Username: email, Pool: pool });
}

export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    const user = makeUser(email);
    const details = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(details, {
      onSuccess(session) {
        resolve({
          access_token: session.getAccessToken().getJwtToken(),
          id_token: session.getIdToken().getJwtToken(),
          refresh_token: session.getRefreshToken().getToken(),
          expires_in:
            session.getAccessToken().getExpiration() - Math.floor(Date.now() / 1000),
        });
      },
      onFailure: reject,
      newPasswordRequired() {
        const err = new Error('A new password is required for your account.');
        err.name = 'NewPasswordRequired';
        reject(err);
      },
    });
  });
}

export function signUp(email, password, fullName) {
  return new Promise((resolve, reject) => {
    const attrs = [new CognitoUserAttribute({ Name: 'name', Value: fullName })];
    pool.signUp(email, password, attrs, null, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function confirmSignUp(email, code) {
  return new Promise((resolve, reject) => {
    makeUser(email).confirmRegistration(code, true, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function resendConfirmationCode(email) {
  return new Promise((resolve, reject) => {
    makeUser(email).resendConfirmationCode((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function forgotPassword(email) {
  return new Promise((resolve, reject) => {
    makeUser(email).forgotPassword({ onSuccess: resolve, onFailure: reject });
  });
}

export function confirmForgotPassword(email, code, newPassword) {
  return new Promise((resolve, reject) => {
    makeUser(email).confirmPassword(code, newPassword, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

const ERROR_MESSAGES = {
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotFoundException: 'No account found with this email.',
  UserNotConfirmedException: 'Please verify your email before signing in.',
  CodeMismatchException: 'Invalid verification code. Please try again.',
  ExpiredCodeException: 'This code has expired. Request a new one.',
  UsernameExistsException: 'An account with this email already exists.',
  LimitExceededException: 'Too many attempts. Please try again later.',
  TooManyRequestsException: 'Too many requests. Please wait and try again.',
  NewPasswordRequired: 'A new password is required. Please contact support.',
};

export function friendlyError(err) {
  return (
    ERROR_MESSAGES[err?.name] ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}
