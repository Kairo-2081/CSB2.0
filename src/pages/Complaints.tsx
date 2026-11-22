import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AnonymousToggle, EmptyState, FilterBar, Kicker, ReportButton, RowList } from "@/components/editorial";
import { StatusDot } from "@/components/ui/status-dot";
import { shortDate } from "@/lib/dates";
import { statusLabel, toneFor } from "@/lib/status";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Clock, Building2, GraduationCap, Utensils, Monitor, Users, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { BoardRow, complaintService } from "@/services/database.service";
import { toast } from "sonner";

interface Complaint extends BoardRow {
  title: string;
  description: string;
  category: "hall" | "dining" | "lab" | "academic" | "administration";
  status: "pending" | "in_progress" | "resolved";
  posted_by: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "hall" as Complaint["category"],
    anonymous: false,
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const data = await complaintService.list<Complaint>();
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
      await complaintService.create(formData);
      toast.success("Complaint posted successfully!");
      setFormData({
        title: "",
        description: "",
        category: "hall",
        anonymous: false,
      });
      setIsDialogOpen(false);
      await loadComplaints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post complaint");
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
        await complaintService.remove(id);
        toast.success("Complaint deleted successfully!");
        await loadComplaints();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete complaint");
      }
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-hall-night.webp", alt: "A red-brick BUET building lit in red and gold at night" }}
          eyebrow="Campus issues"
          title="Complaints,"
          accent="heard and tracked."
          description="Report a problem in your hall, a lab or on campus, and follow it until it's fixed."
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                New complaint
              </Button>
            </>
          }
        />

        <section aria-label="Complaints">
          <FilterBar
            label="Filter complaints"
            tabs={[{ value: "all", label: "All" }, ...Object.entries(categoryConfig).map(([value, c]) => ({ value, label: c.label }))]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            search={searchQuery}
            onSearch={setSearchQuery}
            searchLabel="Search complaints"
          />

          {filteredComplaints.length > 0 ? (
            <RowList label="Complaints">
              {filteredComplaints.map((complaint) => {
                const category = categoryConfig[complaint.category];
                const status = statusConfig[complaint.status];
                return (
                  <li key={complaint.id} className="grid gap-4 py-7 md:grid-cols-[minmax(0,1fr)_180px_150px] md:items-center md:gap-8">
                    <div className="min-w-0">
                      <Kicker>{category?.label ?? complaint.category}</Kicker>
                      <h3 className="mt-2 font-display text-2xl font-normal leading-[1.25]">{complaint.title}</h3>
                      <p className="mt-2 max-w-2xl text-[15px] leading-[26px] text-muted-foreground">{complaint.description}</p>
                    </div>
                    <StatusDot tone={toneFor(complaint.status)}>{status?.label ?? statusLabel(complaint.status)}</StatusDot>
                    <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground md:flex-col md:items-end">
                      <span>
                        {shortDate(complaint.created_at)} · {complaint.posted_by}
                      </span>
                      {!complaint.is_mine && <ReportButton board="complaints" rowId={complaint.id} />}
                    {complaint.can_delete && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(complaint.id)} className="text-destructive hover:text-destructive">
                          <Trash2 aria-hidden="true" /> Delete
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </RowList>
          ) : (
            <EmptyState
              title={complaints.length === 0 ? "No complaints yet." : "Nothing matches."}
              text={complaints.length === 0 ? "Report a problem in your hall, a lab or on campus, and follow it until it's fixed." : "Try another category or a different search."}
              action={complaints.length === 0 ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Report the first issue</Button> : undefined}
            />
          )}
        </section>

        {/* New Complaint Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report an issue.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
              <div>
                <label htmlFor="complaints-title" className="block text-sm font-medium mb-1">Title *</label>
                <Input id="complaints-title"
                  placeholder="Brief title of your complaint"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="complaints-category" className="block text-sm font-medium mb-1">Category *</label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value as Complaint["category"]})}
                  disabled={isLoading}
                >
                  <SelectTrigger id="complaints-category">
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
                <label htmlFor="complaints-description" className="block text-sm font-medium mb-1">Description *</label>
                <Textarea id="complaints-description"
                  placeholder="Describe your complaint in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-[120px]"
                />
              </div>

              <AnonymousToggle
                checked={formData.anonymous}
                onChange={(anonymous) => setFormData({ ...formData, anonymous })}
                disabled={isLoading}
              />

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
