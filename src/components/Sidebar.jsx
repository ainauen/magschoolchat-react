import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, ListGroup, Spinner, Modal } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar({
  onOpenDirect,
  onOpenRoom,
  onCreateRoom,
  recentThreads = [],
  recentRooms = [],
  recentBusy,
  recentError
}) {
  const { api, hasRole } = useAuth();
  const canManageRooms = hasRole("Teacher") || hasRole("Administrator");

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

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

  const selectedUserIds = useMemo(
    () => new Set(selectedUsers.map((u) => String(u.userId))),
    [selectedUsers]
  );

  const addSelectedUser = (u) => {
    if (!u?.userId) return;
    if (selectedUserIds.has(String(u.userId))) return;
    setSelectedUsers((prev) => [...prev, u]);
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => String(u.userId) !== String(userId)));
  };

  const handleCreateRoom = async () => {
    const name = roomName.trim();
    if (!name) {
      setCreateError("Room name is required.");
      return;
    }

    setCreateBusy(true);
    setCreateError("");

    try {
      await onCreateRoom?.({
        name,
        roomType: 1,
        users: selectedUsers
      });

      setShowCreateRoom(false);
      setRoomName("");
      setSelectedUsers([]);
      setCreateError("");
    } catch {
      setCreateError("Failed to create room.");
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
              onClick={() => setShowCreateRoom(true)}
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
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div
                    className="flex-grow-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => onOpenDirect?.(u)}
                  >
                    <div className="fw-semibold">{u.displayName}</div>
                    <div className="small text-muted">{u.email}</div>
                  </div>

                  {canManageRooms && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => addSelectedUser(u)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <div className="small text-muted mt-3">Type at least 2 characters to search.</div>
      </div>

      <div className="p-3 border-bottom">
        <div className="fw-semibold mb-2">Rooms</div>

        {recentRooms.length === 0 ? (
          <div className="small text-muted">No rooms yet.</div>
        ) : (
          <ListGroup>
            {recentRooms.map((r) => (
              <ListGroup.Item
                key={r.roomId}
                action
                onClick={() => onOpenRoom?.(r)}
              >
                <div className="fw-semibold">{r.name}</div>
                <div className="small text-muted text-truncate">
                  {r.lastMessagePreview || "No messages yet."}
                </div>
                <div className="small text-muted">
                  {r.lastActivityUtc ? new Date(r.lastActivityUtc).toLocaleString() : ""}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      <div className="p-3 small text-muted">
        <div className="fw-semibold mb-2">Direct Messages</div>

        {recentBusy && (
          <div className="d-flex align-items-center gap-2 text-muted small mb-2">
            <Spinner animation="border" size="sm" />
            Loading…
          </div>
        )}

        {recentError && <div className="text-danger small mb-2">{recentError}</div>}

        <ListGroup>
          {recentThreads.map((t) => (
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
              <div className="fw-semibold">{t.otherDisplayName}</div>
              <div className="small text-muted text-truncate">
                {t.lastMessagePreview}
              </div>
              <div className="small text-muted">
                {new Date(t.lastActivityUtc).toLocaleString()}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      <Modal show={showCreateRoom} onHide={() => setShowCreateRoom(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Room</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Room Name</Form.Label>
            <Form.Control
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
            />
          </Form.Group>

          <div className="fw-semibold mb-2">Selected Members</div>
          {selectedUsers.length === 0 ? (
            <div className="small text-muted">Search above and click Add.</div>
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
            onClick={() => setShowCreateRoom(false)}
            disabled={createBusy}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateRoom}
            disabled={createBusy}
          >
            {createBusy ? "Creating..." : "Create Room"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}