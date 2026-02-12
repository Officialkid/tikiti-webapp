export type UserRole = "customer" | "organizer" | "admin";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  profilePicUrl?: string;
  friends: string[];
  trustScore: number;
  privacySettings: {
    showAttendance: boolean;
    allowSquadInvites: boolean;
    shareLocation: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  role: UserRole;
}
