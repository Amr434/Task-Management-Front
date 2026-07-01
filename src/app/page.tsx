import { WorkspaceList } from "@/features/workspaces/components/WorkspaceList";

export default function Home() {
  return (
    <main className="main-layout">
      <header className="app-header">
        <h1>Task Management App</h1>
      </header>
      <section className="dashboard-content">
        <h2>Your Workspaces</h2>
        <WorkspaceList />
      </section>
    </main>
  );
}
