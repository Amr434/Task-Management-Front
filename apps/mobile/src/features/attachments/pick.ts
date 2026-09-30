import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MAX_ATTACHMENT_BYTES, type UploadFile } from '@task/core/features/attachments/api';

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
