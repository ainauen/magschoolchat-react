import React, { useState } from "react";
import { Alert, Button, Card, Container, Form, Row, Col, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Put your logo here:
import logo from "../assets/logo.png";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/chat";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login({ email, password });
      nav(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Login failed. Check your email/password and try again.";
      setError(typeof msg === "string" ? msg : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-bg">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={7} lg={5} xl={4}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-4 p-md-5">
                <div className="d-flex flex-column align-items-center mb-3">
                  {/* Logo placement */}
                  <img src={logo} alt="MagSchoolChat" className="auth-logo mb-3" />
                  <h2 className="mb-1 fw-semibold">Welcome back</h2>
                  <div className="text-muted small">Sign in to continue</div>
                </div>

                {error && (
                  <Alert variant="danger" className="rounded-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={onSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Email</Form.Label>
                    <Form.Control
                      className="rounded-3"
                      type="email"
                      placeholder="name@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small text-muted">Password</Form.Label>
                    <Form.Control
                      className="rounded-3"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 rounded-3 py-2 fw-semibold"
                    variant="primary"
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Signing in…
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </Form>

                <div className="text-center text-muted small mt-4">
                  By continuing, you agree to your school’s acceptable use policy.
                </div>
              </Card.Body>
            </Card>

            <div className="text-center text-muted small mt-3">
              © {new Date().getFullYear()} MagSchoolChat
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
