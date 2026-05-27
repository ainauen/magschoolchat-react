export function normalizeAttachment(a) {
  return {
    attachmentId: a?.attachmentId ?? a?.AttachmentId,
    fileName:
      a?.fileName ??
      a?.FileName ??
      a?.originalFileName ??
      a?.OriginalFileName,
    contentType: a?.contentType ?? a?.ContentType,
    sizeBytes: a?.sizeBytes ?? a?.SizeBytes,
  };
}

export function formatBytes(bytes) {
  if (bytes == null) return "";

  const size = Number(bytes);
  if (Number.isNaN(size)) return "";

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
