import React from "react";
import { Button } from "react-bootstrap";
import { formatBytes, normalizeAttachment } from "../../utils/chatAttachmentUtils";

export default function AttachmentList({ attachments, mine = false, onDownloadAttachment }) {
  const list = Array.isArray(attachments)
    ? attachments.map(normalizeAttachment).filter((a) => a.attachmentId)
    : [];

  if (list.length === 0) return null;

  return (
    <div className="mt-2 d-flex flex-column gap-1">
      {list.map((a) => (
        <div
          key={a.attachmentId}
          className={`d-flex ${mine ? "justify-content-end" : "justify-content-start"}`}
        >
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-3"
            onClick={() => onDownloadAttachment?.(a)}
          >
            📎 {a.fileName || "Attachment"}
            {a.sizeBytes ? ` (${formatBytes(a.sizeBytes)})` : ""}
          </Button>
        </div>
      ))}
    </div>
  );
}
