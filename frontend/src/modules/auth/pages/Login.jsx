// src/pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../core/hooks/useAuth"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth(); // <-- context login
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Show messages if redirected
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state?.message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await login(email, password); // <-- use context
      if (result.success) {
        navigate("/"); // success: go to dashboard
      } else {
        setMessage(result.error || "Login failed");
      }
    } catch (err) {
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "3rem 2.5rem",
          borderRadius: "1rem",
          backgroundColor: "#ffffff",
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
          textAlign: "center",
          transition: "transform 0.3s",
        }}
      >
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "50px",
              marginBottom: "1rem",
              color: theme.colors.primary.DEFAULT,
              display: "inline-block",
              transform: "rotate(-5deg)",
            }}
          >
            🏥
          </div>
          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: 700,
              color: "#111",
              marginBottom: "0.5rem",
            }}
          >
            Hospital Management System
          </h1>
          <p style={{ fontSize: "1rem", color: "#555", lineHeight: 1.6 }}>
            Sign in to access your dashboard
          </p>
        </div>

        {message && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid #ccc",
              fontSize: "1rem",
              outline: "none",
              backgroundColor: "#f9f9f9",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid #ccc",
              fontSize: "1rem",
              outline: "none",
              backgroundColor: "#f9f9f9",
            }}
          />

          <Button type="submit" disabled={loading} fullWidth size="lg">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "0.5rem" }}>
          © 2026 Hospital Management System
        </p>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#aaa",
            backgroundColor: "#f5f5f5",
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            display: "inline-block",
          }}
        >
          Demo: admin@hospital.com / admin123
        </p>
      </Card>
    </div>
  );
}
