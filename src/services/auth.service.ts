import { api } from "@/lib/http";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  phone?: string;
  department?: string;
  universityId?: string;
  universityName?: string;
  homeDistrict?: string;
  currentResidence?: string;
  showContact?: boolean;
  emailVerified?: boolean;
  mustChangePassword?: boolean;
}

export interface University {
  id: string;
  name: string;
  shortName: string | null;
  division: string | null;
}

export interface UniversityMetrics {
  id: string;
  name: string;
  shortName: string | null;
  division: string | null;
  studentCount: number;
  studentsThisMonth: number;
}

export interface CentralAdminMetrics {
  universityCount: number;
  studentCount: number;
  studentsThisMonth: number;
  universities: UniversityMetrics[];
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  universityName: string;
  homeDistrict: string;
  currentResidence: string;
  consent?: boolean;
}

interface UserResponse {
  success: boolean;
  user: User;
  message?: string;
}

// Only the profile is kept in the browser, for instant rendering. It is not a
// credential: the session itself is an HttpOnly cookie the page cannot read.
const USER_KEY = "user";

class AuthService {
  async getUniversities(): Promise<University[]> {
    const data = await api<{ universities: University[] }>("/universities");
    return data.universities;
  }

  getCentralAdminMetrics(): Promise<CentralAdminMetrics> {
    return api<CentralAdminMetrics>("/admin/metrics");
  }

  async login(email: string, password: string): Promise<UserResponse> {
    const data = await api<UserResponse>("/auth/login", { method: "POST", body: { email, password } });
    this.setCurrentUser(data.user);
    return data;
  }

  async register(input: RegisterInput): Promise<UserResponse> {
    const data = await api<UserResponse>("/auth/register", { method: "POST", body: input });
    this.setCurrentUser(data.user);
    return data;
  }

  logout(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("authToken"); // left over from before cookie sessions
    api("/auth/logout", { method: "POST", body: {} }).catch(() => {});
  }

  getCurrentUser(): User | null {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearCurrentUser(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("authToken");
  }

  /** The server's view of the session: the user, or null when signed out. */
  async fetchCurrentUser(): Promise<User | null> {
    try {
      const data = await api<UserResponse>("/auth/verify");
      this.setCurrentUser(data.user);
      return data.user;
    } catch {
      this.clearCurrentUser();
      return null;
    }
  }

  async updateProfile(
    userId: string,
    updates: { name?: string; phone?: string; department?: string; showContact?: boolean },
  ): Promise<User> {
    const data = await api<UserResponse>(`/auth/profile/${encodeURIComponent(userId)}`, {
      method: "PUT",
      body: updates,
    });
    const current = this.getCurrentUser();
    if (current?.id === data.user.id) this.setCurrentUser(data.user);
    return data.user;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<string> {
    const data = await api<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: { oldPassword, newPassword },
    });
    return data.message;
  }
}

export const authService = new AuthService();
