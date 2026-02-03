import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { authService, workspaceService } from '../services';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';
import { Alert } from '../components/feedback/Alert';

// Capacitor detection
const isCapacitorNative = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

export function LoginPage() {
  const navigate = useNavigate();
  const { error, clearError } = useAuthStore();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for deep link callbacks (Capacitor native app)
    if (isCapacitorNative()) {
      let listenerHandle: { remove: () => Promise<void> } | null = null;

      const setupListener = async () => {
        const { App } = await import('@capacitor/app');
        const { Browser } = await import('@capacitor/browser');

        const handle = await App.addListener('appUrlOpen', async (event) => {
          console.log('appUrlOpen received:', event.url);

          try {
            const url = new URL(event.url);

            // Check if this is an OAuth callback
            if (url.pathname === '/auth/callback' || url.host === 'auth') {
              const authCode = url.searchParams.get('code');
              const state = url.searchParams.get('state');
              const authError = url.searchParams.get('error');

              // Close the in-app browser
              await Browser.close();

              if (authError) {
                setLocalError(authError);
                setIsOAuthLoading(false);
                return;
              }

              if (authCode && state) {
                await handleOAuthCallback(authCode, state);
              }
            }
          } catch (err) {
            console.error('Failed to parse URL:', err);
            setLocalError('로그인 처리 중 오류가 발생했습니다.');
            setIsOAuthLoading(false);
          }
        });

        listenerHandle = handle;
      };

      setupListener();

      return () => {
        listenerHandle?.remove();
      };
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setIsOAuthLoading(true);

      const response = await authService.handleOAuthCallback(code, state);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Update auth store
      useAuthStore.setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch and set default workspace
      const workspaces = await workspaceService.getAll();
      if (workspaces.length > 0) {
        useUIStore.getState().setCurrentWorkspaceId(workspaces[0].id);
      }

      // Navigate to workspaces
      navigate('/workspaces', { replace: true });
    } catch (err) {
      console.error('OAuth callback failed:', err);
      setLocalError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
      setIsOAuthLoading(false);
    }
  };

  const handleSessionCastLogin = async () => {
    setIsOAuthLoading(true);
    setLocalError(null);
    try {
      await authService.loginWithSessionCast();
      // For web: Page will redirect
      // For native: Browser will open, then appUrlOpen listener handles callback
    } catch (err) {
      console.error('Login failed:', err);
      setLocalError(err instanceof Error ? err.message : '로그인을 시작할 수 없습니다.');
      setIsOAuthLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Tagline */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="xl" />
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-center">
            AI-Powered Kanban for Development Teams
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-700 p-8">
          {displayError && (
            <Alert
              type="error"
              className="mb-4"
              dismissible
              onDismiss={() => {
                setLocalError(null);
                clearError();
              }}
            >
              {displayError}
            </Alert>
          )}

          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Welcome to ThreadCast
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Sign in with your SessionCast account to continue
            </p>
          </div>

          {/* SessionCast OAuth Button */}
          <Button
            type="button"
            variant="primary"
            fullWidth
            isLoading={isOAuthLoading}
            onClick={handleSessionCastLogin}
            className="!py-3 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign in with SessionCast
          </Button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Weave your development workflow with AI
        </p>
      </div>
    </div>
  );
}
