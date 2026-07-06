import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
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
    <html lang="en">
      <body>
        <I18nProvider>
          <TaskSelectionProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </TaskSelectionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
