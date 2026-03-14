"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import CommonLink from "../../components/CommonLink";

import { TextInput, PasswordInput, Button, Paper, Title, Stack, Text, Alert } from "@mantine/core";

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
      // Try to extract error message from API response
      const errorMessage = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper shadow="md" p="xl" w={400}>
        <Stack gap="md">
          <Title order={3} ta="center">Create an Account</Title>
          
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}

          <TextInput
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            disabled={loading}
          />

          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            disabled={loading}
            type="email"
          />

          <PasswordInput
            label="Password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            disabled={loading}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            required
            disabled={loading}
          />

          <Button mt="md" onClick={handleRegister} loading={loading} fullWidth>
            Register
          </Button>

          <Text size="sm" ta="center" mt="sm">
            Already have an account?{" "}
            <CommonLink href="/login" style={{ textDecoration: "none", color: "blue" }}>
              Login here
            </CommonLink>
          </Text>
        </Stack>
      </Paper>
    </div>
  );
}