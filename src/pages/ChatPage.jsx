import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import useIdleLogout from "../auth/useIdleLogout";
import AppNavbar from "../componentsRefactor/AppNavbar";
import ChatShell from "../componentsRefactor/ChatShell";

export default function ChatPage() {
  const { logout } = useAuth();

  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);

  // Auto logout after 1 hour of inactivity
  useIdleLogout({
    timeoutMs: 60 * 60 * 1000,
    onTimeout: () => logout(),
  });

  const handleArchiveChanged = () => {
    setArchiveRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <AppNavbar onArchiveChanged={handleArchiveChanged} />

      <Routes>
        <Route
          path="/"
          element={<ChatShell archiveRefreshKey={archiveRefreshKey} />}
        />

        {/* placeholders for future routes */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </>
  );
}