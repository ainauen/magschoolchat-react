import React from "react";
import { Badge, Button, Col, Form, Row } from "react-bootstrap";

export default function ChatComposer({
  activeView,
  selectedRoom,
  isTeacher,
  selectedPostAs,
  nicknameOptions = [],
  nicknameBusy,
  sendBusy,
  draft,
  setDraft,
  pendingFiles = [],
  fileError,
  onFilesSelected,
  removePendingFile,
  handlePostAsChange,
  onComposerKeyDown,
  onSendDirect,
  onSendRoom,
}) {
  const isArchivedRoom = activeView === "room" && selectedRoom?.isArchived;

  return (
    <div className="chat-composer border-top px-3 py-3">
      {isArchivedRoom && (
        <div className="alert alert-secondary py-2 mb-3">
          This room is archived and read-only.
        </div>
      )}

      <Row className="g-2 align-items-end">
        {isTeacher && (
          <Col xs={12} md={4} lg={3}>
            <Form.Label className="small text-muted mb-1">Post as</Form.Label>
            <Form.Select
              className="rounded-3"
              value={selectedPostAs}
              onChange={handlePostAsChange}
              disabled={nicknameBusy || sendBusy}
            >
              <option value="">Regular display name</option>
              {nicknameOptions.map((n) => (
                <option key={n.nicknameId} value={n.nicknameId}>
                  {n.nicknameText}
                </option>
              ))}
            </Form.Select>
          </Col>
        )}

        <Col xs={12} md={isTeacher ? 5 : 8} lg={isTeacher ? 6 : 8}>
          <Form.Label className="small text-muted mb-1">Message</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            className="rounded-3"
            placeholder={
              activeView === "direct"
                ? "Type a message… (Enter to send, Shift+Enter for new line)"
                : activeView === "room"
                  ? "Type a room message… (Enter to send, Shift+Enter for new line)"
                  : "Select a chat first…"
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onComposerKeyDown}
            disabled={!activeView || sendBusy || isArchivedRoom}
          />

          {pendingFiles.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-2">
              {pendingFiles.map((f, idx) => (
                <Badge
                  key={`${f.name}-${idx}`}
                  bg="light"
                  text="dark"
                  className="border rounded-pill px-2 py-2"
                >
                  {f.name}{" "}
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 ms-1 text-danger"
                    onClick={() => removePendingFile(idx)}
                    disabled={sendBusy}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {fileError && (
            <div className="small text-danger mt-1">{fileError}</div>
          )}
        </Col>

        <Col xs={12} md={3} lg={3}>
          <div className="d-grid gap-2">
            <Form.Label className="btn btn-outline-secondary rounded-3 mb-0">
              Attach
              <Form.Control
                type="file"
                multiple
                className="d-none"
                onChange={onFilesSelected}
                disabled={!activeView || sendBusy || isArchivedRoom}
              />
            </Form.Label>

            <Button
              className="rounded-3 fw-semibold"
              onClick={() => {
                if (activeView === "direct") onSendDirect?.();
                else if (activeView === "room") onSendRoom?.();
              }}
              disabled={
                !activeView ||
                sendBusy ||
                isArchivedRoom ||
                (draft.trim().length === 0 && pendingFiles.length === 0)
              }
            >
              {sendBusy ? "Sending…" : "Send"}
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}
