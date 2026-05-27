import React from "react";
import { Button, Form, ListGroup, Spinner } from "react-bootstrap";

export default function UserSearchPanel({
  query,
  setQuery,
  busy,
  error,
  results = [],
  canManageRooms,
  openCreateRoomModal,
  onOpenDirect,
}) {
  return (
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
  );
}
