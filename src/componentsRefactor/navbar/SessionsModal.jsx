import React from "react";
import { Alert, Button, Form, Modal, Spinner, ListGroup, Table } from "react-bootstrap";

export default function SessionsModal(props) {
  const {
    cancelCreate,
    cancelEdit,
    creating,
    editingRow,
    editingSessionId,
    error,
    formatDateDisplay,
    handleCloseSessionsModal,
    loadingSessions,
    newRow,
    saveCreate,
    saveEdit,
    saving,
    sessions,
    setEditingRow,
    setNewRow,
    showSessionsModal,
    startCreate,
    startEdit
  } = props;

  return (
          <Modal
            show={showSessionsModal}
            onHide={handleCloseSessionsModal}
            size="xl"
            centered
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>Sessions</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <div className="border rounded-3 overflow-auto">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: 240 }}>Name</th>
                      <th style={{ minWidth: 160 }}>Start Date</th>
                      <th style={{ minWidth: 160 }}>End Date</th>
                      <th style={{ minWidth: 140 }}>Active</th>
                      <th style={{ minWidth: 140 }}>Created</th>
                      <th style={{ minWidth: 150 }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingSessions ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" />
                          Loading sessions...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {creating && (
                          <tr className="table-warning">
                            <td>
                              <Form.Control
                                value={newRow.name}
                                onChange={(e) =>
                                  setNewRow((prev) => ({ ...prev, name: e.target.value }))
                                }
                                maxLength={120}
                                placeholder="Session name"
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="date"
                                value={newRow.startDate}
                                onChange={(e) =>
                                  setNewRow((prev) => ({ ...prev, startDate: e.target.value }))
                                }
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="date"
                                value={newRow.endDate}
                                onChange={(e) =>
                                  setNewRow((prev) => ({ ...prev, endDate: e.target.value }))
                                }
                              />
                            </td>
                            <td>
                              <Form.Select
                                value={newRow.isActive}
                                onChange={(e) =>
                                  setNewRow((prev) => ({ ...prev, isActive: e.target.value }))
                                }
                              >
                                <option value="">Select...</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                              </Form.Select>
                            </td>
                            <td className="text-muted">New</td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={saveCreate}
                                  disabled={saving}
                                  title="Save"
                                >
                                  💾
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={cancelCreate}
                                  disabled={saving}
                                  title="Cancel"
                                >
                                  ✖
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {sessions.length === 0 && !creating ? (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">
                              No sessions found.
                            </td>
                          </tr>
                        ) : (
                          sessions.map((session) => {
                            const isEditing = editingSessionId === session.sessionId;

                            return (
                              <tr key={session.sessionId}>
                                <td>
                                  {isEditing ? (
                                    <Form.Control
                                      value={editingRow.name}
                                      onChange={(e) =>
                                        setEditingRow((prev) => ({
                                          ...prev,
                                          name: e.target.value,
                                        }))
                                      }
                                      maxLength={120}
                                    />
                                  ) : (
                                    <div className="fw-semibold">{session.name}</div>
                                  )}
                                </td>

                                <td>
                                  {isEditing ? (
                                    <Form.Control
                                      type="date"
                                      value={editingRow.startDate}
                                      onChange={(e) =>
                                        setEditingRow((prev) => ({
                                          ...prev,
                                          startDate: e.target.value,
                                        }))
                                      }
                                    />
                                  ) : (
                                    formatDateDisplay(session.startDate)
                                  )}
                                </td>

                                <td>
                                  {isEditing ? (
                                    <Form.Control
                                      type="date"
                                      value={editingRow.endDate}
                                      onChange={(e) =>
                                        setEditingRow((prev) => ({
                                          ...prev,
                                          endDate: e.target.value,
                                        }))
                                      }
                                    />
                                  ) : (
                                    formatDateDisplay(session.endDate)
                                  )}
                                </td>

                                <td>
                                  {isEditing ? (
                                    <Form.Select
                                      value={editingRow.isActive}
                                      onChange={(e) =>
                                        setEditingRow((prev) => ({
                                          ...prev,
                                          isActive: e.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">Select...</option>
                                      <option value="true">True</option>
                                      <option value="false">False</option>
                                    </Form.Select>
                                  ) : session.isActive ? (
                                    <span className="badge bg-success">Active</span>
                                  ) : (
                                    <span className="badge bg-secondary">Inactive</span>
                                  )}
                                </td>

                                <td className="text-muted">
                                  {formatDateDisplay(session.createdUtc)}
                                </td>

                                <td>
                                  {isEditing ? (
                                    <div className="d-flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => saveEdit(session.sessionId)}
                                        disabled={saving}
                                        title="Save"
                                      >
                                        💾
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={cancelEdit}
                                        disabled={saving}
                                        title="Cancel"
                                      >
                                        ✖
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => startEdit(session)}
                                      disabled={saving || creating || !!editingSessionId}
                                      title="Edit"
                                    >
                                      ✏️
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </>
                    )}
                  </tbody>
                </Table>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="outline-secondary" onClick={handleCloseSessionsModal}>
                Close
              </Button>
              <Button onClick={startCreate} disabled={creating || !!editingSessionId || saving}>
                Create
              </Button>
            </Modal.Footer>
          </Modal>
  );
}
