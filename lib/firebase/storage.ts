import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type UploadMetadata,
} from "firebase/storage";
import { storage } from "./config";

export async function uploadFile(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<string> {
  if (!storage) throw new Error("Firebase Storage not initialized");
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
}

export async function getFileUrl(path: string): Promise<string> {
  if (!storage) throw new Error("Firebase Storage not initialized");
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

export async function deleteFile(path: string): Promise<void> {
  if (!storage) throw new Error("Firebase Storage not initialized");
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
