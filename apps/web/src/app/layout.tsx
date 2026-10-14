import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/services/apiConfig";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/features/theme/components/ThemeProvider";
import { I18nProvider } from "@/contexts/I18nContext";
import { TaskSelectionProvider } from "@/contexts/TaskSelectionContext";

export const metadata: Metadata = {
  title: "Click up CISS",
  description: "CISS task management",
  // Opened from the iPhone home screen: full screen, with this name.
  appleWebApp: {
    capable: true,
    title: "Click up CISS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
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
