import React from "react";
import { Alert, Button, Form, Modal, Spinner, ListGroup, Table } from "react-bootstrap";

export default function ChangePasswordModal(props) {
  const {
    changePasswordBusy,
    changePasswordError,
    changePasswordRow,
    changePasswordSuccess,
    closeChangePasswordModal,
    saveChangePassword,
    setChangePasswordRow,
    showChangePasswordModal
  } = props;

  return (
          <Modal
            show={showChangePasswordModal}
            onHide={closeChangePasswordModal}
            centered
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>Change Password</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {changePasswordError && (
                <Alert variant="danger">{changePasswordError}</Alert>
              )}

              {changePasswordSuccess && (
                <Alert variant="success">{changePasswordSuccess}</Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={changePasswordRow.currentPassword}
                  onChange={(e) =>
                    setChangePasswordRow((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                  disabled={changePasswordBusy}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={changePasswordRow.newPassword}
                  onChange={(e) =>
                    setChangePasswordRow((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                  disabled={changePasswordBusy}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={changePasswordRow.confirmNewPassword}
                  onChange={(e) =>
                    setChangePasswordRow((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                  placeholder="Re-enter new password"
                  disabled={changePasswordBusy}
                />
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={closeChangePasswordModal}
                disabled={changePasswordBusy}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={saveChangePassword}
                disabled={changePasswordBusy}
              >
                {changePasswordBusy ? "Saving..." : "Save"}
              </Button>
            </Modal.Footer>
          </Modal>
  );
}
