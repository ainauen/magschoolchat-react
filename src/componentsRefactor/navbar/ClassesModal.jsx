import React from "react";
import { Alert, Button, Form, Modal, Spinner, ListGroup, Table } from "react-bootstrap";

export default function ClassesModal(props) {
  const {
    cancelCreateClass,
    cancelEditClass,
    classesError,
    classesList,
    classesLoading,
    classesSaving,
    classesSessionId,
    closeClassesModal,
    createBlankClassRow,
    creatingClass,
    editingClassId,
    editingClassRow,
    loadClasses,
    newClassRow,
    saveCreateClass,
    saveEditClass,
    sessions,
    setClassesSessionId,
    setCreatingClass,
    setEditingClassId,
    setEditingClassRow,
    setNewClassRow,
    showClassesModal,
    startCreateClass,
    startEditClass
  } = props;

  return (
          <Modal
            show={showClassesModal}
            onHide={closeClassesModal}
            size="lg"
            centered
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>Classes</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {classesError && <Alert variant="danger">{classesError}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Session</Form.Label>
                <Form.Select
                  value={classesSessionId}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setClassesSessionId(value);
                    setCreatingClass(false);
                    setEditingClassId(null);
                    setNewClassRow(createBlankClassRow());
                    setEditingClassRow(createBlankClassRow());
                    await loadClasses(value);
                  }}
                >
                  <option value="">Select a session</option>
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="border rounded-3 overflow-auto">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Class Name</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classesLoading ? (
                      <tr>
                        <td colSpan={2} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" />
                          Loading classes...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {creatingClass && (
                          <tr className="table-warning">
                            <td>
                              <Form.Control
                                value={newClassRow.name}
                                onChange={(e) =>
                                  setNewClassRow((prev) => ({ ...prev, name: e.target.value }))
                                }
                                maxLength={120}
                                placeholder="Class name"
                              />
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={saveCreateClass}
                                  disabled={classesSaving}
                                  title="Save"
                                >
                                  💾
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={cancelCreateClass}
                                  disabled={classesSaving}
                                  title="Cancel"
                                >
                                  ✖
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {classesList.length === 0 && !creatingClass ? (
                          <tr>
                            <td colSpan={2} className="text-center text-muted py-4">
                              No classes found.
                            </td>
                          </tr>
                        ) : (
                          classesList.map((cls) => {
                            const isEditing = editingClassId === cls.classId;
                            return (
                              <tr key={cls.classId}>
                                <td>
                                  {isEditing ? (
                                    <Form.Control
                                      value={editingClassRow.name}
                                      onChange={(e) =>
                                        setEditingClassRow((prev) => ({
                                          ...prev,
                                          name: e.target.value,
                                        }))
                                      }
                                      maxLength={120}
                                    />
                                  ) : (
                                    <div className="fw-semibold">{cls.name}</div>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <div className="d-flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => saveEditClass(cls.classId)}
                                        disabled={classesSaving}
                                        title="Save"
                                      >
                                        💾
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={cancelEditClass}
                                        disabled={classesSaving}
                                        title="Cancel"
                                      >
                                        ✖
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => startEditClass(cls)}
                                      disabled={classesSaving || creatingClass || !!editingClassId}
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
              <Button variant="outline-secondary" onClick={closeClassesModal}>
                Close
              </Button>
              <Button
                onClick={startCreateClass}
                disabled={!classesSessionId || creatingClass || !!editingClassId || classesSaving}
              >
                Create
              </Button>
            </Modal.Footer>
          </Modal>
  );
}
