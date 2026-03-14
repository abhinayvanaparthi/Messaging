"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import CommonLink from "../../components/CommonLink";

import { TextInput, PasswordInput, Button, Paper, Title, Stack, Text, Alert } from "@mantine/core";

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
      // Extract error message
      const errorMessage = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper shadow="md" p="xl" w={400}>
        <Stack gap="md">
          <Title order={3} ta="center">Welcome Back</Title>

          {error && (
            <Alert color="red" title="Login Failed">
              {error}
            </Alert>
          )}

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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            disabled={loading}
          />

          <Button mt="md" onClick={handleLogin} loading={loading} fullWidth>
            Login
          </Button>

          <Text size="sm" ta="center" mt="sm">
            Don't have an account?{" "}
            <CommonLink href="/register" style={{ textDecoration: "none", color: "blue" }}>
              Register here
            </CommonLink>
          </Text>
        </Stack>
      </Paper>
    </div>
  );
}