const API_URL = 'http://localhost:3001/api';

// Helper function for API calls
const api = {
  async get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  async post(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
};

export const complaintService = {
  async getComplaints() {
    return api.get('/complaints');
  },
  async createComplaint(complaint) {
    return api.post('/complaints', complaint);
  },
};

export const noticeService = {
  async getNotices() {
    return api.get('/notices');
  },
  async createNotice(notice) {
    return api.post('/notices', notice);
  },
};

export const marketplaceService = {
  async getItems() {
    return api.get('/marketplace');
  },
  async createItem(item) {
    return api.post('/marketplace', item);
  },
};

export const animalWelfareService = {
  async getReports() {
    return api.get('/animal-welfare');
  },
  async createReport(report) {
    return api.post('/animal-welfare', report);
  },
};

export const facultySuggestionService = {
  async getSuggestions() {
    return api.get('/faculty-suggestions');
  },
  async createSuggestion(suggestion) {
    return api.post('/faculty-suggestions', suggestion);
  },
};

export const bloodDonationService = {
  async getDonors() {
    return api.get('/blood-donation');
  },
  async createDonor(donor) {
    return api.post('/blood-donation', donor);
  },
};

export const bicycleService = {
  async getReports() {
    return api.get('/bicycles');
  },
  async createReport(report) {
    return api.post('/bicycles', report);
  },
};

export const lostFoundService = {
  async getItems() {
    return api.get('/lost-found');
  },
  async createItem(item) {
    return api.post('/lost-found', item);
  },
};
