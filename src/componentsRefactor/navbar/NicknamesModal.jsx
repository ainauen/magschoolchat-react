import React from "react";
import { Alert, Button, Form, Modal, Spinner, ListGroup, Table } from "react-bootstrap";

export default function NicknamesModal(props) {
  const {
    activeNicknameId,
    cancelCreateNickname,
    cancelEditNickname,
    clearActiveNickname,
    closeNicknameModal,
    creatingNickname,
    editingNicknameId,
    editingNicknameRow,
    formatDateDisplay,
    newNicknameRow,
    nicknameError,
    nicknameLoading,
    nicknameSaving,
    nicknameSuccess,
    nicknames,
    saveCreateNickname,
    saveEditNickname,
    setActiveNickname,
    setEditingNicknameRow,
    setNewNicknameRow,
    showNicknameModal,
    startCreateNickname,
    startEditNickname
  } = props;

  return (
          <Modal
            show={showNicknameModal}
            onHide={closeNicknameModal}
            centered
            backdrop="static"
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Edit Nickname</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {nicknameError && <Alert variant="danger">{nicknameError}</Alert>}
              {nicknameSuccess && <Alert variant="success">{nicknameSuccess}</Alert>}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="fw-semibold">Your Nicknames</div>
                  <div className="small text-muted">
                    Choose one active nickname to use later when sending direct messages.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={clearActiveNickname}
                    disabled={nicknameSaving || nicknameLoading}
                  >
                    Clear Active
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startCreateNickname}
                    disabled={nicknameSaving || nicknameLoading || creatingNickname}
                  >
                    Add Nickname
                  </Button>
                </div>
              </div>

              {nicknameLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading nicknames...
                </div>
              ) : (
                <>
                  {creatingNickname && (
                    <div className="border rounded-3 p-3 mb-3 bg-light">
                      <div className="fw-semibold mb-2">New Nickname</div>
                      <Form.Group className="mb-3">
                        <Form.Label>Nickname</Form.Label>
                        <Form.Control
                          value={newNicknameRow.nicknameText}
                          onChange={(e) =>
                            setNewNicknameRow((prev) => ({
                              ...prev,
                              nicknameText: e.target.value,
                            }))
                          }
                          maxLength={80}
                          placeholder="Enter nickname"
                          disabled={nicknameSaving}
                        />
                      </Form.Group>

                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={saveCreateNickname}
                          disabled={nicknameSaving}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={cancelCreateNickname}
                          disabled={nicknameSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {nicknames.length === 0 ? (
                    <div className="text-muted small">
                      No nicknames found yet.
                    </div>
                  ) : (
                    <ListGroup>
                      {nicknames.map((row) => {
                        const isEditing = editingNicknameId === row.nicknameId;
                        const isCurrentActive = activeNicknameId === row.nicknameId;

                        return (
                          <ListGroup.Item
                            key={row.nicknameId}
                            className="d-flex justify-content-between align-items-start gap-3"
                          >
                            <div className="flex-grow-1">
                              {isEditing ? (
                                <>
                                  <Form.Group className="mb-2">
                                    <Form.Label className="small text-muted">Nickname</Form.Label>
                                    <Form.Control
                                      value={editingNicknameRow.nicknameText}
                                      onChange={(e) =>
                                        setEditingNicknameRow((prev) => ({
                                          ...prev,
                                          nicknameText: e.target.value,
                                        }))
                                      }
                                      maxLength={80}
                                      disabled={nicknameSaving}
                                    />
                                  </Form.Group>

                                  <div className="d-flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => saveEditNickname(row.nicknameId, row.isActive)}
                                      disabled={nicknameSaving}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline-secondary"
                                      onClick={cancelEditNickname}
                                      disabled={nicknameSaving}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="fw-semibold">{row.nicknameText}</div>
                                  <div className="small text-muted">
                                    Created: {formatDateDisplay(row.createdUtc)}
                                  </div>
                                  <div className="small mt-1">
                                    {isCurrentActive ? (
                                      <span className="badge text-bg-primary">Active</span>
                                    ) : (
                                      <span className="badge text-bg-light">Inactive</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {!isEditing && (
                              <div className="d-flex flex-column gap-2">
                                <Button
                                  size="sm"
                                  variant={isCurrentActive ? "primary" : "outline-primary"}
                                  onClick={() => setActiveNickname(row.nicknameId)}
                                  disabled={nicknameSaving}
                                >
                                  {isCurrentActive ? "Selected" : "Set Active"}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => startEditNickname(row)}
                                  disabled={nicknameSaving}
                                >
                                  Edit
                                </Button>
                              </div>
                            )}
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  )}
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={closeNicknameModal}
                disabled={nicknameSaving}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
  );
}
