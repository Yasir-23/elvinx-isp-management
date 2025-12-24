import React, { useState, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Sessions from "./pages/Sessions";
import RouterInfo from "./pages/RouterInfo";
import AllUsers from "./pages/AllUsersPage";
import OnlineUsers from "./pages/OnlineUsersPage";
import OfflineUsers from "./pages/OfflineUsersPage";
import Settings from "./pages/Settings";
import FaviconUpdater from "./components/FaviconUpdater";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import { setupAutoLogout } from "./utils/autoLogout";
import MainLayout from "./layouts/MainLayout";

import "./styles.css";
import { SettingsProvider } from "./context/SettingsContext";
import NetworkPage from "./pages/NetworkPage";
import AddUserPage from "./pages/AddUserPage";
import ProfilePage from "./pages/ProfilePage";
import AdminProfilePage from "./pages/AdminProfilePage";
import AddPackagePage from "./pages/AddPackagePage";
import AllPackages from "./pages/AllPackagesPage";
import PackageProfile from "./pages/PackageProfile";
import AddInvoice from "./pages/AddInvoice";
import BrowseBills from "./pages/BrowseBills";

// Error boundary wrapper for safety
function ErrorBoundary({ children }) {
  return (
    <Suspense fallback={<div className="text-white p-6">Loading...</div>}>
      {children}
    </Suspense>
  );
}

function AppShell() {
  useEffect(() => {
    setupAutoLogout(30);
  }, []);

  return (
    <BrowserRouter>
      <FaviconUpdater />

      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes using MainLayout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateRoute>
              <MainLayout>
                <Users />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/users/add"
          element={
            <PrivateRoute>
              <MainLayout>
                <AddUserPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/users/all"
          element={
            <PrivateRoute>
              <MainLayout>
                <AllUsers />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/users/:id/profile"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/users/online"
          element={
            <PrivateRoute>
              <MainLayout>
                <OnlineUsers />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/users/offline"
          element={
            <PrivateRoute>
              <MainLayout>
                <OfflineUsers />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/sessions"
          element={
            <PrivateRoute>
              <MainLayout>
                <Sessions />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/router"
          element={
            <PrivateRoute>
              <MainLayout>
                <RouterInfo />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/network"
          element={
            <PrivateRoute>
              <MainLayout>
                <NetworkPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

          <Route
          path="/admin"
          element={
            <PrivateRoute>
              <MainLayout>
                <AdminProfilePage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/addpackage"
          element={
            <PrivateRoute>
              <MainLayout>
                <AddPackagePage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/allpackages"
          element={
            <PrivateRoute>
              <MainLayout>
                <AllPackages />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="packages/:id"
          element={
            <PrivateRoute>
              <MainLayout>
                <PackageProfile />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="addinvoices"
          element={
            <PrivateRoute>
              <MainLayout>
                <AddInvoice />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="browsebills"
          element={
            <PrivateRoute>
              <MainLayout>
                <BrowseBills />
              </MainLayout>
            </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  </React.StrictMode>
);
