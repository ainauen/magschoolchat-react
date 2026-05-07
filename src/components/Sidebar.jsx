import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, ListGroup, Spinner, Modal } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

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
      <div className="p-3 border-bottom">
        <Form.Control
          className="rounded-3"
          placeholder="Search users to message…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="d-flex align-items-center gap-2 mt-2">
          <Button
            variant="outline-secondary"
            className="rounded-3"
            onClick={() => setQuery("")}
            disabled={!query}
          >
            Clear
          </Button>

          {canManageRooms && (
            <Button
              variant="primary"
              className="rounded-3 ms-auto"
              onClick={openCreateRoomModal}
            >
              New Room
            </Button>
          )}
          {busy && (
            <div className="ms-auto d-flex align-items-center gap-2 text-muted small">
              <Spinner animation="border" size="sm" />
              Searching…
            </div>
          )}
        </div>

        {error && <div className="text-danger small mt-2">{error}</div>}

        {results.length > 0 && (
          <ListGroup className="mt-3">
            {results.map((u) => (
              <ListGroup.Item
                key={u.userId}
                action
                className="rounded-3"
                onClick={() => onOpenDirect?.(u)}
              >
                <div className="fw-semibold">{u.displayName}</div>
                <div className="small text-muted">{u.email}</div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <div className="small text-muted mt-3">Type at least 2 characters to search.</div>
      </div>

      <div className="p-3 border-bottom">
        <Button
          variant="link"
          className="p-0 text-decoration-none d-flex align-items-center justify-content-between w-100"
          onClick={() => setShowRooms((prev) => !prev)}
        >
          <span className={unreadRoomCount > 0 ? "fw-bold" : "fw-semibold"}>
            Rooms
            {recentRooms.length > 0 && (
              <span className="text-muted ms-1">({recentRooms.length})</span>
            )}
            {unreadRoomCount > 0 && (
              <span className="badge bg-primary ms-2">{unreadRoomCount}</span>
            )}
          </span>
          <span>{showRooms ? "▾" : "▸"}</span>
        </Button>

        {showRooms && (
          <div className="mt-2">
            {recentRooms.length === 0 ? (
              <div className="small text-muted">No rooms yet.</div>
            ) : (
              <ListGroup>
                {recentRooms.map((r) => {
                  const unread = isRoomUnread(r.roomId);

                  return (
                    <ListGroup.Item
                      key={r.roomId}
                      action
                      onClick={() => onOpenRoom?.(r)}
                    >
                      <div className={unread ? "fw-bold" : "fw-semibold"}>
                        {r.name}
                      </div>

                      {r.className && (
                        <div className="small text-muted">
                          {r.className}
                        </div>
                      )}

                      <div className={`small text-truncate ${unread ? "fw-bold" : "text-muted"}`}>
                        {r.lastMessagePreview || "No messages yet."}
                      </div>

                      <div className="small text-muted">
                        {r.lastActivityUtc
                          ? new Date(r.lastActivityUtc).toLocaleString()
                          : ""}
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}
          </div>
        )}
      </div>

      {canManageRooms && (
        <div className="p-3 border-bottom">
          <Button
            variant="link"
            className="p-0 text-decoration-none d-flex align-items-center justify-content-between w-100"
            onClick={() => setShowArchivedRooms((prev) => !prev)}
          >
            <span className="fw-semibold">Archived Rooms</span>
            <span>{showArchivedRooms ? "▾" : "▸"}</span>
          </Button>

          {showArchivedRooms && (
          <div className="mt-2">
              {archivedRoomsBusy && (
                <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                  <Spinner animation="border" size="sm" />
                  Loading archived rooms…
                </div>
              )}

              {archivedRoomsError && (
                <div className="text-danger small mb-2">
                  {archivedRoomsError}
                </div>
              )}

              {!archivedRoomsBusy && archivedRooms.length === 0 ? (
                <div className="small text-muted">No archived rooms.</div>
              ) : (
                <ListGroup>
                  {archivedRooms.map((r) => (
                    <ListGroup.Item
                      key={r.roomId}
                      action
                      onClick={() => onOpenRoom?.({ ...r, isArchived: true })}
                    >
                      <div className="fw-semibold">{r.name}</div>

                      {r.className && (
                        <div className="small text-muted">
                          {r.className}
                        </div>
                      )}

                      <div className="small text-muted text-truncate">
                        {r.lastMessagePreview || "No messages."}
                      </div>

                      <div className="small text-muted">
                        {r.lastActivityUtc
                          ? new Date(r.lastActivityUtc).toLocaleString()
                          : ""}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-3 small text-muted">
        <Button
          variant="link"
          className="p-0 text-decoration-none d-flex align-items-center justify-content-between w-100"
          onClick={() => setShowDirectMessages((prev) => !prev)}
        >
          <span className={unreadDirectCount > 0 ? "fw-bold" : "fw-semibold"}>
            Direct Messages
            {recentThreads.length > 0 && (
              <span className="text-muted ms-1">({recentThreads.length})</span>
            )}
            {unreadDirectCount > 0 && (
              <span className="badge bg-primary ms-2">{unreadDirectCount}</span>
            )}
          </span>
          <span>{showDirectMessages ? "▾" : "▸"}</span>
        </Button>

        {showDirectMessages && (
          <div className="mt-2">
            {recentBusy && (
              <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                <Spinner animation="border" size="sm" />
                Loading…
              </div>
            )}

            {recentError && <div className="text-danger small mb-2">{recentError}</div>}

            {recentThreads.length === 0 && !recentBusy ? (
              <div className="small text-muted">No direct messages yet.</div>
            ) : (
              <ListGroup>
                {recentThreads.map((t) => {
                  const unread = isDirectUnread(t.directThreadId);

                  return (
                    <ListGroup.Item
                      key={t.directThreadId}
                      action
                      onClick={() =>
                        onOpenDirect?.({
                          userId: t.otherUserId,
                          displayName: t.otherDisplayName,
                          email: t.otherEmail
                        })
                      }
                    >
                      <div className={unread ? "fw-bold" : "fw-semibold"}>
                        {t.otherDisplayName}
                      </div>

                      <div className={`small text-truncate ${unread ? "fw-bold" : "text-muted"}`}>
                        {t.lastMessagePreview || "No messages yet."}
                      </div>

                      <div className="small text-muted">
                        {t.lastActivityUtc
                          ? new Date(t.lastActivityUtc).toLocaleString()
                          : ""}
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}
          </div>
        )}
      </div>

      <Modal show={showCreateRoom} onHide={closeCreateRoomModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Room</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Session</Form.Label>
            <Form.Select
              value={sessionId}
              onChange={(e) => {
                  setSessionId(e.target.value);
                  setClassId("");
                  setClasses([]);
                }}
              disabled={sessionsBusy || createBusy}
            >
              <option value="">
                {sessionsBusy ? "Loading active sessions..." : "Select an active session"}
              </option>
              {activeSessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Class</Form.Label>
            <Form.Select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={!sessionId || classesBusy || createBusy}
            >
              <option value="">
                {!sessionId
                  ? "Select a session first"
                  : classesBusy
                    ? "Loading classes..."
                    : "Select a class"}
              </option>

              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.name}
                </option>
              ))}
            </Form.Select>

            {sessionId && !classesBusy && classes.length === 0 && (
              <div className="small text-muted mt-1">
                No classes found for this session.
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Room Name</Form.Label>
            <Form.Control
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              disabled={createBusy}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Add Users</Form.Label>
            <Form.Control
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Search users to add to this room..."
              disabled={createBusy}
            />
            <div className="small text-muted mt-1">
              Type at least 2 characters to search.
            </div>
          </Form.Group>

          {memberBusy && (
            <div className="d-flex align-items-center gap-2 text-muted small mb-2">
              <Spinner animation="border" size="sm" />
              Searching users…
            </div>
          )}

          {memberError && <div className="text-danger small mb-3">{memberError}</div>}

          {filteredMemberResults.length > 0 && (
            <>
              <div className="fw-semibold mb-2">Search Results</div>
              <ListGroup className="mb-3">
                {filteredMemberResults.map((u) => (
                  <ListGroup.Item
                    key={u.userId}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="fw-semibold">{u.displayName}</div>
                      <div className="small text-muted">{u.email}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => addSelectedUser(u)}
                      disabled={createBusy}
                    >
                      Add
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}

          <div className="fw-semibold mb-2">Selected Members</div>
          {selectedUsers.length === 0 ? (
            <div className="small text-muted mb-3">No users selected yet.</div>
          ) : (
            <ListGroup className="mb-3">
              {selectedUsers.map((u) => (
                <ListGroup.Item
                  key={u.userId}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-semibold">{u.displayName}</div>
                    <div className="small text-muted">{u.email}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => removeSelectedUser(u.userId)}
                    disabled={createBusy}
                  >
                    Remove
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}

          {createError && <div className="text-danger small">{createError}</div>}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={closeCreateRoomModal}
            disabled={createBusy}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateRoom}
            disabled={createBusy || sessionsBusy || classesBusy || !sessionId || !classId}
          >
            {createBusy ? "Creating..." : "Create Room"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}