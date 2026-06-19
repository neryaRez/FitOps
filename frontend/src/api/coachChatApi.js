const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAccessToken() {
  return localStorage.getItem('fitops_cognito_access_token');
}

async function apiRequest(path, options = {}) {
  const token = getAccessToken();

  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }

  if (!token) {
    throw new Error('Missing Cognito access token.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `API request failed: ${response.status}`);
  }

  return data;
}

export async function listCoachConversations() {
  return apiRequest('/ai/chat/conversations');
}

export async function createCoachConversation(title) {
  return apiRequest('/ai/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getCoachConversation(conversationId) {
  return apiRequest(`/ai/chat/conversations/${encodeURIComponent(conversationId)}`);
}

export async function sendCoachMessage(conversationId, content) {
  return apiRequest(`/ai/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
