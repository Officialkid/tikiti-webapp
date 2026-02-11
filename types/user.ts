export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "customer" | "organizer" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
