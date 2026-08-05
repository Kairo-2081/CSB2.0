import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Droplets,
  Bell,
  Shield,
  User as UserIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* User Info Card */}
        {currentUser && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    {currentUser.role === 'admin' ? (
                      <Shield className="h-6 w-6 text-primary" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{currentUser.name}</p>
                    <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                    {currentUser.department && <p className="text-xs text-muted-foreground">{currentUser.department}</p>}
                  </div>
                </div>
                <Badge className={currentUser.role === 'admin' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}>
                  {currentUser.role === 'admin' ? '👑 Admin' : '👨‍🎓 Student'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              System Online
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value="160"
            subtitle="100 Students • 50 Faculty • 10 Admins"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Active Posts"
            value="48"
            subtitle="Lost & Found items"
            icon={Search}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Open Complaints"
            value="23"
            subtitle="5 resolved today"
            icon={MessageSquare}
            trend={{ value: 5, isPositive: false }}
          />
          <StatCard
            title="Lost & Found Items"
            value="28"
            subtitle="12 claimed this week"
            icon={Search}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>

          {/* Quick Actions - Takes 1 column */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Marketplace Listings
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34</div>
              <p className="text-xs text-muted-foreground mt-1">
                12 sold this week
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Blood Requests
              </CardTitle>
              <Droplets className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground mt-1">
                2 urgent requests active
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Notices
              </CardTitle>
              <Bell className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">
                3 new this week
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
