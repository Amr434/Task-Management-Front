import React, { useState, useEffect } from 'react';
import { createProject } from '@/features/projects/api';
import { Project } from '@/features/projects/types';
import { X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface CreateProjectModalProps {
  spaceId: number;
  spaceName: string;
  defaultName?: string;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ spaceId, spaceName, defaultName = '', onClose, onSuccess }) => {
  const { t } = useI18n();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultName) {
      setName(defaultName);
    }
  }, [defaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const newProject = await createProject({ name, description, spaceId });
      onSuccess(newProject);
    } catch (err) {
      console.error(err);
      setError("Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Project in {spaceName}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Project Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="e.g. Website Redesign"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="What is this project about?"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
