import React from 'react';

// This would typically fetch from the API using a hook like useWorkspaces()
export const WorkspaceList = () => {
  return (
    <div className="workspace-list">
      <div className="card">
        <h2>Personal Workspace</h2>
        <p>Your private tasks and projects.</p>
        <button className="btn-primary">View Projects</button>
      </div>
      <div className="card">
        <h2>Team Alpha</h2>
        <p>Collaborative workspace for Team Alpha.</p>
        <button className="btn-primary">View Projects</button>
      </div>
    </div>
  );
};
