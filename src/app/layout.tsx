import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/features/theme/components/ThemeProvider";
import { I18nProvider } from "@/contexts/I18nContext";
import { TaskSelectionProvider } from "@/contexts/TaskSelectionContext";

export const metadata: Metadata = {
  title: "Task Management MVP",
  description: "ClickUp clone MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <TaskSelectionProvider>
              <AppShell>
                {children}
              </AppShell>
            </TaskSelectionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
