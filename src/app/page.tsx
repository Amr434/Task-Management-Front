import { SpaceList } from "@/features/spaces/components/SpaceList";

export default function Home() {
  return (
    <main className="main-layout">
      <header className="app-header">
        <h1>Your Spaces</h1>
      </header>
      <section className="dashboard-content">
        <SpaceList />
      </section>
    </main>
  );
}
