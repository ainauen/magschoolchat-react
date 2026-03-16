import React from "react";
import { Container, Nav, Navbar, Dropdown } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

export default function AppNavbar() {
  const { me, logout } = useAuth();

  return (
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
              <Dropdown.Divider />
              <Dropdown.Item onClick={logout}>Sign out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}