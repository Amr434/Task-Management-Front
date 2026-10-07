import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MAX_ATTACHMENT_BYTES, type UploadFile } from '@task/core/features/attachments/api';
import { validateAvatar } from '@task/core/features/users/avatar';
import { en } from '@task/core/i18n/dictionaries/en';

/** A file chosen on the device, ready to hand to uploadAttachment. */
export interface PickedFile {
  file: UploadFile;
  name: string;
  size?: number;
  mimeType: string;
}

export class FileTooLargeError extends Error {
  constructor(name: string) {
    super(`"${name}" is larger than 25 MB, the server's limit.`);
  }
}

function toPicked(uri: string, name: string, mimeType: string, size?: number): PickedFile {
  if (size !== undefined && size > MAX_ATTACHMENT_BYTES) throw new FileTooLargeError(name);
  // React Native's FormData takes this shape rather than a browser File.
  return { file: { uri, name, type: mimeType }, name, size, mimeType };
}

/** Any file from the device's file browser. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  return toPicked(a.uri, a.name, a.mimeType ?? 'application/octet-stream', a.size);
}

/** A photo from the gallery. */
export async function pickImage(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Permission to open your photos was declined.');

  // SDK 57 takes the media type as a string literal; MediaTypeOptions is deprecated.
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  const name = a.fileName ?? `photo-${Date.now()}.jpg`;
  return toPicked(a.uri, name, a.mimeType ?? 'image/jpeg', a.fileSize);
}

/** A photo taken right now — the thing the web app cannot do. */
export async function takePhoto(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Permission to use the camera was declined.');

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  const name = a.fileName ?? `photo-${Date.now()}.jpg`;
  return toPicked(a.uri, name, a.mimeType ?? 'image/jpeg', a.fileSize);
}

/**
 * A square profile picture from the library or the camera. The picker's crop
 * step makes it square; the size/type limits are the shared avatar rules.
 */
export async function pickAvatar(source: 'library' | 'camera'): Promise<PickedFile | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(source === 'camera' ? 'Permission to use the camera was declined.' : 'Permission to open your photos was declined.');
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.7 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.length) return null;

  const a = result.assets[0];
  const mimeType = a.mimeType ?? 'image/jpeg';
  const problem = validateAvatar(mimeType, a.fileSize);
  if (problem) throw new Error(en[problem]);
  const name = a.fileName ?? `avatar-${Date.now()}.jpg`;
  return { file: { uri: a.uri, name, type: mimeType }, name, size: a.fileSize, mimeType };
}
