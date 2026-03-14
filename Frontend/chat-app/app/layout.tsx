import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import { MantineProvider } from "@mantine/core";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
         <MantineProvider>
          <AuthProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </AuthProvider>
         </MantineProvider>
      </body>
    </html>
  );
}