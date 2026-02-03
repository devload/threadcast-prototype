import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService, workspaceService } from '../services';
import { useAuthStore } from '../stores';
import { useUIStore } from '../stores/uiStore';
import { Logo } from '../components/common/Logo';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearError } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth error
      if (errorParam) {
        setError(errorDescription || errorParam);
        setIsProcessing(false);
        return;
      }

      // Validate required params
      if (!code || !state) {
        setError('Missing authorization code or state');
        setIsProcessing(false);
        return;
      }

      // Check if we have stored OAuth state (required for PKCE)
      const storedState = localStorage.getItem('oauth_state');
      if (!storedState) {
        // No stored state means user refreshed or navigated directly to callback
        // Redirect to login to start fresh OAuth flow
        navigate('/login', { replace: true });
        return;
      }

      try {
        clearError();

        // Minimum display time for the loading screen (3 seconds)
        const minDisplayTime = new Promise((resolve) => setTimeout(resolve, 3000));

        // Exchange code for tokens
        const authPromise = authService.handleOAuthCallback(code, state);

        // Wait for both auth and minimum display time
        const [response] = await Promise.all([authPromise, minDisplayTime]);

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

        // Redirect to workspaces
        navigate('/workspaces', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, clearError]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/30 px-4">
        <div className="w-full max-w-md text-center">
          <Logo size="xl" />
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/30 px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="xl" />
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          {isProcessing && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Completing Sign In...
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Please wait while we authenticate your account.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
