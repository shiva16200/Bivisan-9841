/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { HistoryProvider } from './context/HistoryContext';
import { PlayerProvider } from './context/PlayerContext';

// Layout & Route Guards
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

// Core entry page (loaded directly for instant initial render)
import { HomePage } from './pages/HomePage';

// Lazy-loaded pages to make mobile download bundle ultra-small (<150kb)
const LiveChannelsPage = lazy(() => import('./pages/LiveChannelsPage').then(m => ({ default: m.LiveChannelsPage })));
const ChannelDetailPage = lazy(() => import('./pages/ChannelDetailPage').then(m => ({ default: m.ChannelDetailPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then(m => ({ default: m.GuidePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage').then(m => ({ default: m.CategoryDetailPage })));
const CountriesPage = lazy(() => import('./pages/CountriesPage').then(m => ({ default: m.CountriesPage })));
const CountryDetailPage = lazy(() => import('./pages/CountryDetailPage').then(m => ({ default: m.CountryDetailPage })));
const LanguagesPage = lazy(() => import('./pages/LanguagesPage').then(m => ({ default: m.LanguagesPage })));
const LanguageDetailPage = lazy(() => import('./pages/LanguageDetailPage').then(m => ({ default: m.LanguageDetailPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Admin Pages (Code split)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminChannelsPage = lazy(() => import('./pages/admin/AdminChannelsPage').then(m => ({ default: m.AdminChannelsPage })));
const AdminChannelFormPage = lazy(() => import('./pages/admin/AdminChannelFormPage').then(m => ({ default: m.AdminChannelFormPage })));
const AdminGuidePage = lazy(() => import('./pages/admin/AdminGuidePage').then(m => ({ default: m.AdminGuidePage })));

const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
  </div>
);

const isGitHubPages =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('github.io') ||
   window.location.hostname.includes('pages.dev') ||
   window.location.protocol === 'file:' ||
   Boolean(window.location.hash && window.location.hash.startsWith('#/')));

export default function App() {
  const RouterComponent = isGitHubPages ? HashRouter : BrowserRouter;

  // Protect stream source and disable right-click context menu and inspection shortcuts
  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <RouterComponent>
      <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <HistoryProvider>
              <PlayerProvider>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<AppLayout />}>
                      {/* Public Live TV Discovery Routes */}
                      <Route index element={<HomePage />} />
                      <Route path="live" element={<LiveChannelsPage />} />
                      <Route path="channel/:id" element={<ChannelDetailPage />} />
                      <Route path="guide" element={<GuidePage />} />
                      <Route path="search" element={<SearchPage />} />
                      <Route path="favorites" element={<FavoritesPage />} />
                      <Route path="history" element={<HistoryPage />} />

                      {/* Taxonomy & Directory Routes */}
                      <Route path="categories" element={<CategoriesPage />} />
                      <Route path="category/:slug" element={<CategoryDetailPage />} />
                      <Route path="countries" element={<CountriesPage />} />
                      <Route path="country/:code" element={<CountryDetailPage />} />
                      <Route path="languages" element={<LanguagesPage />} />
                      <Route path="language/:code" element={<LanguageDetailPage />} />

                      {/* Preferences & Authentication */}
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="register" element={<RegisterPage />} />

                      {/* Protected User Account */}
                      <Route
                        path="profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Authentication & Management Portal */}
                      <Route path="admin/login" element={<LoginPage />} />
                      <Route
                        path="admin"
                        element={
                          <AdminRoute>
                            <AdminDashboardPage />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="admin/channels"
                        element={
                          <AdminRoute>
                            <AdminChannelsPage />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="admin/channels/new"
                        element={
                          <AdminRoute>
                            <AdminChannelFormPage />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="admin/channels/:id/edit"
                        element={
                          <AdminRoute>
                            <AdminChannelFormPage />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="admin/guide"
                        element={
                          <AdminRoute>
                            <AdminGuidePage />
                          </AdminRoute>
                        }
                      />

                      {/* 404 Fallback */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </PlayerProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </RouterComponent>
  );
}
