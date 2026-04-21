import type { AdminProfile } from '@umi/shared';
import { useEffect, useState } from 'react';

import {
  clearAuthToken,
  fetchMe,
  hasAuthToken,
  login as loginRequest,
  logout as logoutRequest,
  setAuthToken,
} from '../lib/api/auth';

type LoginValues = {
  username: string;
  password: string;
};

interface UseAdminSessionOptions {
  onLoginSuccess?: () => void;
  onLoginFailed?: (message: string) => void;
  onLogout?: () => void;
}

export function useAdminSession(options: UseAdminSessionOptions = {}) {
  const { onLoginSuccess, onLoginFailed, onLogout } = options;
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);

  useEffect(() => {
    let alive = true;

    async function bootstrapUser() {
      setAuthChecking(true);
      try {
        if (!hasAuthToken()) {
          if (alive) {
            setAuthenticated(false);
            setCurrentUser(null);
          }
          return;
        }

        const user = await fetchMe();
        if (alive) {
          setAuthenticated(true);
          setCurrentUser(user);
          setLoginError(null);
        }
      } catch {
        if (alive) {
          clearAuthToken();
          setAuthenticated(false);
          setCurrentUser(null);
        }
      } finally {
        if (alive) {
          setAuthChecking(false);
        }
      }
    }

    void bootstrapUser();

    return () => {
      alive = false;
    };
  }, []);

  async function handleLogin(values: LoginValues) {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const result = await loginRequest(values);
      setAuthToken(result.token);
      setCurrentUser(result.user);
      setAuthenticated(true);
      setLoginError(null);
      onLoginSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败';
      clearAuthToken();
      setAuthenticated(false);
      setCurrentUser(null);
      setLoginError(message);
      onLoginFailed?.(message);
    } finally {
      setLoginLoading(false);
      setAuthChecking(false);
    }
  }

  async function handleLogout() {
    try {
      if (hasAuthToken()) {
        await logoutRequest();
      }
    } catch {
      // Ignore logout API errors and still clear local auth.
    } finally {
      clearAuthToken();
      setAuthenticated(false);
      setCurrentUser(null);
      onLogout?.();
    }
  }

  return {
    authChecking,
    authenticated,
    currentUser,
    loginError,
    loginLoading,
    setLoginError,
    handleLogin,
    handleLogout,
  };
}
