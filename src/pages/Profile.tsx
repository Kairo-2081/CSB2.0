import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Calendar,
  Edit,
  Shield,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    name: "Rahul Kumar",
    email: "rahul.kumar@university.edu",
    phone: "+91 98765 43210",
    department: "Computer Science",
    hall: "Block A - Room 204",
    year: "3rd Year",
    role: "student" as const,
    joinedDate: "August 2022",
    studentId: "CSE2022001",
  });

  const [formData, setFormData] = useState(user);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(formData);
      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              setFormData(user);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card variant="glass" className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold mb-4">
                  {user.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="info" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <Badge variant="secondary">{user.studentId}</Badge>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="text-foreground font-medium">{user.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Hall:</span>
                  <span className="text-foreground font-medium">{user.hall}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="text-foreground font-medium">{user.joinedDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Form */}
          <Card variant="glass" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={user.name} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user.email} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={user.phone} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input id="studentId" value={user.studentId} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={user.department} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" value={user.year} readOnly className="bg-secondary/50" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hall">Hall/Residence</Label>
                  <Input id="hall" value={user.hall} readOnly className="bg-secondary/50" />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="text-sm text-muted-foreground">
                  <p>Account Status: <span className="text-success font-semibold">Active</span></p>
                  <p className="mt-2">Member Since: {user.joinedDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-year">Year</Label>
                  <Input
                    id="edit-year"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="edit-hall">Hall/Residence</Label>
                  <Input
                    id="edit-hall"
                    value={formData.hall}
                    onChange={(e) => setFormData({...formData, hall: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
