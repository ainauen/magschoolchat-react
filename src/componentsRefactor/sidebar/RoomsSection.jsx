import React from "react";
import { Button, ListGroup } from "react-bootstrap";

export default function RoomsSection({
  showRooms,
  setShowRooms,
  recentRooms = [],
  unreadRoomCount,
  isRoomUnread,
  onOpenRoom,
}) {
  return (
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
  );
}
