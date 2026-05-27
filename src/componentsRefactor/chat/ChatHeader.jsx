import React from "react";
import { Badge, Button } from "react-bootstrap";

export default function ChatHeader({
  activeView,
  activeTitle,
  me,
  isTeacher,
  onOpenSidebar,
}) {
  return (
    <div className="chat-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
      <div className="d-flex align-items-center gap-2">
        <Button
          variant="outline-secondary"
          className="d-lg-none rounded-3"
          onClick={onOpenSidebar}
        >
          ☰
        </Button>

        <div className="fw-semibold">{activeTitle}</div>

        {activeView && (
          <Badge bg="secondary">
            {activeView === "direct" ? "Direct" : "Room"}
          </Badge>
        )}
      </div>

      <div className="small text-muted">
        Signed in as <span className="fw-semibold">{me?.displayName || me?.email}</span>
        {isTeacher && <span className="ms-2">(Teacher)</span>}
      </div>
    </div>
  );
}
