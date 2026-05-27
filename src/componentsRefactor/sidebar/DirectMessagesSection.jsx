import React from "react";
import { Button, ListGroup, Spinner } from "react-bootstrap";

export default function DirectMessagesSection({
  showDirectMessages,
  setShowDirectMessages,
  recentThreads = [],
  recentBusy,
  recentError,
  unreadDirectCount,
  isDirectUnread,
  onOpenDirect,
}) {
  return (
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
  );
}
