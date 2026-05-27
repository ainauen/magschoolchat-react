import React from "react";
import { Alert, Button, Form, Modal, Spinner, ListGroup, Table } from "react-bootstrap";

export default function ArchiveModal(props) {
  const {
    archiveDirectThreadIdSet,
    archiveDirectThreads,
    archiveError,
    archiveLoading,
    archiveRoomIdSet,
    archiveRooms,
    archiveSaving,
    closeArchiveModal,
    hasArchiveSelection,
    selectedArchiveDirectThreadIds,
    selectedArchiveRoomIds,
    showArchiveModal,
    submitArchive,
    toggleAllArchiveDirectThreads,
    toggleAllArchiveRooms,
    toggleArchiveDirectThread,
    toggleArchiveRoom
  } = props;

  return (
          <Modal show={showArchiveModal} onHide={closeArchiveModal} centered size="xl">
            <Modal.Header closeButton>
              <Modal.Title>Archive</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {archiveError && (
                <div className="alert alert-danger py-2">
                  {archiveError}
                </div>
              )}

              {archiveLoading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <Spinner animation="border" size="sm" />
                  Loading archive options…
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold">Active Rooms</div>

                      <Form.Check
                        type="checkbox"
                        label="Select all"
                        checked={
                          archiveRooms.length > 0 &&
                          selectedArchiveRoomIds.length === archiveRooms.length
                        }
                        disabled={archiveRooms.length === 0 || archiveSaving}
                        onChange={toggleAllArchiveRooms}
                      />
                    </div>

                    <div className="border rounded-3 overflow-auto" style={{ maxHeight: 420 }}>
                      <table className="table table-sm table-hover mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Room</th>
                            <th>Last Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archiveRooms.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-muted small">
                                No active rooms found.
                              </td>
                            </tr>
                          ) : (
                            archiveRooms.map((r) => (
                              <tr key={r.roomId}>
                                <td>
                                  <Form.Check
                                    type="checkbox"
                                    checked={archiveRoomIdSet.has(String(r.roomId))}
                                    disabled={archiveSaving}
                                    onChange={() => toggleArchiveRoom(r.roomId)}
                                  />
                                </td>
                                <td>
                                  <div className="fw-semibold">{r.name}</div>
                                  {r.className && (
                                    <div className="small text-muted">{r.className}</div>
                                  )}
                                  {r.lastMessagePreview && (
                                    <div className="small text-muted text-truncate">
                                      {r.lastMessagePreview}
                                    </div>
                                  )}
                                </td>
                                <td className="small text-muted">
                                  {r.lastActivityUtc
                                    ? new Date(r.lastActivityUtc).toLocaleString()
                                    : ""}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold">Active Student Direct Chats</div>

                      <Form.Check
                        type="checkbox"
                        label="Select all"
                        checked={
                          archiveDirectThreads.length > 0 &&
                          selectedArchiveDirectThreadIds.length === archiveDirectThreads.length
                        }
                        disabled={archiveDirectThreads.length === 0 || archiveSaving}
                        onChange={toggleAllArchiveDirectThreads}
                      />
                    </div>

                    <div className="border rounded-3 overflow-auto" style={{ maxHeight: 420 }}>
                      <table className="table table-sm table-hover mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Direct Chat</th>
                            <th>Last Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archiveDirectThreads.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-muted small">
                                No active student direct chats found.
                              </td>
                            </tr>
                          ) : (
                            archiveDirectThreads.map((t) => (
                              <tr key={t.directThreadId}>
                                <td>
                                  <Form.Check
                                    type="checkbox"
                                    checked={archiveDirectThreadIdSet.has(String(t.directThreadId))}
                                    disabled={archiveSaving}
                                    onChange={() => toggleArchiveDirectThread(t.directThreadId)}
                                  />
                                </td>
                                <td>
                                  <div className="fw-semibold">
                                    {t.userADisplayName} ↔ {t.userBDisplayName}
                                  </div>
                                  <div className="small text-muted">
                                    {t.userAEmail} / {t.userBEmail}
                                  </div>
                                  {t.lastMessagePreview && (
                                    <div className="small text-muted text-truncate">
                                      {t.lastMessagePreview}
                                    </div>
                                  )}
                                </td>
                                <td className="small text-muted">
                                  {t.lastActivityUtc
                                    ? new Date(t.lastActivityUtc).toLocaleString()
                                    : ""}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={closeArchiveModal}
                disabled={archiveSaving}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                onClick={submitArchive}
                disabled={archiveSaving || archiveLoading || !hasArchiveSelection}
              >
                {archiveSaving ? "Archiving..." : "Archive"}
              </Button>
            </Modal.Footer>
          </Modal>
  );
}
