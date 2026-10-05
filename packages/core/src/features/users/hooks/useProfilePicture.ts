import { useCallback, useState } from 'react';
import type { UploadFile } from '../../attachments/api';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { usersApi } from '../api';

// Upload/remove the signed-in user's profile picture, shared by web and mobile.
// Updates the stored user on success so every avatar on screen refreshes;
// throws on failure so each app shows the error its own way.
export function useProfilePicture() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [busy, setBusy] = useState(false);

  const upload = useCallback(
    async (file: UploadFile) => {
      setBusy(true);
      try {
        updateUser(await usersApi.uploadAvatar(file));
      } finally {
        setBusy(false);
      }
    },
    [updateUser],
  );

  const remove = useCallback(async () => {
    setBusy(true);
    try {
      updateUser(await usersApi.removeAvatar());
    } finally {
      setBusy(false);
    }
  }, [updateUser]);

  return { busy, upload, remove };
}
