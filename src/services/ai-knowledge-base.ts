// Campus Hub AI - User Manual Knowledge Base
// Based on official documentation from GETTING_STARTED.md and QUICK_REFERENCE.md

export function getContextualHelp(userMessage: string): string {
  const query = userMessage.toLowerCase();

  // Demo Credentials
  if (query.includes('login') || query.includes('credential') || query.includes('password') || query.includes('email')) {
    return `🔐 **Login Credentials**\n\n**Admin Account:**\nEmail: admin@campushub.com\nPassword: Admin@123\n\n**Student Accounts (all use Student@123):**\n• raj@student.com\n• priya@student.com\n• amit@student.com\n• neha@student.com\n• arjun@student.com`;
  }

  // Complaints Page
  if (query.includes('complaint') || query.includes('issue')) {
    return `📋 **Complaints Page**\n\nClick "New Complaint" button\n\n**Fill form with:**\n• Title (required)\n• Category (required): Hall, Dining, Lab, Academic, or Admin\n• Description (required)\n• Your Name\n\nThen click Submit.\n\n**Search & Filter:**\n• Search by title/description\n• Filter by category`;
  }

  // Lost & Found
  if (query.includes('lost') || query.includes('found') || query.includes('missing')) {
    return `🔍 **Lost & Found Page**\n\nClick "Report Item" button\n\n**Fill form with:**\n• Type (required): Lost or Found\n• Title (required)\n• Description (required)\n• Location (required)\n• Your Name\n\nThen click Submit.\n\n**Search & Filter:**\n• Search by title/description\n• Filter by type: Lost, Found, or All`;
  }

  // Marketplace
  if (query.includes('marketplace') || query.includes('sell') || query.includes('buy') || query.includes('item')) {
    return `🛒 **Marketplace Page**\n\nClick "Add Item" button\n\n**Fill form with:**\n• Title (required)\n• Description (required)\n• Price (required)\n• Seller name\n• Phone (required)\n• Category\n\nThen click Submit.\n\n**Search & Filter:**\n• Search by title/description\n• Filter by category`;
  }

  // Notices
  if (query.includes('notice') || query.includes('announcement')) {
    return `📢 **Notices Page**\n\nClick "Add Notice" button\n\n**Fill form with:**\n• Title (required)\n• Description (required)\n• Category\n• Posted By\n\nThen click Submit.\n\n**Search & Filter:**\n• Search by title/description\n• Filter by category`;
  }

  // Blood Donation
  if (query.includes('blood') || query.includes('donation') || query.includes('donor')) {
    return `❤️ **Blood Donation Page**\n\nClick "Register" button\n\n**Fill form with:**\n• Blood Type (required): A+, A-, B+, B-, AB+, AB-, O+, O-\n• Donor Name (required)\n• Location (required)\n• Phone (required)\n• Available Units\n\nThen click Submit.\n\n**Filter:**\n• Filter by blood type`;
  }

  // Bicycles
  if (query.includes('bicycle') || query.includes('bike')) {
    return `🚴 **Bicycles Page**\n\nClick "Add Bicycle" button\n\n**Fill form with:**\n• Registration Number (required)\n\nThen click Submit.\n\n**Filter:**\n• Filter by status: Available, In Use, or Maintenance`;
  }

  // Animal Welfare
  if (query.includes('animal') || query.includes('welfare')) {
    return `🐾 **Animal Welfare Page**\n\nClick "Report Issue" button\n\n**Fill form with:**\n• Title (required)\n• Description (required)\n• Location (required)\n• Urgency Level (required): Low, Medium, High\n• Your Name\n\nThen click Submit.\n\n**Filter:**\n• Filter by urgency level`;
  }

  // Faculty Suggestions
  if (query.includes('faculty') || query.includes('professor') || query.includes('feedback')) {
    return `⭐ **Faculty Suggestions Page**\n\nClick "Add Suggestion" button\n\n**Fill form with:**\n• Title (required)\n• Faculty Name (required)\n• Subject\n• Rating (required): 1-5\n• Feedback (required)\n• Your Name\n\nThen click Submit.\n\n**Search:**\n• Search by faculty name`;
  }

  // Profile
  if (query.includes('profile') || query.includes('account')) {
    return `👤 **Profile Page**\n\nClick "Edit Profile" button\n\n**Update:**\n• Full Name\n• Email\n• Phone\n• Department\n\nThen click Save.\n\n**Changes saved immediately**`;
  }

  // Students/Directory
  if (query.includes('student') || query.includes('directory') || query.includes('browse')) {
    return `👥 **Students Page (Directory)**\n\nBrowse student directory\n\n**Search:**\n• Search by name/email\n\n**Filter:**\n• Filter by role: Student, Faculty, Admin\n• Filter by department`;
  }

  // How Posting Works
  if (query.includes('post') || query.includes('submit') || query.includes('how')) {
    return `📝 **How to Post**\n\n1. Click action button (New Complaint, Report Item, Add Item, etc)\n2. Dialog form opens\n3. Fill required fields (marked with *)\n4. Click Submit\n5. Loading spinner shows\n6. Success message appears\n7. Dialog closes\n8. Your post appears in list\n\n**Results update in real-time!**`;
  }

  // Search & Filter
  if (query.includes('search') || query.includes('filter')) {
    return `🔍 **Search & Filter**\n\n**Search Works On:**\n• Complaints, Lost & Found, Marketplace, Notices, Animal Welfare, Faculty Suggestions, Students\n• Type to find items by title/description/name\n• Results update in real-time\n\n**Filters Available On:**\n• Complaints: category\n• Lost & Found: type\n• Marketplace: category\n• Notices: category\n• Blood Donation: blood type\n• Bicycles: status\n• Animal Welfare: urgency\n• Students: role, department`;
  }

  // Troubleshooting
  if (query.includes('error') || query.includes('problem') || query.includes('not working') || query.includes('help')) {
    return `🆘 **Troubleshooting**\n\n**Button doesn't work?**\n→ Click directly on button\n→ Check if form is loading\n\n**Form won't submit?**\n→ Fill all required fields (*)\n→ Check for error message\n\n**Data not showing?**\n→ Refresh page\n→ Wait for data to load\n→ Check internet connection\n\n**Page won't load?**\n→ Refresh page\n→ Clear browser cache\n→ Check server is running\n\n**Backend not running?**\n→ Run: node server.js\n→ Check port 3001\n\n**CORS Error?**\n→ Backend: http://localhost:3001\n→ Frontend: http://localhost:5173\n→ Both must be running`;
  }

  // Default help
  return `👋 **Campus Hub Features**\n\n1. **Complaints** - Report issues (Hall, Dining, Lab, Academic, Admin)\n2. **Lost & Found** - Post lost or found items\n3. **Marketplace** - Sell items with price\n4. **Notices** - Post announcements\n5. **Blood Donation** - Register as blood donor\n6. **Bicycles** - Register bicycles for sharing\n7. **Animal Welfare** - Report animal problems\n8. **Faculty Suggestions** - Give feedback to faculty\n9. **Profile** - Update your information\n10. **Students** - Browse student directory\n\n**How it works:**\n• Click button → Fill form → Click Submit → Post appears!\n\nWhat would you like help with?`;
}

// Export for compatibility
export const appKnowledgeBase = {
  features: {},
  commonTasks: [],
  troubleshooting: [],
  tips: [],
  professionalGuidelines: {}
};
