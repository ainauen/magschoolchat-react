import React from "react";
import { Dropdown } from "react-bootstrap";

export default function AppAccountDropdown({
  me,
  logout,
  canManageSessions,
  canManageNicknames,
  canArchive,
  isAdmin,
  openSessionsModal,
  openClassesModal,
  openClassMembersModal,
  openEditMembersModal,
  openCreateUserModal,
  openNicknameModal,
  openArchiveModal,
  openChangePasswordModal,
}) {
  return (
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
            <Dropdown.Item onClick={openSessionsModal}>Sessions</Dropdown.Item>
            <Dropdown.Item onClick={openClassesModal}>Classes</Dropdown.Item>
            <Dropdown.Item onClick={openClassMembersModal}>Class Members</Dropdown.Item>
            <Dropdown.Item onClick={openEditMembersModal}>Edit Members</Dropdown.Item>

            {isAdmin && (
              <Dropdown.Item onClick={() => openCreateUserModal("teacher")}>
                Create Teacher
              </Dropdown.Item>
            )}

            <Dropdown.Item onClick={() => openCreateUserModal("student")}>
              Create Student
            </Dropdown.Item>

            {canManageNicknames && (
              <Dropdown.Item onClick={openNicknameModal}>Edit Nickname</Dropdown.Item>
            )}

            {canArchive && (
              <Dropdown.Item onClick={openArchiveModal}>Archive</Dropdown.Item>
            )}
          </>
        )}

        <Dropdown.Divider />
        <Dropdown.Item onClick={openChangePasswordModal}>Change Password</Dropdown.Item>
        <Dropdown.Item onClick={logout}>Sign out</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
