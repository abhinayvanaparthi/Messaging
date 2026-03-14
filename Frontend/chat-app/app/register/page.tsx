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

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    // Basic Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      router.push("/chat");
    } catch (err: any) {
      console.error("Registration failed", err);
      const errorMessage = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Stack spacing={2}>
          <Typography variant="h5" align="center">Create an Account</Typography>
          
          {error && (
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          <TextField
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            fullWidth
          />

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            type="password"
            fullWidth
          />

          <TextField
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            type="password"
            fullWidth
          />

          <Button
            variant="contained"
            onClick={handleRegister}
            disabled={loading}
            fullWidth
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Already have an account?{" "}
            <CommonLink href="/login" style={{ textDecoration: "none", color: "#1976d2" }}>
              Login here
            </CommonLink>
          </Typography>
        </Stack>
      </Paper>
    </div>
  );
}