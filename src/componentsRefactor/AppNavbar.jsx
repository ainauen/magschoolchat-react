import React, { useEffect, useMemo, useState } from "react";
import EditMembersModal from "./EditMembersModal";
import AppAccountDropdown from "./navbar/AppAccountDropdown";
import SessionsModal from "./navbar/SessionsModal";
import ClassesModal from "./navbar/ClassesModal";
import ClassMembersModal from "./navbar/ClassMembersModal";
import CreateUserModal from "./navbar/CreateUserModal";
import NicknamesModal from "./navbar/NicknamesModal";
import ChangePasswordModal from "./navbar/ChangePasswordModal";
import ArchiveModal from "./navbar/ArchiveModal";
import {
  Alert,
  Button,
  Container,
  Dropdown,
  Form,
  Modal,
  Nav,
  Navbar,
  Spinner,
  ListGroup,
  Table,
} from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

function createBlankClassRow() {
  return {
    name: "",
  };
}

function createBlankUserRow() {
  return {
    email: "",
    password: "",
    displayName: "",
  };
}

function createBlankChangePasswordRow() {
  return {
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  };
}

function createBlankNicknameRow() {
  return {
    nicknameText: "",
  };
}

function toInputDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

function formatDateDisplay(value) {
  if (!value) return "";
  const text = typeof value === "string" ? value.slice(0, 10) : "";
  if (!text) return "";
  const d = new Date(`${text}T00:00:00`);
  if (Number.isNaN(d.getTime())) return text;
  return d.toLocaleDateString();
}

function createBlankRow() {
  return {
    name: "",
    startDate: "",
    endDate: "",
    isActive: "",
  };
}

export default function AppNavbar({ onArchiveChanged }) {
  const { me, logout, hasRole, api } = useAuth();

  const canManageSessions =
    hasRole("Teacher") || hasRole("Administrator");

  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showEditMembersModal, setShowEditMembersModal] = useState(false);

  const canArchive = hasRole("Teacher") || hasRole("Administrator");

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [archiveRooms, setArchiveRooms] = useState([]);
  const [archiveDirectThreads, setArchiveDirectThreads] = useState([]);
  const [selectedArchiveRoomIds, setSelectedArchiveRoomIds] = useState([]);
  const [selectedArchiveDirectThreadIds, setSelectedArchiveDirectThreadIds] = useState([]);

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingRow, setEditingRow] = useState(createBlankRow());

  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState(createBlankRow());

  const canManageClasses = hasRole("Teacher") || hasRole("Administrator");
  const isAdmin = hasRole("Administrator");

  const [showClassesModal, setShowClassesModal] = useState(false);
  const [classesSessionId, setClassesSessionId] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesSaving, setClassesSaving] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingClassRow, setEditingClassRow] = useState(createBlankClassRow());
  const [creatingClass, setCreatingClass] = useState(false);
  const [newClassRow, setNewClassRow] = useState(createBlankClassRow());

  const [showClassMembersModal, setShowClassMembersModal] = useState(false);
  const [memberSessionId, setMemberSessionId] = useState("");
  const [memberClassId, setMemberClassId] = useState("");
  const [memberClasses, setMemberClasses] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSearchBusy, setMemberSearchBusy] = useState(false);
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [memberSelectedUsers, setMemberSelectedUsers] = useState([]);
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberLoadingExisting, setMemberLoadingExisting] = useState(false);
  const [memberErrorModal, setMemberErrorModal] = useState("");
  const [memberOriginalUserIds, setMemberOriginalUserIds] = useState([]);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserType, setCreateUserType] = useState("student"); // "student" | "teacher"
  const [createUserRow, setCreateUserRow] = useState(createBlankUserRow());
  const [createUserBusy, setCreateUserBusy] = useState(false);
  const [createUserError, setCreateUserError] = useState("");

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordRow, setChangePasswordRow] = useState(createBlankChangePasswordRow());
  const [changePasswordBusy, setChangePasswordBusy] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  const canManageNicknames =
    hasRole("Teacher") || hasRole("Administrator");

  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknames, setNicknames] = useState([]);
  const [activeNicknameId, setActiveNicknameId] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [nicknameSuccess, setNicknameSuccess] = useState("");

  const [creatingNickname, setCreatingNickname] = useState(false);
  const [newNicknameRow, setNewNicknameRow] = useState(createBlankNicknameRow());

  const [editingNicknameId, setEditingNicknameId] = useState(null);
  const [editingNicknameRow, setEditingNicknameRow] = useState(createBlankNicknameRow());

  useEffect(() => {
    if (!showClassMembersModal) return;

    const timer = setTimeout(async () => {
      const q = memberSearch.trim();

      if (q.length < 2) {
        setMemberSearchResults([]);
        return;
      }

      setMemberSearchBusy(true);
      setMemberErrorModal("");

      try {
        const res = await api.get("/api/users/search", {
          params: { q, take: 20, role: "Student" },
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        const selectedIds = new Set(memberSelectedUsers.map((u) => String(u.userId)));

        setMemberSearchResults(
          rows.filter((u) => !selectedIds.has(String(u.userId)))
        );
      } catch (e) {
        console.error(e);
        setMemberErrorModal("Student search failed.");
      } finally {
        setMemberSearchBusy(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [memberSearch, memberSelectedUsers, showClassMembersModal, api]);

  const archiveRoomIdSet = useMemo(
    () => new Set(selectedArchiveRoomIds.map(String)),
    [selectedArchiveRoomIds]
  );

  const archiveDirectThreadIdSet = useMemo(
    () => new Set(selectedArchiveDirectThreadIds.map(String)),
    [selectedArchiveDirectThreadIds]
  );

  const hasArchiveSelection =
    selectedArchiveRoomIds.length > 0 || selectedArchiveDirectThreadIds.length > 0;

  const openArchiveModal = async () => {
    setShowArchiveModal(true);
    setArchiveError("");
    setArchiveLoading(true);
    setSelectedArchiveRoomIds([]);
    setSelectedArchiveDirectThreadIds([]);

    try {
      const res = await api.get("/api/archive/options");
      setArchiveRooms(Array.isArray(res.data?.rooms) ? res.data.rooms : []);
      setArchiveDirectThreads(
        Array.isArray(res.data?.directThreads) ? res.data.directThreads : []
      );
    } catch (e) {
      console.error(e);
      setArchiveError("Failed to load archive options.");
    } finally {
      setArchiveLoading(false);
    }
  };

  const closeArchiveModal = () => {
    if (archiveSaving) return;
    resetArchiveModal();
  };

  const toggleArchiveRoom = (roomId) => {
    const id = String(roomId);

    setSelectedArchiveRoomIds((prev) =>
      prev.map(String).includes(id)
        ? prev.filter((x) => String(x) !== id)
        : [...prev, roomId]
    );
  };

  const toggleArchiveDirectThread = (directThreadId) => {
    const id = String(directThreadId);

    setSelectedArchiveDirectThreadIds((prev) =>
      prev.map(String).includes(id)
        ? prev.filter((x) => String(x) !== id)
        : [...prev, directThreadId]
    );
  };

  const toggleAllArchiveRooms = () => {
    if (selectedArchiveRoomIds.length === archiveRooms.length) {
      setSelectedArchiveRoomIds([]);
    } else {
      setSelectedArchiveRoomIds(archiveRooms.map((r) => r.roomId));
    }
  };

  const toggleAllArchiveDirectThreads = () => {
    if (selectedArchiveDirectThreadIds.length === archiveDirectThreads.length) {
      setSelectedArchiveDirectThreadIds([]);
    } else {
      setSelectedArchiveDirectThreadIds(
        archiveDirectThreads.map((t) => t.directThreadId)
      );
    }
  };

  const resetArchiveModal = () => {
    setShowArchiveModal(false);
    setArchiveError("");
    setArchiveRooms([]);
    setArchiveDirectThreads([]);
    setSelectedArchiveRoomIds([]);
    setSelectedArchiveDirectThreadIds([]);
  };

  const submitArchive = async () => {
    if (!hasArchiveSelection) return;

    setArchiveSaving(true);
    setArchiveError("");

    try {
      await api.post("/api/archive", {
        roomIds: selectedArchiveRoomIds,
        directThreadIds: selectedArchiveDirectThreadIds
      });

      resetArchiveModal();

      await onArchiveChanged?.();
    } catch (e) {
      console.error(e);
      setArchiveError(
        typeof e?.response?.data === "string"
          ? e.response.data
          : "Failed to archive selected items."
      );
    } finally {
      setArchiveSaving(false);
    }
  };

  const hasUnsavedClassChanges = useMemo(() => {
    if (creatingClass) return newClassRow.name.trim().length > 0;
    if (editingClassId) return true;
    return false;
  }, [creatingClass, newClassRow, editingClassId]);

  const hasUnsavedMemberChanges = useMemo(() => {
    const currentIds = memberSelectedUsers.map((u) => String(u.userId)).sort();

    if (currentIds.length !== memberOriginalUserIds.length) return true;

    for (let i = 0; i < currentIds.length; i++) {
      if (currentIds[i] !== memberOriginalUserIds[i]) return true;
    }

    return memberSearch.trim().length > 0;
  }, [memberSelectedUsers, memberOriginalUserIds, memberSearch]);

  const hasUnsavedCreateUserChanges = useMemo(() => {
    return (
      createUserRow.email.trim().length > 0 ||
      createUserRow.password.trim().length > 0 ||
      createUserRow.displayName.trim().length > 0
    );
  }, [createUserRow]);

  const hasUnsavedChangePasswordChanges = useMemo(() => {
    return (
      changePasswordRow.currentPassword.trim().length > 0 ||
      changePasswordRow.newPassword.trim().length > 0 ||
      changePasswordRow.confirmNewPassword.trim().length > 0
    );
  }, [changePasswordRow]);

  const loadClasses = async (sessionId) => {
    if (!sessionId) {
      setClassesList([]);
      return;
    }

    setClassesLoading(true);
    setClassesError("");

    try {
      const res = await api.get("/api/classes", { params: { sessionId } });
      setClassesList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setClassesError("Failed to load classes.");
    } finally {
      setClassesLoading(false);
    }
  };

  const loadMemberClasses = async (sessionId) => {
    if (!sessionId) {
      setMemberClasses([]);
      return;
    }

    try {
      const res = await api.get("/api/classes", { params: { sessionId } });
      setMemberClasses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setMemberErrorModal("Failed to load classes.");
      setMemberClasses([]);
    }
  };

  const loadExistingClassMembers = async (classId) => {
    if (!classId) {
      setMemberSelectedUsers([]);
      setMemberOriginalUserIds([]);
      return;
    }

    setMemberLoadingExisting(true);
    setMemberErrorModal("");

    try {
      const res = await api.get(`/api/classes/${classId}/members`);
      const students = Array.isArray(res.data?.students)
        ? res.data.students
        : Array.isArray(res.data?.Students)
        ? res.data.Students
        : [];

      setMemberSelectedUsers(students);
      setMemberOriginalUserIds(
        students.map((u) => String(u.userId)).sort()
      );
    } catch (e) {
      console.error(e);
      setMemberErrorModal("Failed to load class members.");
      setMemberSelectedUsers([]);
      setMemberOriginalUserIds([]);
    } finally {
      setMemberLoadingExisting(false);
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    if (creating) {
      return (
        newRow.name.trim().length > 0 ||
        newRow.startDate ||
        newRow.endDate ||
        newRow.isActive !== ""
      );
    }

    if (editingSessionId) {
      return true;
    }

    return false;
  }, [creating, newRow, editingSessionId]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    setError("");

    try {
      const res = await api.get("/api/sessions", {
        params: { take: 500 },
      });
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const openEditMembersModal = () => {
    setShowEditMembersModal(true);
  };

  const closeEditMembersModal = () => {
    setShowEditMembersModal(false);
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setChangePasswordRow(createBlankChangePasswordRow());
    setChangePasswordError("");
    setChangePasswordSuccess("");
  };

  const closeChangePasswordModal = () => {
    if (changePasswordBusy) return;

    if (hasUnsavedChangePasswordChanges) {
      const ok = window.confirm(
        "You have unsaved password changes. If you close now, those changes will be lost. Do you still want to close?"
      );
      if (!ok) return;
    }

    setShowChangePasswordModal(false);
    setChangePasswordRow(createBlankChangePasswordRow());
    setChangePasswordError("");
    setChangePasswordSuccess("");
  };

  const saveChangePassword = async () => {
    const currentPassword = changePasswordRow.currentPassword;
    const newPassword = changePasswordRow.newPassword;
    const confirmNewPassword = changePasswordRow.confirmNewPassword;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError("All password fields are required.");
      setChangePasswordSuccess("");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("New password and confirm new password do not match.");
      setChangePasswordSuccess("");
      return;
    }

    if (newPassword === currentPassword) {
      setChangePasswordError("New password must be different from the current password.");
      setChangePasswordSuccess("");
      return;
    }

    setChangePasswordBusy(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");

    try {
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setChangePasswordRow(createBlankChangePasswordRow());
      setChangePasswordSuccess("Password changed successfully.");
    } catch (e) {
      console.error(e);
      setChangePasswordSuccess("");
      setChangePasswordError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to change password."
      );
    } finally {
      setChangePasswordBusy(false);
    }
  };

  const openSessionsModal = async () => {
    setShowSessionsModal(true);
    setCreating(false);
    setNewRow(createBlankRow());
    setEditingSessionId(null);
    setEditingRow(createBlankRow());
    await loadSessions();
  };

  const resetEditing = () => {
    setEditingSessionId(null);
    setEditingRow(createBlankRow());
  };

  const resetCreating = () => {
    setCreating(false);
    setNewRow(createBlankRow());
  };

  const handleCloseSessionsModal = () => {
    if (hasUnsavedChanges) {
      const ok = window.confirm(
        "You have an unsaved session row. If you close now, those changes will be lost. Do you still want to close?"
      );
      if (!ok) return;
    }

    setError("");
    resetEditing();
    resetCreating();
    setShowSessionsModal(false);
  };

  const loadNicknames = async () => {
    setNicknameLoading(true);
    setNicknameError("");
    setNicknameSuccess("");

    try {
      const res = await api.get("/api/teacher/nicknames");
      const rows = Array.isArray(res.data?.nicknames) ? res.data.nicknames : [];
      setNicknames(rows);
      setActiveNicknameId(res.data?.activeNicknameId || "");
    } catch (e) {
      console.error(e);
      setNicknameError("Failed to load nicknames.");
    } finally {
      setNicknameLoading(false);
    }
  };

  const openNicknameModal = async () => {
    setShowNicknameModal(true);
    setNicknameError("");
    setNicknameSuccess("");
    setCreatingNickname(false);
    setNewNicknameRow(createBlankNicknameRow());
    setEditingNicknameId(null);
    setEditingNicknameRow(createBlankNicknameRow());
    await loadNicknames();
  };

  const closeNicknameModal = () => {
    if (nicknameSaving) return;

    const hasUnsavedNew = newNicknameRow.nicknameText.trim().length > 0;
    const hasUnsavedEdit = editingNicknameId && editingNicknameRow.nicknameText.trim().length > 0;

    if (hasUnsavedNew || hasUnsavedEdit) {
      const ok = window.confirm(
        "You have unsaved nickname changes. If you close now, those changes will be lost. Do you still want to close?"
      );
      if (!ok) return;
    }

    setShowNicknameModal(false);
    setNicknameError("");
    setNicknameSuccess("");
    setCreatingNickname(false);
    setNewNicknameRow(createBlankNicknameRow());
    setEditingNicknameId(null);
    setEditingNicknameRow(createBlankNicknameRow());
  };

  const startCreateNickname = () => {
    if (editingNicknameId) {
      setNicknameError("Save or cancel the nickname you are editing before creating a new one.");
      return;
    }

    setNicknameError("");
    setNicknameSuccess("");
    setCreatingNickname(true);
    setNewNicknameRow(createBlankNicknameRow());
  };

  const cancelCreateNickname = () => {
    setCreatingNickname(false);
    setNewNicknameRow(createBlankNicknameRow());
    setNicknameError("");
    setNicknameSuccess("");
  };

  const saveCreateNickname = async () => {
    const nicknameText = newNicknameRow.nicknameText.trim();

    if (!nicknameText) {
      setNicknameError("Nickname is required.");
      return;
    }

    if (nicknameText.length > 80) {
      setNicknameError("Nickname must be 1-80 characters.");
      return;
    }

    setNicknameSaving(true);
    setNicknameError("");
    setNicknameSuccess("");

    try {
      await api.post("/api/teacher/nicknames", {
        nicknameText,
      });

      setCreatingNickname(false);
      setNewNicknameRow(createBlankNicknameRow());
      setNicknameSuccess("Nickname created successfully.");
      await loadNicknames();
    } catch (e) {
      console.error(e);
      setNicknameError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to create nickname."
      );
    } finally {
      setNicknameSaving(false);
    }
  };

  const startEditNickname = (row) => {
    if (creatingNickname) {
      setNicknameError("Save or cancel the new nickname row before editing another nickname.");
      return;
    }

    setEditingNicknameId(row.nicknameId);
    setEditingNicknameRow({
      nicknameText: row.nicknameText ?? "",
    });
    setNicknameError("");
    setNicknameSuccess("");
  };

  const cancelEditNickname = () => {
    setEditingNicknameId(null);
    setEditingNicknameRow(createBlankNicknameRow());
    setNicknameError("");
    setNicknameSuccess("");
  };

  const saveEditNickname = async (nicknameId, existingIsActive) => {
    const nicknameText = editingNicknameRow.nicknameText.trim();

    if (!nicknameText) {
      setNicknameError("Nickname is required.");
      return;
    }

    if (nicknameText.length > 80) {
      setNicknameError("Nickname must be 1-80 characters.");
      return;
    }

    setNicknameSaving(true);
    setNicknameError("");
    setNicknameSuccess("");

    try {
      await api.put(`/api/teacher/nicknames/${nicknameId}`, {
        nicknameText,
        isActive: existingIsActive,
      });

      setEditingNicknameId(null);
      setEditingNicknameRow(createBlankNicknameRow());
      setNicknameSuccess("Nickname updated successfully.");
      await loadNicknames();
    } catch (e) {
      console.error(e);
      setNicknameError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to update nickname."
      );
    } finally {
      setNicknameSaving(false);
    }
  };

  const setActiveNickname = async (nicknameId) => {
    setNicknameSaving(true);
    setNicknameError("");
    setNicknameSuccess("");

    try {
      await api.post("/api/teacher/nicknames/active", {
        nicknameId,
      });

      setActiveNicknameId(nicknameId);
      setNicknameSuccess("Active nickname updated.");
      await loadNicknames();
    } catch (e) {
      console.error(e);
      setNicknameError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to update active nickname."
      );
    } finally {
      setNicknameSaving(false);
    }
  };

  const clearActiveNickname = async () => {
    setNicknameSaving(true);
    setNicknameError("");
    setNicknameSuccess("");

    try {
      await api.post("/api/teacher/nicknames/active", {
        nicknameId: null,
      });

      setActiveNicknameId("");
      setNicknameSuccess("Active nickname cleared.");
      await loadNicknames();
    } catch (e) {
      console.error(e);
      setNicknameError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to clear active nickname."
      );
    } finally {
      setNicknameSaving(false);
    }
  };

  const validateRow = (row) => {
    if (!row.name.trim() || !row.startDate || !row.endDate || row.isActive === "") {
      return "Please complete all fields before saving.";
    }

    if (row.name.trim().length < 3 || row.name.trim().length > 120) {
      return "Session name must be between 3 and 120 characters.";
    }

    if (row.endDate < row.startDate) {
      return "End date cannot be earlier than start date.";
    }

    return "";
  };

  const startEdit = (session) => {
    if (creating) {
      setError("Save or cancel the new session row before editing another session.");
      return;
    }

    setError("");
    setEditingSessionId(session.sessionId);
    setEditingRow({
      name: session.name ?? "",
      startDate: toInputDate(session.startDate),
      endDate: toInputDate(session.endDate),
      isActive: String(session.isActive),
    });
  };

  const cancelEdit = () => {
    setError("");
    resetEditing();
  };

  const saveEdit = async (sessionId) => {
    const validation = validateRow(editingRow);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.put(`/api/sessions/${sessionId}`, {
        name: editingRow.name.trim(),
        startDate: editingRow.startDate,
        endDate: editingRow.endDate,
        isActive: editingRow.isActive === "true",
      });

      resetEditing();
      await loadSessions();
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data && typeof e.response.data === "string"
            ? e.response.data
            : "Failed to update session."
        );
      } finally {
        setSaving(false);
      }
    };

    const openClassesModal = async () => {
      setShowClassesModal(true);
      setClassesError("");
      setCreatingClass(false);
      setNewClassRow(createBlankClassRow());
      setEditingClassId(null);
      setEditingClassRow(createBlankClassRow());

      try {
        const res = await api.get("/api/sessions", { params: { take: 500 } });
        const list = Array.isArray(res.data) ? res.data : [];
        setSessions(list);

        if (!classesSessionId && list.length > 0) {
          const firstId = list[0].sessionId;
          setClassesSessionId(firstId);
          await loadClasses(firstId);
        } else if (classesSessionId) {
          await loadClasses(classesSessionId);
        }
      } catch (e) {
        console.error(e);
        setClassesError("Failed to load sessions.");
      }
    };

    const closeClassesModal = () => {
      if (hasUnsavedClassChanges) {
        const ok = window.confirm(
          "You have an unsaved class row. If you close now, those changes will be lost. Do you still want to close?"
        );
        if (!ok) return;
      }

      setShowClassesModal(false);
      setClassesError("");
      setCreatingClass(false);
      setNewClassRow(createBlankClassRow());
      setEditingClassId(null);
      setEditingClassRow(createBlankClassRow());
    };

    const openClassMembersModal = async () => {
      setShowClassMembersModal(true);
      setMemberErrorModal("");
      setMemberSessionId("");
      setMemberClassId("");
      setMemberClasses([]);
      setMemberSelectedUsers([]);
      setMemberSearch("");
      setMemberSearchResults([]);
      setMemberOriginalUserIds([]);

      try {
        const res = await api.get("/api/sessions", { params: { take: 500 } });
        const list = Array.isArray(res.data) ? res.data : [];
        setSessions(list);
      } catch (e) {
        console.error(e);
        setMemberErrorModal("Failed to load sessions.");
      }
    };

    const closeClassMembersModal = () => {
      if (memberSaving) return;

      if (hasUnsavedMemberChanges) {
        const ok = window.confirm(
          "You have unsaved class member changes. If you close now, those changes will be lost. Do you still want to close?"
        );
        if (!ok) return;
      }

      setShowClassMembersModal(false);
      setMemberErrorModal("");
      setMemberSessionId("");
      setMemberClassId("");
      setMemberClasses([]);
      setMemberSelectedUsers([]);
      setMemberSearch("");
      setMemberSearchResults([]);
      setMemberOriginalUserIds([]);
    };

    const openCreateUserModal = (type) => {
      setCreateUserType(type);
      setCreateUserRow(createBlankUserRow());
      setCreateUserError("");
      setShowCreateUserModal(true);
    };

    const closeCreateUserModal = () => {
      if (createUserBusy) return;

      if (hasUnsavedCreateUserChanges) {
        const ok = window.confirm(
          "You have unsaved user information. If you close now, those changes will be lost. Do you still want to close?"
        );
        if (!ok) return;
      }

      setShowCreateUserModal(false);
      setCreateUserRow(createBlankUserRow());
      setCreateUserError("");
    };

  const startCreate = () => {
    if (editingSessionId) {
      setError("Save or cancel the session you are editing before creating a new one.");
      return;
    }

    if (creating) return;

    setError("");
    setCreating(true);
    setNewRow(createBlankRow());
  };

  const cancelCreate = () => {
    setError("");
    resetCreating();
  };

  const saveCreate = async () => {
    const validation = validateRow(newRow);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/api/sessions", {
        name: newRow.name.trim(),
        startDate: newRow.startDate,
        endDate: newRow.endDate,
        makeActive: newRow.isActive === "true",
      });

      resetCreating();
      await loadSessions();
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to create session."
      );
    } finally {
      setSaving(false);
    }
  };

    const startCreateClass = () => {
      if (!classesSessionId) {
        setClassesError("Please select a session first.");
        return;
      }
      if (editingClassId) {
        setClassesError("Save or cancel the class you are editing before creating a new one.");
        return;
      }

      setClassesError("");
      setCreatingClass(true);
      setNewClassRow(createBlankClassRow());
    };

    const cancelCreateClass = () => {
      if (newClassRow.name.trim()) {
        const ok = window.confirm(
          "You have an unsaved class row. If you cancel now, those changes will be lost. Do you still want to cancel?"
        );
        if (!ok) return;
      }

      setCreatingClass(false);
      setNewClassRow(createBlankClassRow());
      setClassesError("");
    };

    const saveCreateClass = async () => {
      const name = newClassRow.name.trim();

      if (!classesSessionId) {
        setClassesError("Please select a session.");
        return;
      }

      if (name.length < 3 || name.length > 120) {
        setClassesError("Class name must be between 3 and 120 characters.");
        return;
      }

      setClassesSaving(true);
      setClassesError("");

      try {
        await api.post("/api/classes", {
          sessionId: classesSessionId,
          name,
        });

        setCreatingClass(false);
        setNewClassRow(createBlankClassRow());
        await loadClasses(classesSessionId);
      } catch (e) {
        console.error(e);
        setClassesError(
          e?.response?.data && typeof e.response.data === "string"
            ? e.response.data
            : "Failed to create class."
        );
      } finally {
        setClassesSaving(false);
      }
    };

    const startEditClass = (cls) => {
      if (creatingClass) {
        setClassesError("Save or cancel the new class row before editing another class.");
        return;
      }

      setEditingClassId(cls.classId);
      setEditingClassRow({ name: cls.name ?? "" });
      setClassesError("");
    };

    const cancelEditClass = () => {
      setEditingClassId(null);
      setEditingClassRow(createBlankClassRow());
      setClassesError("");
    };

    const saveEditClass = async (classId) => {
      const name = editingClassRow.name.trim();

      if (name.length < 3 || name.length > 120) {
        setClassesError("Class name must be between 3 and 120 characters.");
        return;
      }

      setClassesSaving(true);
      setClassesError("");

      try {
        await api.put(`/api/classes/${classId}`, { name });
        setEditingClassId(null);
        setEditingClassRow(createBlankClassRow());
        await loadClasses(classesSessionId);
      } catch (e) {
        console.error(e);
        setClassesError(
          e?.response?.data && typeof e.response.data === "string"
            ? e.response.data
            : "Failed to update class."
        );
      } finally {
        setClassesSaving(false);
      }
    };

  const addMemberUser = (u) => {
    if (!u?.userId) return;

    const exists = memberSelectedUsers.some(
      (x) => String(x.userId) === String(u.userId)
    );

    if (exists) return;

    setMemberSelectedUsers((prev) => [...prev, u]);
  };

  const removeMemberUser = (userId) => {
    setMemberSelectedUsers((prev) =>
      prev.filter((u) => String(u.userId) !== String(userId))
    );
  };

  const saveClassMembers = async () => {
    if (!memberClassId) {
      setMemberErrorModal("Please select a class.");
      return;
    }

    setMemberSaving(true);
    setMemberErrorModal("");

    try {
      await api.put(`/api/classes/${memberClassId}/members`, {
        studentUserIds: memberSelectedUsers.map((u) => u.userId),
      });
      setShowClassMembersModal(false);
      setMemberErrorModal("");
      setMemberSessionId("");
      setMemberClassId("");
      setMemberClasses([]);
      setMemberSelectedUsers([]);
      setMemberOriginalUserIds([]);
      setMemberSearch("");
      setMemberSearchResults([]);
    } catch (e) {
      console.error(e);
      setMemberErrorModal(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to save class members."
      );
    } finally {
      setMemberSaving(false);
    }
  };

  const saveCreateUser = async () => {
    const email = createUserRow.email.trim();
    const password = createUserRow.password;
    const displayName = createUserRow.displayName.trim();

    if (!email || !password || !displayName) {
      setCreateUserError("Email, password, and display name are required.");
      return;
    }

    setCreateUserBusy(true);
    setCreateUserError("");

    try {
      const url =
        createUserType === "teacher"
          ? "/api/admin/teachers"
          : "/api/admin/students";

      await api.post(url, {
        email,
        password,
        displayName,
      });

      setShowCreateUserModal(false);
      setCreateUserRow(createBlankUserRow());
    } catch (e) {
      console.error(e);
      setCreateUserError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : `Failed to create ${createUserType}.`
      );
    } finally {
      setCreateUserBusy(false);
    }
  };

  return (
    <>
      <Navbar bg="light" expand="md" className="border-bottom">
        <Container fluid className="px-3">
          <Navbar.Brand className="fw-semibold">MAG School Chat</Navbar.Brand>

          <Navbar.Toggle aria-controls="topnav" />
          <Navbar.Collapse id="topnav">
            <Nav className="me-auto"></Nav>

<AppAccountDropdown
              me={me}
              logout={logout}
              canManageSessions={canManageSessions}
              canManageNicknames={canManageNicknames}
              canArchive={canArchive}
              isAdmin={isAdmin}
              openSessionsModal={openSessionsModal}
              openClassesModal={openClassesModal}
              openClassMembersModal={openClassMembersModal}
              openEditMembersModal={openEditMembersModal}
              openCreateUserModal={openCreateUserModal}
              openNicknameModal={openNicknameModal}
              openArchiveModal={openArchiveModal}
              openChangePasswordModal={openChangePasswordModal}
            />
          </Navbar.Collapse>
        </Container>
      </Navbar>

<SessionsModal
        cancelCreate={cancelCreate}
        cancelEdit={cancelEdit}
        creating={creating}
        editingRow={editingRow}
        editingSessionId={editingSessionId}
        error={error}
        formatDateDisplay={formatDateDisplay}
        handleCloseSessionsModal={handleCloseSessionsModal}
        loadingSessions={loadingSessions}
        newRow={newRow}
        saveCreate={saveCreate}
        saveEdit={saveEdit}
        saving={saving}
        sessions={sessions}
        setEditingRow={setEditingRow}
        setNewRow={setNewRow}
        showSessionsModal={showSessionsModal}
        startCreate={startCreate}
        startEdit={startEdit}
      />

<ClassesModal
        cancelCreateClass={cancelCreateClass}
        cancelEditClass={cancelEditClass}
        classesError={classesError}
        classesList={classesList}
        classesLoading={classesLoading}
        classesSaving={classesSaving}
        classesSessionId={classesSessionId}
        closeClassesModal={closeClassesModal}
        createBlankClassRow={createBlankClassRow}
        creatingClass={creatingClass}
        editingClassId={editingClassId}
        editingClassRow={editingClassRow}
        loadClasses={loadClasses}
        newClassRow={newClassRow}
        saveCreateClass={saveCreateClass}
        saveEditClass={saveEditClass}
        sessions={sessions}
        setClassesSessionId={setClassesSessionId}
        setCreatingClass={setCreatingClass}
        setEditingClassId={setEditingClassId}
        setEditingClassRow={setEditingClassRow}
        setNewClassRow={setNewClassRow}
        showClassesModal={showClassesModal}
        startCreateClass={startCreateClass}
        startEditClass={startEditClass}
      />

<ClassMembersModal
        addMemberUser={addMemberUser}
        closeClassMembersModal={closeClassMembersModal}
        loadExistingClassMembers={loadExistingClassMembers}
        loadMemberClasses={loadMemberClasses}
        memberClassId={memberClassId}
        memberClasses={memberClasses}
        memberErrorModal={memberErrorModal}
        memberLoadingExisting={memberLoadingExisting}
        memberSaving={memberSaving}
        memberSearch={memberSearch}
        memberSearchBusy={memberSearchBusy}
        memberSearchResults={memberSearchResults}
        memberSelectedUsers={memberSelectedUsers}
        memberSessionId={memberSessionId}
        removeMemberUser={removeMemberUser}
        saveClassMembers={saveClassMembers}
        sessions={sessions}
        setMemberClassId={setMemberClassId}
        setMemberOriginalUserIds={setMemberOriginalUserIds}
        setMemberSearch={setMemberSearch}
        setMemberSelectedUsers={setMemberSelectedUsers}
        setMemberSessionId={setMemberSessionId}
        showClassMembersModal={showClassMembersModal}
      />

      <EditMembersModal
        show={showEditMembersModal}
        onHide={closeEditMembersModal}
        api={api}
        isAdmin={isAdmin}
      />

<CreateUserModal
        closeCreateUserModal={closeCreateUserModal}
        createUserBusy={createUserBusy}
        createUserError={createUserError}
        createUserRow={createUserRow}
        createUserType={createUserType}
        saveCreateUser={saveCreateUser}
        setCreateUserRow={setCreateUserRow}
        showCreateUserModal={showCreateUserModal}
      />

<NicknamesModal
        activeNicknameId={activeNicknameId}
        cancelCreateNickname={cancelCreateNickname}
        cancelEditNickname={cancelEditNickname}
        clearActiveNickname={clearActiveNickname}
        closeNicknameModal={closeNicknameModal}
        creatingNickname={creatingNickname}
        editingNicknameId={editingNicknameId}
        editingNicknameRow={editingNicknameRow}
        formatDateDisplay={formatDateDisplay}
        newNicknameRow={newNicknameRow}
        nicknameError={nicknameError}
        nicknameLoading={nicknameLoading}
        nicknameSaving={nicknameSaving}
        nicknameSuccess={nicknameSuccess}
        nicknames={nicknames}
        saveCreateNickname={saveCreateNickname}
        saveEditNickname={saveEditNickname}
        setActiveNickname={setActiveNickname}
        setEditingNicknameRow={setEditingNicknameRow}
        setNewNicknameRow={setNewNicknameRow}
        showNicknameModal={showNicknameModal}
        startCreateNickname={startCreateNickname}
        startEditNickname={startEditNickname}
      />

<ChangePasswordModal
        changePasswordBusy={changePasswordBusy}
        changePasswordError={changePasswordError}
        changePasswordRow={changePasswordRow}
        changePasswordSuccess={changePasswordSuccess}
        closeChangePasswordModal={closeChangePasswordModal}
        saveChangePassword={saveChangePassword}
        setChangePasswordRow={setChangePasswordRow}
        showChangePasswordModal={showChangePasswordModal}
      />

<ArchiveModal
        archiveDirectThreadIdSet={archiveDirectThreadIdSet}
        archiveDirectThreads={archiveDirectThreads}
        archiveError={archiveError}
        archiveLoading={archiveLoading}
        archiveRoomIdSet={archiveRoomIdSet}
        archiveRooms={archiveRooms}
        archiveSaving={archiveSaving}
        closeArchiveModal={closeArchiveModal}
        hasArchiveSelection={hasArchiveSelection}
        selectedArchiveDirectThreadIds={selectedArchiveDirectThreadIds}
        selectedArchiveRoomIds={selectedArchiveRoomIds}
        showArchiveModal={showArchiveModal}
        submitArchive={submitArchive}
        toggleAllArchiveDirectThreads={toggleAllArchiveDirectThreads}
        toggleAllArchiveRooms={toggleAllArchiveRooms}
        toggleArchiveDirectThread={toggleArchiveDirectThread}
        toggleArchiveRoom={toggleArchiveRoom}
      />
    </>
  );
}