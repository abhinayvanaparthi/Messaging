import { loginUser } from "../services/authService";
import { TextInput, PasswordInput, Button, Stack, Card, Title } from '@mantine/core';
import { useForm } from '@mantine/form';

function LoginPage() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 1 ? null : 'Password required'),
    },
  });

  const handleLogin = async (values) => {
    try {
      const data = await loginUser(values);
      localStorage.setItem("token", data.token);
      alert("Login successful!");
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 flex-col gap-7">
      <h1 className="text-3xl font-bold font-serif">Project Messaging</h1>

      <Card withBorder shadow="md" className="w-96">
        <Title order={2} align="center" mb="lg">
          Login
        </Title>

        <form onSubmit={form.onSubmit(handleLogin)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Enter password"
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth>
              Login
            </Button>
          </Stack>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
