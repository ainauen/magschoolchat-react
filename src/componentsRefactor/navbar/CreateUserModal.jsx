import React from "react";
import { Alert, Button, Form, Modal, Spinner, ListGroup, Table } from "react-bootstrap";

export default function CreateUserModal(props) {
  const {
    closeCreateUserModal,
    createUserBusy,
    createUserError,
    createUserRow,
    createUserType,
    saveCreateUser,
    setCreateUserRow,
    showCreateUserModal
  } = props;

  return (
          <Modal
            show={showCreateUserModal}
            onHide={closeCreateUserModal}
            centered
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {createUserType === "teacher" ? "Create Teacher" : "Create Student"}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {createUserError && <Alert variant="danger">{createUserError}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Display Name</Form.Label>
                <Form.Control
                  value={createUserRow.displayName}
                  onChange={(e) =>
                    setCreateUserRow((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="Enter display name"
                  disabled={createUserBusy}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={createUserRow.email}
                  onChange={(e) =>
                    setCreateUserRow((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email"
                  disabled={createUserBusy}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={createUserRow.password}
                  onChange={(e) =>
                    setCreateUserRow((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter password"
                  disabled={createUserBusy}
                />
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="outline-secondary" onClick={closeCreateUserModal} disabled={createUserBusy}>
                Close
              </Button>
              <Button variant="primary" onClick={saveCreateUser} disabled={createUserBusy}>
                {createUserBusy
                  ? createUserType === "teacher"
                    ? "Creating Teacher..."
                    : "Creating Student..."
                  : "Save"}
              </Button>
            </Modal.Footer>
          </Modal>
  );
}
