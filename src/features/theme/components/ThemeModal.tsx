"use client";

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { THEME_COLOR_OPTIONS } from '../constants';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeColorId, ThemeMode } from '../types';

interface ThemeModalProps {
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ onClose }) => {
  const storedMode = useThemeStore((s) => s.mode);
  const storedColor = useThemeStore((s) => s.color);
  const applyPreferences = useThemeStore((s) => s.applyPreferences);

  const [mode, setMode] = useState<ThemeMode>(storedMode);
  const [color, setColor] = useState<ThemeColorId>(storedColor);


  const handleApply = async () => {
    applyPreferences(mode, color);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content theme-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Theme</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <section className="theme-section">
          <h3 className="theme-section-title">Appearance</h3>
          <div className="theme-mode-grid">
            <button
              type="button"
              className={`theme-mode-card${mode === 'light' ? ' selected' : ''}`}
              onClick={() => setMode('light')}
            >
              <div className="theme-mode-preview light">
                <div className="theme-preview-sidebar" />
                <div className="theme-preview-main">
                  <div className="theme-preview-bar" />
                  <div className="theme-preview-bar short" />
                  <div className="theme-preview-bar accent" />
                </div>
              </div>
              <span className="theme-mode-label">Light</span>
            </button>
            <button
              type="button"
              className={`theme-mode-card${mode === 'dark' ? ' selected' : ''}`}
              onClick={() => setMode('dark')}
            >
              <div className="theme-mode-preview dark">
                <div className="theme-preview-sidebar" />
                <div className="theme-preview-main">
                  <div className="theme-preview-bar" />
                  <div className="theme-preview-bar short" />
                  <div className="theme-preview-bar accent" />
                </div>
              </div>
              <span className="theme-mode-label">Dark</span>
            </button>
          </div>
        </section>

        <section className="theme-section">
          <h3 className="theme-section-title">Color</h3>
          <div className="theme-color-grid">
            {THEME_COLOR_OPTIONS.map((option) => {
              const selected = color === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`theme-color-option${selected ? ' selected' : ''}`}
                  onClick={() => setColor(option.id)}
                >
                  <span
                    className="theme-color-swatch"
                    style={{ backgroundColor: option.accent }}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="theme-color-label">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
