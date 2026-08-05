import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Clock, 
  Building2,
  GraduationCap,
  Utensils,
  Monitor,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { complaintService } from "@/services/database.service";
import { toast } from "sonner";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: "hall" | "dining" | "lab" | "academic" | "administration";
  status: "pending" | "in_progress" | "resolved";
  posted_by: string;
  user_id: string;
  created_at: string;
}

const categoryConfig = {
  hall: { icon: Building2, label: "Hall", color: "text-primary" },
  dining: { icon: Utensils, label: "Dining", color: "text-warning" },
  lab: { icon: Monitor, label: "Lab", color: "text-accent" },
  academic: { icon: GraduationCap, label: "Academic", color: "text-success" },
  administration: { icon: Users, label: "Administration", color: "text-destructive" },
};

const statusConfig = {
  pending: { label: "Pending", variant: "warning" as const, icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "info" as const, icon: Clock },
  resolved: { label: "Resolved", variant: "success" as const, icon: CheckCircle },
};

export default function Complaints() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "hall" as const,
    posted_by: "Anonymous",
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (error) {
      console.error("Error loading complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await complaintService.createComplaint({
        ...formData,
        user_id: user?.id || "anonymous",
      });
      toast.success("Complaint posted successfully!");
      setFormData({
        title: "",
        description: "",
        category: "hall",
        posted_by: "Anonymous",
      });
      setIsDialogOpen(false);
      await loadComplaints();
    } catch (error) {
      console.error("Error creating complaint:", error);
      toast.error("Failed to post complaint");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || complaint.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      try {
        // Pass user info for authorization
        const complaintService_with_auth = {
          ...complaintService,
          deleteComplaint: async (complaintId: string) => {
            const user_data = JSON.parse(localStorage.getItem('user') || '{}');
            return fetch(`http://localhost:3001/api/complaints/${complaintId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user_data.id,
                userRole: user_data.role
              }),
            }).then(res => {
              if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
              return res.json();
            });
          }
        };
        
        await complaintService_with_auth.deleteComplaint(id);
        toast.success("Complaint deleted successfully!");
        await loadComplaints();
      } catch (error) {
        console.error("Error deleting complaint:", error);
        toast.error("Failed to delete complaint");
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Complaints</h1>
            <p className="text-muted-foreground mt-1">Submit and track your complaints</p>
          </div>
          <Button 
            variant="glow" 
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Complaint
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={categoryFilter === key ? "default" : "secondary"}
                size="sm"
                onClick={() => setCategoryFilter(key)}
                className="gap-1.5"
              >
                <config.icon className="h-3.5 w-3.5" />
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.map((complaint, index) => {
            const category = categoryConfig[complaint.category];
            const status = statusConfig[complaint.status];
            const StatusIcon = status.icon;
            
            return (
              <Card 
                key={complaint.id} 
                variant="interactive"
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary ${category.color}`}>
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{complaint.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {category.label}
                            </Badge>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </span>
                          <span>By {complaint.posted_by}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {complaint.user_id === user?.id && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(complaint.id)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredComplaints.length === 0 && (
          <Card variant="glass" className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No complaints found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </Card>
        )}

        {/* New Complaint Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit New Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  placeholder="Brief title of your complaint"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value as any})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hall">Hall</SelectItem>
                    <SelectItem value="dining">Dining</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Textarea
                  placeholder="Describe your complaint in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <Input
                  placeholder="Your name (optional)"
                  value={formData.posted_by}
                  onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
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
                  Submit Complaint
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
