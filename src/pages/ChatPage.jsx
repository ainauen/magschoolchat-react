import React, { useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import useIdleLogout from "../auth/useIdleLogout";
import AppNavbar from "../components/AppNavbar";
import ChatShell from "../components/ChatShell";

export default function ChatPage() {
  const { logout } = useAuth();

  // Auto logout after 1 hour of inactivity
  useIdleLogout({
    timeoutMs: 60 * 60 * 1000,
    onTimeout: () => logout(),
  });

  return (
    <>
      <AppNavbar />

      <Routes>
        <Route path="/" element={<ChatShell />} />

        {/* placeholders for future routes */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </>
  );
}