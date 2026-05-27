import React from "react";
import { Alert, Button, Form, Modal, Spinner, ListGroup, Table } from "react-bootstrap";

export default function ClassMembersModal(props) {
  const {
    addMemberUser,
    closeClassMembersModal,
    loadExistingClassMembers,
    loadMemberClasses,
    memberClassId,
    memberClasses,
    memberErrorModal,
    memberLoadingExisting,
    memberSaving,
    memberSearch,
    memberSearchBusy,
    memberSearchResults,
    memberSelectedUsers,
    memberSessionId,
    removeMemberUser,
    saveClassMembers,
    sessions,
    setMemberClassId,
    setMemberOriginalUserIds,
    setMemberSearch,
    setMemberSelectedUsers,
    setMemberSessionId,
    showClassMembersModal,
  } = props;

  return (
          <Modal
            show={showClassMembersModal}
            onHide={closeClassMembersModal}
            size="lg"
            centered
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>Class Members</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {memberErrorModal && <Alert variant="danger">{memberErrorModal}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Session</Form.Label>
                <Form.Select
                  value={memberSessionId}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setMemberSessionId(value);
                    setMemberClassId("");
                    setMemberSelectedUsers([]);
                    setMemberOriginalUserIds([]);
                    await loadMemberClasses(value);
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

              <Form.Group className="mb-3">
                <Form.Label>Class</Form.Label>
                <Form.Select
                  value={memberClassId}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setMemberClassId(value);
                    await loadExistingClassMembers(value);
                  }}
                  disabled={!memberSessionId}
                >
                  <option value="">Select a class</option>
                  {memberClasses.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {memberClassId && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Search Students</Form.Label>
                    <Form.Control
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Type student names to add..."
                      disabled={memberSaving}
                    />
                    <div className="small text-muted mt-1">
                      Type at least 2 characters to search.
                    </div>
                  </Form.Group>

                  {memberSearchBusy && (
                    <div className="d-flex align-items-center gap-2 text-muted small mb-3">
                      <Spinner animation="border" size="sm" />
                      Searching students...
                    </div>
                  )}

                  {memberLoadingExisting && (
                    <div className="d-flex align-items-center gap-2 text-muted small mb-3">
                      <Spinner animation="border" size="sm" />
                      Loading current class members...
                    </div>
                  )}

                  {memberSearchResults.length > 0 && (
                    <>
                      <div className="fw-semibold mb-2">Search Results</div>
                      <ListGroup className="mb-3">
                        {memberSearchResults.map((u) => (
                          <ListGroup.Item
                            key={u.userId}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="fw-semibold">{u.displayName}</div>
                              <div className="small text-muted">{u.email}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => addMemberUser(u)}
                              disabled={memberSaving}
                            >
                              Add
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </>
                  )}

                  <div className="fw-semibold mb-2">Current Members</div>
                  {memberSelectedUsers.length === 0 ? (
                    <div className="small text-muted">No students selected for this class.</div>
                  ) : (
                    <ListGroup>
                      {memberSelectedUsers.map((u) => (
                        <ListGroup.Item
                          key={u.userId}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold">{u.displayName}</div>
                            <div className="small text-muted">{u.email}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => removeMemberUser(u.userId)}
                            disabled={memberSaving}
                          >
                            Remove
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="outline-secondary" onClick={closeClassMembersModal} disabled={memberSaving}>
                Close
              </Button>
              <Button variant="primary" onClick={saveClassMembers} disabled={!memberClassId || memberSaving}>
                {memberSaving ? "Saving..." : "Save"}
              </Button>
            </Modal.Footer>
          </Modal>
  );
}
