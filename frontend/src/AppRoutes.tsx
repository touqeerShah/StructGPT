// src/router.tsx
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import UploadPage, { loader as uploadPageLoader } from './pages/UploadPage';
import EditUploadPage from './pages/EditUploadPage';
import Dashboard from './components/ProcessingDashboard';
import SharePage from './components/SharePage';
import SettingsPage from './components/SettingsPage';
import JobDetailPage from './components/JobDetailPage';
import RequireAuth from './components/RequireAuth';

// 👇 Wrap protected pages in RequireAuth
const withAuth = (element: React.ReactNode, isAuthenticated: boolean) => (
  <RequireAuth isAuthenticated={isAuthenticated}>
    {element}
  </RequireAuth>
);

// 👇 Export a function so we can pass props dynamically
export const createRouter = ({
  user,
  isAuthenticated,
  onLogin,
  onLogout,
  onProcessComplete,
}: any) =>
  createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route
          path="/"
          element={
            <LandingPage
              user={user}
              isAuthenticated={isAuthenticated}
              onLogout={onLogout}
            />
          }
        />
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />

        <Route
          path="/uploads/:id/edit"
          element={<EditUploadPage onLogout={onLogout} />}
        />

        <Route
          path="/dashboard"
          element={withAuth(
            <Dashboard
              user={user}
              onLogout={onLogout}
              isAuthenticated={isAuthenticated}
              pageTitle="Processing Dashboard"
              subTitle=""
              onBack="/"
              page="dashboard"
            />,
            isAuthenticated
          )}
        />

        <Route
          path="/dashboard/details/:id"
          element={withAuth(<JobDetailPage onLogout={onLogout} />, isAuthenticated)}
        />

        <Route
          path="/upload"
          element={withAuth(
            <UploadPage
              onProcessComplete={onProcessComplete}
              user={user}
              onLogout={onLogout}
              isAuthenticated={isAuthenticated}
              pageTitle="Upload Files"
              subTitle=""
              onBack="/"
              page="upload"
            />,
            isAuthenticated
          )}
          loader={uploadPageLoader}
        />

        <Route
          path="/share/:id"
          element={withAuth(<SharePage onLogout={onLogout} />, isAuthenticated)}
        />

        <Route
          path="/settings"
          element={withAuth(
            <SettingsPage
              user={user}
              isAuthenticated={isAuthenticated}
              onLogout={onLogout}
              pageTitle="Settings"
              subTitle=""
              page="settings"
            />,
            isAuthenticated
          )}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </>
    )
  );
