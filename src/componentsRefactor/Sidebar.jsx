import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, ListGroup, Spinner, Modal } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";
import UserSearchPanel from "./sidebar/UserSearchPanel";
import RoomsSection from "./sidebar/RoomsSection";
import ArchivedRoomsSection from "./sidebar/ArchivedRoomsSection";
import DirectMessagesSection from "./sidebar/DirectMessagesSection";
import CreateRoomModal from "./sidebar/CreateRoomModal";

export default function Sidebar({
    onOpenDirect,
    onOpenRoom,
    onCreateRoom,
    recentThreads = [],
    recentRooms = [],
    archivedRooms = [],
    archivedRoomsBusy = false,
    archivedRoomsError = "",
    recentBusy,
    recentError,
    unreadDirectThreadIds = new Set(),
    unreadRoomIds = new Set()
  }) {
    
  const { api, hasRole } = useAuth();
  const canManageRooms = hasRole("Teacher") || hasRole("Administrator");

  const isDirectUnread = (threadId) => unreadDirectThreadIds?.has?.(String(threadId));
  const isRoomUnread = (roomId) => unreadRoomIds?.has?.(String(roomId));
  const unreadRoomCount = recentRooms.filter((r) => isRoomUnread(r.roomId)).length;
  const unreadDirectCount = recentThreads.filter((t) =>
    isDirectUnread(t.directThreadId)
  ).length;
  const [showArchivedRooms, setShowArchivedRooms] = useState(false);

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsBusy, setSessionsBusy] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [classes, setClasses] = useState([]);
  const [classesBusy, setClassesBusy] = useState(false);
  const [classId, setClassId] = useState("");
  const [showRooms, setShowRooms] = useState(true);
  const [showDirectMessages, setShowDirectMessages] = useState(true);

  const [memberQuery, setMemberQuery] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberResults, setMemberResults] = useState([]);
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    let timer = null;

    const run = async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setError("");
        return;
      }

      setBusy(true);
      setError("");
      try {
        const res = await api.get("/api/users/search", { params: { q, take: 20 } });
        setResults(res.data || []);
      } catch {
        setError("User search failed.");
      } finally {
        setBusy(false);
      }
    };

    timer = setTimeout(run, 250);
    return () => clearTimeout(timer);
  }, [query, api]);

  useEffect(() => {
    if (!showCreateRoom) return;

    let timer = null;

    const run = async () => {
      const q = memberQuery.trim();
      if (q.length < 2) {
        setMemberResults([]);
        setMemberError("");
        return;
      }

      setMemberBusy(true);
      setMemberError("");
      try {
        const res = await api.get("/api/users/search", { params: { q, take: 20 } });
        setMemberResults(res.data || []);
      } catch {
        setMemberError("User search failed.");
      } finally {
        setMemberBusy(false);
      }
    };

    timer = setTimeout(run, 250);
    return () => clearTimeout(timer);
  }, [memberQuery, api, showCreateRoom]);

  const selectedUserIds = useMemo(
    () => new Set(selectedUsers.map((u) => String(u.userId))),
    [selectedUsers]
  );

  useEffect(() => {
    if (!showCreateRoom || !sessionId) {
      setClasses([]);
      setClassId("");
      return;
    }

    let cancelled = false;

    const loadClasses = async () => {
      setClassesBusy(true);
      setCreateError("");

      try {
        const res = await api.get("/api/classes", {
          params: { sessionId }
        });

        if (cancelled) return;

        const list = Array.isArray(res.data) ? res.data : [];
        setClasses(list);

        if (list.length === 1) {
          setClassId(list[0].classId);
        } else {
          setClassId("");
        }
      } catch {
        if (!cancelled) {
          setClasses([]);
          setClassId("");
          setCreateError("Failed to load classes for the selected session.");
        }
      } finally {
        if (!cancelled) {
          setClassesBusy(false);
        }
      }
    };

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, [showCreateRoom, sessionId, api]);

  const filteredMemberResults = useMemo(() => {
    return memberResults.filter(
      (u) => !selectedUserIds.has(String(u.userId))
    );
  }, [memberResults, selectedUserIds]);

  const addSelectedUser = (u) => {
    if (!u?.userId) return;
    if (selectedUserIds.has(String(u.userId))) return;
    setSelectedUsers((prev) => [...prev, u]);
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.filter((u) => String(u.userId) !== String(userId))
    );
  };

  const resetCreateRoomModal = () => {
    setRoomName("");
    setSelectedUsers([]);
    setCreateError("");
    setSessionId("");
    setClassId("");
    setClasses([]);
    setActiveSessions([]);
    setSessionsBusy(false);
    setClassesBusy(false);
    setMemberQuery("");
    setMemberResults([]);
    setMemberError("");
  };

  const openCreateRoomModal = async () => {
    setShowCreateRoom(true);
    setCreateError("");
    setSessionsBusy(true);

    try {
      const res = await api.get("/api/sessions/active");
      const list = Array.isArray(res.data) ? res.data : [];
      setActiveSessions(list);

      if (list.length === 1) {
        setSessionId(list[0].sessionId);
      }
    } catch {
      setCreateError("Failed to load active sessions.");
      setActiveSessions([]);
    } finally {
      setSessionsBusy(false);
    }
  };

  const closeCreateRoomModal = () => {
    if (createBusy) return;
    setShowCreateRoom(false);
    resetCreateRoomModal();
  };

  const handleCreateRoom = async () => {
    const name = roomName.trim();

    if (!sessionId) {
      setCreateError("Please select an active session.");
      return;
    }

    if (!classId) {
      setCreateError("Please select a class.");
      return;
    }

    if (!name) {
      setCreateError("Room name is required.");
      return;
    }

    if (selectedUsers.length === 0) {
      setCreateError("Please select at least one user for the room.");
      return;
    }

    setCreateBusy(true);
    setCreateError("");

    try {
      await onCreateRoom?.({
        sessionId,
        classId,
        name,
        roomType: 1,
        users: selectedUsers
      });

      setShowCreateRoom(false);
      resetCreateRoomModal();
    } catch (e) {
      setCreateError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : e?.message || "Failed to create room."
      );
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <div className="h-100 d-flex flex-column">
<UserSearchPanel
        query={query}
        setQuery={setQuery}
        busy={busy}
        error={error}
        results={results}
        canManageRooms={canManageRooms}
        openCreateRoomModal={openCreateRoomModal}
        onOpenDirect={onOpenDirect}
      />

<RoomsSection
        showRooms={showRooms}
        setShowRooms={setShowRooms}
        recentRooms={recentRooms}
        unreadRoomCount={unreadRoomCount}
        isRoomUnread={isRoomUnread}
        onOpenRoom={onOpenRoom}
      />

<ArchivedRoomsSection
        canManageRooms={canManageRooms}
        showArchivedRooms={showArchivedRooms}
        setShowArchivedRooms={setShowArchivedRooms}
        archivedRooms={archivedRooms}
        archivedRoomsBusy={archivedRoomsBusy}
        archivedRoomsError={archivedRoomsError}
        onOpenRoom={onOpenRoom}
      />

<DirectMessagesSection
        showDirectMessages={showDirectMessages}
        setShowDirectMessages={setShowDirectMessages}
        recentThreads={recentThreads}
        recentBusy={recentBusy}
        recentError={recentError}
        unreadDirectCount={unreadDirectCount}
        isDirectUnread={isDirectUnread}
        onOpenDirect={onOpenDirect}
      />

<CreateRoomModal
        showCreateRoom={showCreateRoom}
        closeCreateRoomModal={closeCreateRoomModal}
        sessionId={sessionId}
        setSessionId={setSessionId}
        setClassId={setClassId}
        setClasses={setClasses}
        sessionsBusy={sessionsBusy}
        createBusy={createBusy}
        activeSessions={activeSessions}
        classId={classId}
        classesBusy={classesBusy}
        classes={classes}
        roomName={roomName}
        setRoomName={setRoomName}
        memberQuery={memberQuery}
        setMemberQuery={setMemberQuery}
        memberBusy={memberBusy}
        memberError={memberError}
        filteredMemberResults={filteredMemberResults}
        addSelectedUser={addSelectedUser}
        selectedUsers={selectedUsers}
        removeSelectedUser={removeSelectedUser}
        createError={createError}
        handleCreateRoom={handleCreateRoom}
      />
    </div>
  );
}