import React, { useState, useEffect } from 'react';
import { createProject, updateProject } from '@/features/projects/api';
import { Project } from '@/features/projects/types';
import { X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface CreateProjectModalProps {
  spaceId: number;
  spaceName: string;
  defaultName?: string;
  /** When provided, the modal edits this project instead of creating a new one. */
  project?: Project;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ spaceId, spaceName, defaultName = '', project, onClose, onSuccess }) => {
  const { t } = useI18n();
  const isEdit = !!project;
  const [name, setName] = useState(project?.name ?? defaultName);
  const [description, setDescription] = useState(project?.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit && defaultName) {
      setName(defaultName);
    }
  }, [defaultName, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const savedProject = isEdit
        ? await updateProject(project.id, { name, description, spaceId })
        : await createProject({ name, description, spaceId });
      onSuccess(savedProject);
    } catch (err) {
      console.error(err);
      setError(isEdit ? "Failed to update project." : "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? `Edit ${project.name}` : `Create Project in ${spaceName}`}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>{t.projectNameLabel}</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder={t.projectNamePlaceholder}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>{t.descriptionOptional}</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder={t.projectAbout}
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? t.saving : isEdit ? t.save : t.createProject}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
