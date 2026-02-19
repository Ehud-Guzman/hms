import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../core/hooks/useAuth";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }, 5001);
    return () => clearTimeout(timer);
  }, [navigate, user]);

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
          padding: "3rem 2.5rem",
          borderRadius: "1rem",
          textAlign: "center",
          backgroundColor: "#fff",
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "50px",
              marginBottom: "1rem",
              color: theme.colors.primary.DEFAULT,
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#111",
              marginBottom: "0.5rem",
            }}
          >
            Unauthorized
          </h1>
          <p style={{ fontSize: "1rem", color: "#555", lineHeight: 1.6 }}>
            You don’t have permission to access this page.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#777", marginTop: "1rem" }}>
            Redirecting to {user ? "dashboard" : "login"} in 5 seconds...
          </p>
        </div>

        <Button
          size="lg"
          fullWidth
          onClick={() => navigate(user ? "/dashboard" : "/login", { replace: true })}
        >
          Go Back Now
        </Button>
      </Card>
    </div>
  );
}
