"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import CommonLink from "../../components/CommonLink";

import {
  TextField,
  Button,
  Paper,
  Typography,
  Stack,
  Alert,
  AlertTitle,
  CircularProgress,
} from "@mui/material";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);

    // Basic Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      router.push("/chat");
    } catch (err: any) {
      console.error("Login failed", err);
      const errorMessage = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Stack spacing={2}>
          <Typography variant="h5" align="center">Welcome Back</Typography>

          {error && (
            <Alert severity="error">
              <AlertTitle>Login Failed</AlertTitle>
              {error}
            </Alert>
          )}

          <TextField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            type="email"
            fullWidth
          />

          <TextField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            type="password"
            fullWidth
          />

          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            fullWidth
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Don&apos;t have an account?{" "}
            <CommonLink href="/register" style={{ textDecoration: "none", color: "#1976d2" }}>
              Register here
            </CommonLink>
          </Typography>
        </Stack>
      </Paper>
    </div>
  );
}