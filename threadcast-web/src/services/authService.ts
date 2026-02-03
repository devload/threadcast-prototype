import { api } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

// Capacitor detection
const isCapacitorNative = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

// Get redirect URI based on platform
const getRedirectUri = (): string => {
  if (isCapacitorNative()) {
    return 'threadcast://auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
};

// PKCE Helper Functions
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64urlEncode(hashed);
}

// SessionCast OAuth Configuration
const isLocalDev = import.meta.env.DEV || window.location.hostname === 'localhost';
const SESSIONCAST_AUTH_URL = isLocalDev
  ? 'http://localhost:22081'
  : 'https://auth.sessioncast.io';
const SESSIONCAST_CLIENT_ID = 'threadcast';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () =>
    api.post<void>('/auth/logout'),

  me: () =>
    api.silentGet<User>('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),

  // SessionCast OAuth - Start login flow
  loginWithSessionCast: async () => {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    // Store for callback verification (use localStorage for Capacitor compatibility)
    localStorage.setItem('oauth_code_verifier', codeVerifier);
    localStorage.setItem('oauth_state', state);

    const redirectUri = getRedirectUri();

    const params = new URLSearchParams({
      client_id: SESSIONCAST_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${SESSIONCAST_AUTH_URL}/oauth/authorize?${params}`;

    if (isCapacitorNative()) {
      // Use Capacitor Browser plugin to open in Safari
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: authUrl });
    } else {
      // Web: redirect in same window
      window.location.href = authUrl;
    }
  },

  // SessionCast OAuth - Handle callback
  handleOAuthCallback: async (code: string, state: string): Promise<AuthResponse> => {
    // Verify state
    const storedState = localStorage.getItem('oauth_state');
    if (!storedState || state !== storedState) {
      throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
    }

    // Get code verifier
    const codeVerifier = localStorage.getItem('oauth_code_verifier');
    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    // Clean up storage
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('oauth_code_verifier');

    const redirectUri = getRedirectUri();

    // Exchange code for tokens via backend
    return api.post<AuthResponse>('/auth/oauth/callback', {
      code,
      codeVerifier,
      redirectUri,
    });
  },
};
