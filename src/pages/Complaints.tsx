import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Page, PageHeader, Toolbar } from "@/components/layout/Page";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterGroup } from "@/components/layout/FilterGroup";
import { SearchField } from "@/components/layout/SearchField";
import { formatDate } from "@/lib/format";
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
  in_progress: { label: "In progress", variant: "info" as const, icon: Clock },
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
      toast.success("Complaint posted");
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
    if (window.confirm("Delete this complaint?")) {
      try {
        await complaintService.deleteComplaint(id);
        toast.success("Complaint deleted");
        await loadComplaints();
      } catch (error) {
        console.error("Error deleting complaint:", error);
        toast.error("Failed to delete complaint");
      }
    }
  };

  return (
    <MainLayout>
      <Page>
        <PageHeader
          title="Complaints"
          description="Report hall, dining, lab, academic and administration issues and follow them to resolution"
          meta={`${complaints.length} filed · ${complaints.filter((item) => item.status !== "resolved").length} open`}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus aria-hidden="true" />
              New complaint
            </Button>
          }
        />

        <Toolbar>
          <SearchField label="Search complaints" value={searchQuery} onChange={setSearchQuery} />
          <FilterGroup
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[{ value: "all", label: "All" }, ...Object.entries(categoryConfig).map(([value, config]) => ({ value, label: config.label }))]}
          />
        </Toolbar>

        {filteredComplaints.length === 0 ? (
          <EmptyState icon={Search} title="No complaints found" description="Try another search or category" />
        ) : (
          <ul className="glass-panel divide-y divide-border overflow-hidden rounded-2xl">
            {filteredComplaints.map((complaint) => {
              const category = categoryConfig[complaint.category];
              const status = statusConfig[complaint.status];
              return (
                <li key={complaint.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start">
                  <category.icon className="mt-1 hidden h-4 w-4 shrink-0 text-subtle sm:block" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-medium text-foreground">{complaint.title}</h3>
                      <Badge variant={status.variant}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{status.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{complaint.description}</p>
                    <p className="stamp mt-3">{[category.label, formatDate(complaint.created_at), complaint.posted_by].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm">View details</Button>
                    {complaint.user_id === user?.id && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(complaint.id)}>
                        <Trash2 aria-hidden="true" />
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* New Complaint Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <Input
                  placeholder="Brief title of your complaint"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Category</label>
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
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="Describe your complaint in detail"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-32"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Your name</label>
                <Input
                  placeholder="Optional"
                  value={formData.posted_by}
                  onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <DialogFooter>
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
                  {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Submit complaint
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Page>
    </MainLayout>
  );
}
