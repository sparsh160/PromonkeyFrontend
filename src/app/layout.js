import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";

export const metadata = {
  title: "Promonkey CRM",
  description: "Manage your team, projects and clients",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}