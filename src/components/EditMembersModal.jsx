import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";

function createEditRow(user) {
  return {
    displayName: user?.displayName ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "Student",
    password: "",
  };
}

function rowsAreDifferent(original, edited) {
  if (!original || !edited) return false;

  return (
    (original.displayName ?? "") !== (edited.displayName ?? "") ||
    (original.email ?? "") !== (edited.email ?? "") ||
    (original.role ?? "") !== (edited.role ?? "") ||
    (edited.password ?? "").trim().length > 0
  );
}

export default function EditMembersModal({
  show,
  onHide,
  api,
  isAdmin,
}) {
  const [members, setMembers] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [editRows, setEditRows] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const editableRoles = isAdmin
    ? ["Teacher", "Student"]
    : ["Student"];

  const loadMembers = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.get("/api/admin/members");
      const rows = Array.isArray(res.data) ? res.data : [];

      setMembers(rows);

      const nextEditRows = {};
      rows.forEach((user) => {
        nextEditRows[user.userId] = createEditRow(user);
      });

      setEditRows(nextEditRows);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to load members."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!show) return;
    setFilterText("");
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const hasUnsavedChanges = useMemo(() => {
    return members.some((member) => {
      const edited = editRows[member.userId];
      return rowsAreDifferent(member, edited);
    });
  }, [members, editRows]);

  const filteredMembers = useMemo(() => {
    const text = filterText.trim().toLowerCase();

    return members
      .filter((member) => {
        if (!text) return true;

        return (
          (member.displayName ?? "").toLowerCase().includes(text) ||
          (member.email ?? "").toLowerCase().includes(text)
        );
      })
      .sort((a, b) => {
        const roleA = a.role === "Teacher" ? 0 : 1;
        const roleB = b.role === "Teacher" ? 0 : 1;

        if (roleA !== roleB) return roleA - roleB;

        return (a.displayName ?? "").localeCompare(b.displayName ?? "");
      });
  }, [members, filterText]);

  const closeModal = () => {
    if (savingUserId) return;

    if (hasUnsavedChanges) {
      const ok = window.confirm(
        "You have unsaved member changes. If you close now, those changes will be lost. Do you still want to close?"
      );

      if (!ok) return;
    }

    setMembers([]);
    setEditRows({});
    setFilterText("");
    setError("");
    setSuccess("");
    onHide();
  };

  const updateEditRow = (userId, field, value) => {
    setEditRows((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));

    setError("");
    setSuccess("");
  };

  const cancelRowChanges = (member) => {
    setEditRows((prev) => ({
      ...prev,
      [member.userId]: createEditRow(member),
    }));

    setError("");
    setSuccess("");
  };

  const saveRow = async (member) => {
    const edited = editRows[member.userId];

    if (!edited) return;

    const displayName = edited.displayName.trim();
    const email = edited.email.trim();
    const role = edited.role;
    const password = edited.password;

    if (!displayName || !email) {
      setError("Display name and email are required.");
      setSuccess("");
      return;
    }

    if (isAdmin && role !== "Teacher" && role !== "Student") {
      setError("Role must be Teacher or Student.");
      setSuccess("");
      return;
    }

    setSavingUserId(member.userId);
    setError("");
    setSuccess("");

    try {
      const res = await api.put(`/api/admin/members/${member.userId}`, {
        displayName,
        email,
        role,
        password: password?.trim() ? password : null,
      });

      const updated = res.data;

      setMembers((prev) =>
        prev.map((x) =>
          x.userId === member.userId
            ? {
                ...x,
                displayName: updated.displayName,
                email: updated.email,
                role: updated.role,
              }
            : x
        )
      );

      setEditRows((prev) => ({
        ...prev,
        [member.userId]: {
          displayName: updated.displayName,
          email: updated.email,
          role: updated.role,
          password: "",
        },
      }));

      setSuccess("Member saved successfully.");
    } catch (e) {
      console.error(e);
      setSuccess("");
      setError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to save member."
      );
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <Modal
      show={show}
      onHide={closeModal}
      size="xl"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Members</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-3">
            {success}
          </Alert>
        )}

        <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
          <div>
            <div className="fw-semibold">
              {isAdmin ? "Teachers and Students" : "Students"}
            </div>
            <div className="small text-muted">
              Edit one row at a time and save the changes on that row.
            </div>
          </div>

          <Form.Control
            style={{ maxWidth: 360 }}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by name or email"
            disabled={loading}
          />
        </div>

        <div className="border rounded-3 overflow-auto">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 220 }}>Name</th>
                <th style={{ minWidth: 260 }}>Email</th>
                <th style={{ minWidth: 150 }}>Role</th>
                <th style={{ minWidth: 220 }}>New Password</th>
                <th style={{ minWidth: 170 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const edited = editRows[member.userId] ?? createEditRow(member);
                  const isDirty = rowsAreDifferent(member, edited);
                  const isSaving = savingUserId === member.userId;

                  return (
                    <tr
                      key={member.userId}
                      className={isDirty ? "table-warning" : ""}
                    >
                      <td>
                        <Form.Control
                          value={edited.displayName}
                          onChange={(e) =>
                            updateEditRow(
                              member.userId,
                              "displayName",
                              e.target.value
                            )
                          }
                          disabled={isSaving}
                          maxLength={100}
                        />
                      </td>

                      <td>
                        <Form.Control
                          type="email"
                          value={edited.email}
                          onChange={(e) =>
                            updateEditRow(
                              member.userId,
                              "email",
                              e.target.value
                            )
                          }
                          disabled={isSaving}
                          maxLength={256}
                        />
                      </td>

                      <td>
                        <Form.Select
                          value={edited.role}
                          onChange={(e) =>
                            updateEditRow(
                              member.userId,
                              "role",
                              e.target.value
                            )
                          }
                          disabled={isSaving || !isAdmin}
                        >
                          {editableRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </Form.Select>
                      </td>

                      <td>
                        <Form.Control
                          type="password"
                          value={edited.password}
                          onChange={(e) =>
                            updateEditRow(
                              member.userId,
                              "password",
                              e.target.value
                            )
                          }
                          disabled={isSaving}
                          placeholder="Leave blank to keep current"
                        />
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => saveRow(member)}
                            disabled={isSaving || !isDirty}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => cancelRowChanges(member)}
                            disabled={isSaving || !isDirty}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={closeModal}
          disabled={!!savingUserId}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}