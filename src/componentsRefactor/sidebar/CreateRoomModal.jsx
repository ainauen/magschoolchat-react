import React from "react";
import { Button, Form, ListGroup, Modal, Spinner } from "react-bootstrap";

export default function CreateRoomModal({
  showCreateRoom,
  closeCreateRoomModal,
  sessionId,
  setSessionId,
  setClassId,
  setClasses,
  sessionsBusy,
  createBusy,
  activeSessions = [],
  classId,
  classesBusy,
  classes = [],
  roomName,
  setRoomName,
  memberQuery,
  setMemberQuery,
  memberBusy,
  memberError,
  filteredMemberResults = [],
  addSelectedUser,
  selectedUsers = [],
  removeSelectedUser,
  createError,
  handleCreateRoom,
}) {
  return (
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
  );
}
