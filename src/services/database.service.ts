import { api } from "@/lib/http";

// Every call carries the session cookie. Who posted, which university and
// whether a delete is allowed are decided by the server, never sent from here.

/** Fields the server adds to every board row. */
export interface BoardRow {
  id: string;
  created_at: string;
  updated_at: string;
  university_id: string | null;
  /** The signed-in user posted this row. */
  is_mine: boolean;
  /** The signed-in user may delete it (their own post, or an admin). */
  can_delete: boolean;
}

export interface LendingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  item_condition: string;
  handoff_location: string;
  status: "available" | "borrowed";
  owner_id: string;
  owner_name: string;
  university_id: string | null;
  has_active_request: boolean | number;
  created_at: string;
}

export interface LendingRequest {
  id: string;
  item_id: string;
  requester_id: string;
  message: string | null;
  status: "pending" | "approved" | "declined" | "returned";
  item_title: string;
  owner_id: string;
  item_status: "available" | "borrowed";
  owner_name: string;
  requester_name: string;
  created_at: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  role: "admin" | "student";
  department: string | null;
  email?: string;
  phone?: string;
}

function board<TCreate>(path: string) {
  return {
    list: <T = BoardRow>(params: { limit?: number; before?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.limit) q.set("limit", String(params.limit));
      if (params.before) q.set("before", params.before);
      const qs = q.toString();
      return api<T[]>(`/${path}${qs ? `?${qs}` : ""}`);
    },
    create: <T = BoardRow>(body: TCreate) => api<T>(`/${path}`, { method: "POST", body }),
    remove: (id: string) => api(`/${path}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
}

export const noticeService = board<{ title: string; description: string; category: string }>("notices");
export const complaintService = board<{ title: string; description: string; category: string; anonymous?: boolean }>("complaints");
export const marketplaceService = board<{ title: string; description: string; price: number; category: string; phone?: string }>("marketplace");
export const animalWelfareService = board<{ title: string; description: string; location: string; urgency: string }>("animal-welfare");
export const facultySuggestionService = board<{
  title: string; faculty_name: string; subject?: string; rating: number; feedback: string; anonymous?: boolean;
}>("faculty-suggestions");
export const bloodDonationService = board<{ blood_type: string; contact_number: string; location: string; available_date?: string; consent: true }>("blood-donation");
export const bicycleService = board<{ brand: string; color?: string; location?: string; contact_number?: string; description?: string }>("bicycles");
export const lostFoundService = board<{ title: string; description: string; item_type: "lost" | "found"; location: string; contact_number?: string }>("lost-found");

export const directoryService = {
  list: (params: { q?: string; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    if (params.limit) q.set("limit", String(params.limit));
    if (params.offset) q.set("offset", String(params.offset));
    const qs = q.toString();
    return api<{ users: DirectoryUser[] }>(`/students${qs ? `?${qs}` : ""}`).then((d) => d.users);
  },
};

export const adminService = {
  removed: () => api<{ board: "notices" | "complaints"; id: string; title: string; deleted_at: string; deleted_by: string | null }[]>("/admin/removed"),
  restore: (boardName: "notices" | "complaints", id: string) =>
    api(`/${boardName}/${encodeURIComponent(id)}/restore`, { method: "POST", body: {} }),
};

export const lendingService = {
  getItems: () => api<LendingItem[]>("/lend-borrow/items"),
  getRequests: () => api<LendingRequest[]>("/lend-borrow/requests"),
  createItem: (item: { title: string; description: string; category: string; itemCondition: string; handoffLocation: string }) =>
    api<LendingItem>("/lend-borrow/items", { method: "POST", body: item }),
  requestToBorrow: (itemId: string, message: string) =>
    api<{ success: boolean; id: string; status: string }>(`/lend-borrow/items/${encodeURIComponent(itemId)}/requests`, {
      method: "POST",
      body: { message },
    }),
  updateRequest: (requestId: string, action: "approve" | "decline" | "return") =>
    api<{ success: boolean; status: string }>(`/lend-borrow/requests/${encodeURIComponent(requestId)}`, {
      method: "PATCH",
      body: { action },
    }),
};
