import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { AppRouter } from './routes/AppRouter';

export default function App() {
  const { initTheme } = useThemeStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  return <AppRouter />;
}
