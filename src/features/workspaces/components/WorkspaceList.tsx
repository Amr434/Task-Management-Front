"use client";

import React, { useEffect, useState } from 'react';
import { getWorkspaces } from '../api/getWorkspaces';
import { Workspace } from '../types';

export const WorkspaceList = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await getWorkspaces();
        setWorkspaces(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load workspaces');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  if (loading) return <div className="p-4">Loading workspaces...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="workspace-list grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {workspaces.length === 0 ? (
        <p className="p-4">No workspaces found.</p>
      ) : (
        workspaces.map((ws) => (
          <div key={ws.id} className="workspace-card p-4 border rounded shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2">{ws.name}</h3>
            {ws.description && <p className="text-gray-600">{ws.description}</p>}
          </div>
        ))
      )}
    </div>
  );
};
