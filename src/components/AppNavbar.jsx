import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Dropdown,
  Form,
  Modal,
  Nav,
  Navbar,
  Spinner,
  ListGroup,
  Table,
} from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

function createBlankClassRow() {
  return {
    name: "",
  };
}

function createBlankUserRow() {
  return {
    email: "",
    password: "",
    displayName: "",
  };
}

function toInputDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

function formatDateDisplay(value) {
  if (!value) return "";
  const text = typeof value === "string" ? value.slice(0, 10) : "";
  if (!text) return "";
  const d = new Date(`${text}T00:00:00`);
  if (Number.isNaN(d.getTime())) return text;
  return d.toLocaleDateString();
}

function createBlankRow() {
  return {
    name: "",
    startDate: "",
    endDate: "",
    isActive: "",
  };
}

export default function AppNavbar() {
  const { me, logout, hasRole, api } = useAuth();

  const canManageSessions =
    hasRole("Teacher") || hasRole("Administrator");

  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingRow, setEditingRow] = useState(createBlankRow());

  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState(createBlankRow());

  const canManageClasses = hasRole("Teacher") || hasRole("Administrator");
  const isAdmin = hasRole("Administrator");

  const [showClassesModal, setShowClassesModal] = useState(false);
  const [classesSessionId, setClassesSessionId] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesSaving, setClassesSaving] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingClassRow, setEditingClassRow] = useState(createBlankClassRow());
  const [creatingClass, setCreatingClass] = useState(false);
  const [newClassRow, setNewClassRow] = useState(createBlankClassRow());

  const [showClassMembersModal, setShowClassMembersModal] = useState(false);
  const [memberSessionId, setMemberSessionId] = useState("");
  const [memberClassId, setMemberClassId] = useState("");
  const [memberClasses, setMemberClasses] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSearchBusy, setMemberSearchBusy] = useState(false);
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [memberSelectedUsers, setMemberSelectedUsers] = useState([]);
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberLoadingExisting, setMemberLoadingExisting] = useState(false);
  const [memberErrorModal, setMemberErrorModal] = useState("");
  const [memberOriginalUserIds, setMemberOriginalUserIds] = useState([]);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserType, setCreateUserType] = useState("student"); // "student" | "teacher"
  const [createUserRow, setCreateUserRow] = useState(createBlankUserRow());
  const [createUserBusy, setCreateUserBusy] = useState(false);
  const [createUserError, setCreateUserError] = useState("");

  useEffect(() => {
    if (!showClassMembersModal) return;

    const timer = setTimeout(async () => {
      const q = memberSearch.trim();

      if (q.length < 2) {
        setMemberSearchResults([]);
        return;
      }

      setMemberSearchBusy(true);
      setMemberErrorModal("");

      try {
        const res = await api.get("/api/users/search", {
          params: { q, take: 20, role: "Student" },
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        const selectedIds = new Set(memberSelectedUsers.map((u) => String(u.userId)));

        setMemberSearchResults(
          rows.filter((u) => !selectedIds.has(String(u.userId)))
        );
      } catch (e) {
        console.error(e);
        setMemberErrorModal("Student search failed.");
      } finally {
        setMemberSearchBusy(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [memberSearch, memberSelectedUsers, showClassMembersModal, api]);



  const hasUnsavedClassChanges = useMemo(() => {
    if (creatingClass) return newClassRow.name.trim().length > 0;
    if (editingClassId) return true;
    return false;
  }, [creatingClass, newClassRow, editingClassId]);

  const hasUnsavedMemberChanges = useMemo(() => {
    const currentIds = memberSelectedUsers.map((u) => String(u.userId)).sort();

    if (currentIds.length !== memberOriginalUserIds.length) return true;

    for (let i = 0; i < currentIds.length; i++) {
      if (currentIds[i] !== memberOriginalUserIds[i]) return true;
    }

    return memberSearch.trim().length > 0;
  }, [memberSelectedUsers, memberOriginalUserIds, memberSearch]);

  const hasUnsavedCreateUserChanges = useMemo(() => {
    return (
      createUserRow.email.trim().length > 0 ||
      createUserRow.password.trim().length > 0 ||
      createUserRow.displayName.trim().length > 0
    );
  }, [createUserRow]);

  const loadClasses = async (sessionId) => {
    if (!sessionId) {
      setClassesList([]);
      return;
    }

    setClassesLoading(true);
    setClassesError("");

    try {
      const res = await api.get("/api/classes", { params: { sessionId } });
      setClassesList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setClassesError("Failed to load classes.");
    } finally {
      setClassesLoading(false);
    }
  };

  const loadMemberClasses = async (sessionId) => {
    if (!sessionId) {
      setMemberClasses([]);
      return;
    }

    try {
      const res = await api.get("/api/classes", { params: { sessionId } });
      setMemberClasses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setMemberErrorModal("Failed to load classes.");
      setMemberClasses([]);
    }
  };

  const loadExistingClassMembers = async (classId) => {
    if (!classId) {
      setMemberSelectedUsers([]);
      setMemberOriginalUserIds([]);
      return;
    }

    setMemberLoadingExisting(true);
    setMemberErrorModal("");

    try {
      const res = await api.get(`/api/classes/${classId}/members`);
      const students = Array.isArray(res.data?.students)
        ? res.data.students
        : Array.isArray(res.data?.Students)
        ? res.data.Students
        : [];

      setMemberSelectedUsers(students);
      setMemberOriginalUserIds(
        students.map((u) => String(u.userId)).sort()
      );
    } catch (e) {
      console.error(e);
      setMemberErrorModal("Failed to load class members.");
      setMemberSelectedUsers([]);
      setMemberOriginalUserIds([]);
    } finally {
      setMemberLoadingExisting(false);
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    if (creating) {
      return (
        newRow.name.trim().length > 0 ||
        newRow.startDate ||
        newRow.endDate ||
        newRow.isActive !== ""
      );
    }

    if (editingSessionId) {
      return true;
    }

    return false;
  }, [creating, newRow, editingSessionId]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    setError("");

    try {
      const res = await api.get("/api/sessions", {
        params: { take: 500 },
      });
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const openSessionsModal = async () => {
    setShowSessionsModal(true);
    setCreating(false);
    setNewRow(createBlankRow());
    setEditingSessionId(null);
    setEditingRow(createBlankRow());
    await loadSessions();
  };

  const resetEditing = () => {
    setEditingSessionId(null);
    setEditingRow(createBlankRow());
  };

  const resetCreating = () => {
    setCreating(false);
    setNewRow(createBlankRow());
  };

  const handleCloseSessionsModal = () => {
    if (hasUnsavedChanges) {
      const ok = window.confirm(
        "You have an unsaved session row. If you close now, those changes will be lost. Do you still want to close?"
      );
      if (!ok) return;
    }

    setError("");
    resetEditing();
    resetCreating();
    setShowSessionsModal(false);
  };

  const validateRow = (row) => {
    if (!row.name.trim() || !row.startDate || !row.endDate || row.isActive === "") {
      return "Please complete all fields before saving.";
    }

    if (row.name.trim().length < 3 || row.name.trim().length > 120) {
      return "Session name must be between 3 and 120 characters.";
    }

    if (row.endDate < row.startDate) {
      return "End date cannot be earlier than start date.";
    }

    return "";
  };

  const startEdit = (session) => {
    if (creating) {
      setError("Save or cancel the new session row before editing another session.");
      return;
    }

    setError("");
    setEditingSessionId(session.sessionId);
    setEditingRow({
      name: session.name ?? "",
      startDate: toInputDate(session.startDate),
      endDate: toInputDate(session.endDate),
      isActive: String(session.isActive),
    });
  };

  const cancelEdit = () => {
    setError("");
    resetEditing();
  };

  const saveEdit = async (sessionId) => {
    const validation = validateRow(editingRow);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.put(`/api/sessions/${sessionId}`, {
        name: editingRow.name.trim(),
        startDate: editingRow.startDate,
        endDate: editingRow.endDate,
        isActive: editingRow.isActive === "true",
      });

      resetEditing();
      await loadSessions();
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data && typeof e.response.data === "string"
            ? e.response.data
            : "Failed to update session."
        );
      } finally {
        setSaving(false);
      }
    };

    const openClassesModal = async () => {
      setShowClassesModal(true);
      setClassesError("");
      setCreatingClass(false);
      setNewClassRow(createBlankClassRow());
      setEditingClassId(null);
      setEditingClassRow(createBlankClassRow());

      try {
        const res = await api.get("/api/sessions", { params: { take: 500 } });
        const list = Array.isArray(res.data) ? res.data : [];
        setSessions(list);

        if (!classesSessionId && list.length > 0) {
          const firstId = list[0].sessionId;
          setClassesSessionId(firstId);
          await loadClasses(firstId);
        } else if (classesSessionId) {
          await loadClasses(classesSessionId);
        }
      } catch (e) {
        console.error(e);
        setClassesError("Failed to load sessions.");
      }
    };

    const closeClassesModal = () => {
      if (hasUnsavedClassChanges) {
        const ok = window.confirm(
          "You have an unsaved class row. If you close now, those changes will be lost. Do you still want to close?"
        );
        if (!ok) return;
      }

      setShowClassesModal(false);
      setClassesError("");
      setCreatingClass(false);
      setNewClassRow(createBlankClassRow());
      setEditingClassId(null);
      setEditingClassRow(createBlankClassRow());
    };

    const openClassMembersModal = async () => {
      setShowClassMembersModal(true);
      setMemberErrorModal("");
      setMemberSessionId("");
      setMemberClassId("");
      setMemberClasses([]);
      setMemberSelectedUsers([]);
      setMemberSearch("");
      setMemberSearchResults([]);
      setMemberOriginalUserIds([]);

      try {
        const res = await api.get("/api/sessions", { params: { take: 500 } });
        const list = Array.isArray(res.data) ? res.data : [];
        setSessions(list);
      } catch (e) {
        console.error(e);
        setMemberErrorModal("Failed to load sessions.");
      }
    };

    const closeClassMembersModal = () => {
      if (memberSaving) return;

      if (hasUnsavedMemberChanges) {
        const ok = window.confirm(
          "You have unsaved class member changes. If you close now, those changes will be lost. Do you still want to close?"
        );
        if (!ok) return;
      }

      setShowClassMembersModal(false);
      setMemberErrorModal("");
      setMemberSessionId("");
      setMemberClassId("");
      setMemberClasses([]);
      setMemberSelectedUsers([]);
      setMemberSearch("");
      setMemberSearchResults([]);
      setMemberOriginalUserIds([]);
    };

    const openCreateUserModal = (type) => {
      setCreateUserType(type);
      setCreateUserRow(createBlankUserRow());
      setCreateUserError("");
      setShowCreateUserModal(true);
    };

    const closeCreateUserModal = () => {
      if (createUserBusy) return;

      if (hasUnsavedCreateUserChanges) {
        const ok = window.confirm(
          "You have unsaved user information. If you close now, those changes will be lost. Do you still want to close?"
        );
        if (!ok) return;
      }

      setShowCreateUserModal(false);
      setCreateUserRow(createBlankUserRow());
      setCreateUserError("");
    };

  const startCreate = () => {
    if (editingSessionId) {
      setError("Save or cancel the session you are editing before creating a new one.");
      return;
    }

    if (creating) return;

    setError("");
    setCreating(true);
    setNewRow(createBlankRow());
  };

  const cancelCreate = () => {
    setError("");
    resetCreating();
  };

  const saveCreate = async () => {
    const validation = validateRow(newRow);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/api/sessions", {
        name: newRow.name.trim(),
        startDate: newRow.startDate,
        endDate: newRow.endDate,
        makeActive: newRow.isActive === "true",
      });

      resetCreating();
      await loadSessions();
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to create session."
      );
    } finally {
      setSaving(false);
    }
  };

    const startCreateClass = () => {
      if (!classesSessionId) {
        setClassesError("Please select a session first.");
        return;
      }
      if (editingClassId) {
        setClassesError("Save or cancel the class you are editing before creating a new one.");
        return;
      }

      setClassesError("");
      setCreatingClass(true);
      setNewClassRow(createBlankClassRow());
    };

    const cancelCreateClass = () => {
      if (newClassRow.name.trim()) {
        const ok = window.confirm(
          "You have an unsaved class row. If you cancel now, those changes will be lost. Do you still want to cancel?"
        );
        if (!ok) return;
      }

      setCreatingClass(false);
      setNewClassRow(createBlankClassRow());
      setClassesError("");
    };

    const saveCreateClass = async () => {
      const name = newClassRow.name.trim();

      if (!classesSessionId) {
        setClassesError("Please select a session.");
        return;
      }

      if (name.length < 3 || name.length > 120) {
        setClassesError("Class name must be between 3 and 120 characters.");
        return;
      }

      setClassesSaving(true);
      setClassesError("");

      try {
        await api.post("/api/classes", {
          sessionId: classesSessionId,
          name,
        });

        setCreatingClass(false);
        setNewClassRow(createBlankClassRow());
        await loadClasses(classesSessionId);
      } catch (e) {
        console.error(e);
        setClassesError(
          e?.response?.data && typeof e.response.data === "string"
            ? e.response.data
            : "Failed to create class."
        );
      } finally {
        setClassesSaving(false);
      }
    };

    const startEditClass = (cls) => {
      if (creatingClass) {
        setClassesError("Save or cancel the new class row before editing another class.");
        return;
      }

      setEditingClassId(cls.classId);
      setEditingClassRow({ name: cls.name ?? "" });
      setClassesError("");
    };

    const cancelEditClass = () => {
      setEditingClassId(null);
      setEditingClassRow(createBlankClassRow());
      setClassesError("");
    };

    const saveEditClass = async (classId) => {
      const name = editingClassRow.name.trim();

      if (name.length < 3 || name.length > 120) {
        setClassesError("Class name must be between 3 and 120 characters.");
        return;
      }

      setClassesSaving(true);
      setClassesError("");

      try {
        await api.put(`/api/classes/${classId}`, { name });
        setEditingClassId(null);
        setEditingClassRow(createBlankClassRow());
        await loadClasses(classesSessionId);
      } catch (e) {
        console.error(e);
        setClassesError(
          e?.response?.data && typeof e.response.data === "string"
            ? e.response.data
            : "Failed to update class."
        );
      } finally {
        setClassesSaving(false);
      }
    };

  const addMemberUser = (u) => {
    if (!u?.userId) return;

    const exists = memberSelectedUsers.some(
      (x) => String(x.userId) === String(u.userId)
    );

    if (exists) return;

    setMemberSelectedUsers((prev) => [...prev, u]);
  };

  const removeMemberUser = (userId) => {
    setMemberSelectedUsers((prev) =>
      prev.filter((u) => String(u.userId) !== String(userId))
    );
  };

  const saveClassMembers = async () => {
    if (!memberClassId) {
      setMemberErrorModal("Please select a class.");
      return;
    }

    setMemberSaving(true);
    setMemberErrorModal("");

    try {
      await api.put(`/api/classes/${memberClassId}/members`, {
        studentUserIds: memberSelectedUsers.map((u) => u.userId),
      });
      setShowClassMembersModal(false);
      setMemberErrorModal("");
      setMemberSessionId("");
      setMemberClassId("");
      setMemberClasses([]);
      setMemberSelectedUsers([]);
      setMemberOriginalUserIds([]);
      setMemberSearch("");
      setMemberSearchResults([]);
    } catch (e) {
      console.error(e);
      setMemberErrorModal(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : "Failed to save class members."
      );
    } finally {
      setMemberSaving(false);
    }
  };

  const saveCreateUser = async () => {
    const email = createUserRow.email.trim();
    const password = createUserRow.password;
    const displayName = createUserRow.displayName.trim();

    if (!email || !password || !displayName) {
      setCreateUserError("Email, password, and display name are required.");
      return;
    }

    setCreateUserBusy(true);
    setCreateUserError("");

    try {
      const url =
        createUserType === "teacher"
          ? "/api/admin/teachers"
          : "/api/admin/students";

      await api.post(url, {
        email,
        password,
        displayName,
      });

      setShowCreateUserModal(false);
      setCreateUserRow(createBlankUserRow());
    } catch (e) {
      console.error(e);
      setCreateUserError(
        e?.response?.data && typeof e.response.data === "string"
          ? e.response.data
          : `Failed to create ${createUserType}.`
      );
    } finally {
      setCreateUserBusy(false);
    }
  };

  return (
    <>
      <Navbar bg="light" expand="md" className="border-bottom">
        <Container fluid className="px-3">
          <Navbar.Brand className="fw-semibold">MagSchoolChat</Navbar.Brand>

          <Navbar.Toggle aria-controls="topnav" />
          <Navbar.Collapse id="topnav">
            <Nav className="me-auto"></Nav>

            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-secondary" className="rounded-3">
                {me?.displayName || me?.email || "Account"}
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-sm rounded-3">
                <Dropdown.Header className="small text-muted">
                  {(me?.roles || []).join(", ") || "User"}
                </Dropdown.Header>

                {canManageSessions && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={openSessionsModal}>
                      Sessions
                    </Dropdown.Item>
                    <Dropdown.Item onClick={openClassesModal}>
                      Classes
                    </Dropdown.Item>
                    <Dropdown.Item onClick={openClassMembersModal}>
                      Class Members
                    </Dropdown.Item>
                    {isAdmin && (
                      <Dropdown.Item onClick={() => openCreateUserModal("teacher")}>
                        Create Teacher
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item onClick={() => openCreateUserModal("student")}>
                      Create Student
                    </Dropdown.Item>
                  </>
                )}

                <Dropdown.Divider />
                <Dropdown.Item onClick={logout}>Sign out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Navbar.Collapse>
        </Container>
      </Navbar>

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
    </>
  );
}