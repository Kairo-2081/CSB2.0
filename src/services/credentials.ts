// Credentials Reference for Demo Users
export interface UserCredential {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  permissions?: string[];
}

export const demoCredentials = {
  admin: {
    name: 'Admin User',
    email: 'admin@campushub.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Administration',
    permissions: [
      '✅ View all posts',
      '✅ Delete ANY post',
      '✅ Manage complaints',
      '✅ Manage notices',
      '✅ Full access to all features'
    ]
  },
  students: [
    {
      name: 'Raj Kumar',
      email: 'raj@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science',
      permissions: [
        '✅ View all posts',
        '✅ Delete ONLY own posts',
        '✅ Post Lost & Found items',
        '✅ Create marketplace listings',
        '✅ File complaints',
        '❌ Cannot delete others\' posts'
      ]
    },
    {
      name: 'Priya Singh',
      email: 'priya@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Engineering',
      permissions: [
        '✅ View all posts',
        '✅ Delete ONLY own posts',
        '✅ Post Lost & Found items',
        '✅ Create marketplace listings',
        '✅ File complaints',
        '❌ Cannot delete others\' posts'
      ]
    },
    {
      name: 'Amit Patel',
      email: 'amit@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Business',
      permissions: [
        '✅ View all posts',
        '✅ Delete ONLY own posts',
        '✅ Post Lost & Found items',
        '✅ Create marketplace listings',
        '✅ File complaints',
        '❌ Cannot delete others\' posts'
      ]
    },
    {
      name: 'Neha Sharma',
      email: 'neha@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Medicine',
      permissions: [
        '✅ View all posts',
        '✅ Delete ONLY own posts',
        '✅ Post Lost & Found items',
        '✅ Create marketplace listings',
        '✅ File complaints',
        '❌ Cannot delete others\' posts'
      ]
    },
    {
      name: 'Arjun Verma',
      email: 'arjun@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Law',
      permissions: [
        '✅ View all posts',
        '✅ Delete ONLY own posts',
        '✅ Post Lost & Found items',
        '✅ Create marketplace listings',
        '✅ File complaints',
        '❌ Cannot delete others\' posts'
      ]
    }
  ]
};

// Flattened list of all demo users for login page
export const demoUsers: UserCredential[] = [
  { name: 'Admin User', email: 'admin@campushub.com', password: 'Admin@123', role: 'admin', department: 'Administration' },
  { name: 'Raj Kumar', email: 'raj@student.com', password: 'Student@123', role: 'student', department: 'Computer Science' },
  { name: 'Priya Singh', email: 'priya@student.com', password: 'Student@123', role: 'student', department: 'Engineering' },
  { name: 'Amit Patel', email: 'amit@student.com', password: 'Student@123', role: 'student', department: 'Business' },
  { name: 'Neha Sharma', email: 'neha@student.com', password: 'Student@123', role: 'student', department: 'Medicine' },
  { name: 'Arjun Verma', email: 'arjun@student.com', password: 'Student@123', role: 'student', department: 'Law' }
];

export const rolePermissions = {
  admin: {
    canDeleteAnyPost: true,
    canDeleteOwnPost: true,
    canManageUsers: true,
    canManageNotices: true,
    canManageComplaints: true,
    fullAccess: true
  },
  student: {
    canDeleteAnyPost: false,
    canDeleteOwnPost: true,
    canManageUsers: false,
    canManageNotices: false,
    canManageComplaints: false,
    fullAccess: false
  }
};
