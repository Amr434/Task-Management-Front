import { create } from 'zustand';

/**
 * Hands a description to the full-screen editor and back. Routes can only take
 * strings in, not return a value, so the text lives here while the editor is open.
 *
 * Each opening gets a new session number; a screen only takes text from the
 * session it started, so two task screens in the stack never overwrite each other.
 */
interface DescriptionDraftState {
  session: number;
  text: string;
  placeholder: string;
  begin: (text: string, placeholder: string) => number;
  setText: (text: string) => void;
}

export const useDescriptionDraft = create<DescriptionDraftState>((set, get) => ({
  session: 0,
  text: '',
  placeholder: '',
  begin: (text, placeholder) => {
    const session = get().session + 1;
    set({ session, text, placeholder });
    return session;
  },
  setText: (text) => set({ text }),
}));
