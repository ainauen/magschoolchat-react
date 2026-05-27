import React from "react";
import { Card, Spinner } from "react-bootstrap";
import AttachmentList from "./AttachmentList";

export default function ChatMessageList({
  title,
  messages = [],
  busy = false,
  sendBusy = false,
  emptyText = "No messages yet.",
  idLabel,
  idValue,
  me,
  listEndRef,
  getMessageDisplayName,
  onDownloadAttachment,
}) {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between">
          <div className="fw-semibold">{title}</div>
          {(busy || sendBusy) && (
            <div className="text-muted small d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              {busy ? "Loading…" : "Sending…"}
            </div>
          )}
        </div>

        <div className="mt-3" style={{ maxHeight: "55vh", overflow: "auto" }}>
          {messages.length === 0 ? (
            <div className="text-muted">{emptyText}</div>
          ) : (
            messages.map((m) => {
              const mine =
                me?.userId &&
                String(m.senderUserId ?? m.SenderUserId) === String(me.userId);

              return (
                <div key={m.messageId} className={`mb-3 ${mine ? "text-end" : ""}`}>
                  <div className="small text-muted">
                    <span className="fw-semibold">
                      {getMessageDisplayName?.(m) || "User"}
                    </span>{" "}
                    · {m.createdUtc ? new Date(m.createdUtc).toLocaleString() : ""}
                  </div>

                  {m.body && (
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                  )}

                  <AttachmentList
                    attachments={m.attachments}
                    mine={mine}
                    onDownloadAttachment={onDownloadAttachment}
                  />
                </div>
              );
            })
          )}
          <div ref={listEndRef} />
        </div>

        {idLabel && idValue && (
          <div className="small text-muted mt-3">
            {idLabel}: <span className="font-monospace">{idValue}</span>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
