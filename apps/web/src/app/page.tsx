"use client";

import { SpaceList } from "@/features/spaces/components/SpaceList";
import { useI18n } from "@/contexts/I18nContext";

export default function Home() {
  const { t } = useI18n();
  return (
    <main className="main-layout">
      <header className="app-header">
        <h1>{t.yourSpaces}</h1>
      </header>
      <section className="dashboard-content">
        <SpaceList />
      </section>
    </main>
  );
}
