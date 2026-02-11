import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

export async function getDocument<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, collectionName, docId);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as T) : null;
}

export async function getCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  if (!db) throw new Error("Firestore not initialized");
  const colRef = collection(db, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as T);
}

export async function createDocument(
  collectionName: string,
  data: DocumentData
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const colRef = collection(db, collectionName);
  const ref = await addDoc(colRef, data);
  return ref.id;
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
}

export async function deleteDocument(collectionName: string, docId: string) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

export { where, orderBy, limit };
