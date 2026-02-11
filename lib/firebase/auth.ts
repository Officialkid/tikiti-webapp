import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

export async function signIn(email: string, password: string) {
  if (!auth) throw new Error("Firebase auth not initialized");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string) {
  if (!auth) throw new Error("Firebase auth not initialized");
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  if (!auth) throw new Error("Firebase auth not initialized");
  return firebaseSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}
