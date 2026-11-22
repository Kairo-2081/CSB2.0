// Using local API backend - No Supabase
import { API_URL } from '@/lib/api-url';

export interface LendingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  item_condition: string;
  handoff_location: string;
  status: 'available' | 'borrowed';
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
  status: 'pending' | 'approved' | 'declined' | 'returned';
  item_title: string;
  owner_id: string;
  item_status: 'available' | 'borrowed';
  owner_name: string;
  requester_name: string;
  created_at: string;
}

async function authenticatedRequest<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `API Error: ${response.statusText}`);
  }
  return response.json();
}

// Helper function for API calls
const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
  async delete(endpoint: string, data?: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
};

export const complaintService = {
  async getComplaints() {
    return api.get('/complaints');
  },
  async createComplaint(complaint: any) {
    return api.post('/complaints', complaint);
  },
  async deleteComplaint(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete complaints.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/complaints/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const noticeService = {
  async getNotices() {
    return api.get('/notices');
  },
  async createNotice(notice: any) {
    return api.post('/notices', notice);
  },
  async deleteNotice(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete notices.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/notices/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const marketplaceService = {
  async getItems() {
    return api.get('/marketplace');
  },
  async createItem(item: any) {
    return api.post('/marketplace', item);
  },
  async deleteItem(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete items.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/marketplace/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const animalWelfareService = {
  async getReports() {
    return api.get('/animal-welfare');
  },
  async createReport(report: any) {
    return api.post('/animal-welfare', report);
  },
  async deleteReport(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete reports.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/animal-welfare/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const facultySuggestionService = {
  async getSuggestions() {
    return api.get('/faculty-suggestions');
  },
  async createSuggestion(suggestion: any) {
    return api.post('/faculty-suggestions', suggestion);
  },
  async deleteSuggestion(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete suggestions.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/faculty-suggestions/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const bloodDonationService = {
  async getDonors() {
    return api.get('/blood-donation');
  },
  async createDonor(donor: any) {
    return api.post('/blood-donation', donor);
  },
  async deleteDonor(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete donor entries.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/blood-donation/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const bicycleService = {
  async getReports() {
    return api.get('/bicycles');
  },
  async createReport(report: any) {
    return api.post('/bicycles', report);
  },
  async deleteReport(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete bicycle entries.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/bicycles/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const lostFoundService = {
  async getItems() {
    return api.get('/lost-found');
  },
  async createItem(item: any) {
    return api.post('/lost-found', item);
  },
  async deleteItem(id: string) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not authenticated. Please login to delete items.');
    }
    const user = JSON.parse(userStr);
    if (!user.id || !user.role) {
      throw new Error('Invalid user session. Please login again.');
    }
    return api.delete(`/lost-found/${id}`, {
      userId: user.id,
      userRole: user.role
    });
  },
};

export const lendingService = {
  getItems(): Promise<LendingItem[]> {
    return authenticatedRequest('/lend-borrow/items');
  },
  getRequests(): Promise<LendingRequest[]> {
    return authenticatedRequest('/lend-borrow/requests');
  },
  createItem(item: {
    title: string;
    description: string;
    category: string;
    itemCondition: string;
    handoffLocation: string;
  }): Promise<LendingItem> {
    return authenticatedRequest('/lend-borrow/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
  },
  requestToBorrow(itemId: string, message: string): Promise<{ success: boolean; id: string; status: string }> {
    return authenticatedRequest(`/lend-borrow/items/${encodeURIComponent(itemId)}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  },
  updateRequest(
    requestId: string,
    action: 'approve' | 'decline' | 'return',
  ): Promise<{ success: boolean; status: string }> {
    return authenticatedRequest(`/lend-borrow/requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  },
};

