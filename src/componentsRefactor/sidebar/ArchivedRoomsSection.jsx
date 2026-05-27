import React from "react";
import { Button, ListGroup, Spinner } from "react-bootstrap";

export default function ArchivedRoomsSection({
  canManageRooms,
  showArchivedRooms,
  setShowArchivedRooms,
  archivedRooms = [],
  archivedRoomsBusy,
  archivedRoomsError,
  onOpenRoom,
}) {
  if (!canManageRooms) return null;

  return (
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
  );
}
