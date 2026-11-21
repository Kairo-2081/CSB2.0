import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Page, PageHeader, Toolbar } from "@/components/layout/Page";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterGroup } from "@/components/layout/FilterGroup";
import { SearchField } from "@/components/layout/SearchField";
import { formatCount, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Plus, 
  MapPin, 
  Clock, 
  User,
  AlertTriangle,
  CheckCircle,
  Heart,
  Trash2
} from "lucide-react";
import { animalWelfareService } from "@/services/database.service";

interface AnimalReport {
  id: string;
  title?: string;
  description: string;
  location: string;
  urgency: "low" | "medium" | "high";
  posted_by: string;
  user_id: string;
  created_at: string;
}

const zoneConfig = {
  low: { label: "Low", color: "bg-success/10 text-success" },
  medium: { label: "Medium", color: "bg-warning/10 text-warning" },
  high: { label: "High", color: "bg-destructive/10 text-destructive" },
};

const statusConfig = {
  low: { label: "Low priority", variant: "success" as const },
  medium: { label: "Medium priority", variant: "warning" as const },
  high: { label: "High priority", variant: "destructive" as const },
};


export default function AnimalWelfare() {
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<AnimalReport[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    urgency_level: "medium" as "low" | "medium" | "high",
    posted_by: "",
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await animalWelfareService.getReports();
      setReports(data);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location || !formData.posted_by) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await animalWelfareService.createReport({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        urgency: formData.urgency_level,
        user_id: "current-user-id",
      });
      toast.success("Report submitted");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        location: "",
        urgency_level: "medium",
        posted_by: "",
      });
      await loadReports();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter(report =>
    urgencyFilter === "all" || report.urgency === urgencyFilter
  );

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this report?")) {
      try {
        await animalWelfareService.deleteReport(id);
        toast.success("Report deleted");
        await loadReports();
      } catch (error) {
        console.error("Error deleting report:", error);
        toast.error("Failed to delete report");
      }
    }
  };

  return (
    <MainLayout>
      <Page>
        <PageHeader
          title="Animal welfare"
          description="Report injured, sick or distressed animals on campus so someone can help"
          meta={`${formatCount(reports.length, "report")} · ${reports.filter((report) => report.urgency === "high").length} high priority`}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Report an animal
            </Button>
          }
        />

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Report an animal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="urgency">Priority</Label>
                  <Select 
                    value={formData.urgency_level}
                    onValueChange={(value) => setFormData({...formData, urgency_level: value as "low" | "medium" | "high"})}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="posted_by">Your name</Label>
                  <Input
                    id="posted_by"
                    value={formData.posted_by}
                    onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting" : "Submit report"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <FilterGroup
              label="Priority"
              value={urgencyFilter}
              onChange={setUrgencyFilter}
              options={[{ value: "all", label: "All" }, ...Object.entries(zoneConfig).map(([value, config]) => ({ value, label: config.label }))]}
            />

            {filteredReports.length === 0 ? (
              <EmptyState icon={Heart} title="No reports found" description="Try another priority" />
            ) : (
              <ul className="glass-panel divide-y divide-border overflow-hidden rounded-2xl">
                {filteredReports.map((report) => {
                  const statusBadge = statusConfig[report.urgency];
                  return (
                    <li key={report.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {report.title && <h3 className="text-base font-medium text-foreground">{report.title}</h3>}
                          <Badge variant={statusBadge.variant}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{statusBadge.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{report.description}</p>
                        <p className="stamp mt-3">{[report.location, formatDate(report.created_at), report.posted_by].filter(Boolean).join(" · ")}</p>
                      </div>
                      {report.user_id === "current-user-id" && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}>
                          <Trash2 aria-hidden="true" />
                          Delete
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="glass-panel rounded-2xl p-6">
            <h2 className="text-base font-medium text-foreground">How to report</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use Report an animal to tell the campus about any welfare concern. Pick the priority that matches what you saw.
            </p>
            <dl className="mt-5 space-y-4 border-t border-border pt-5 text-sm">
              <div>
                <dt className="flex items-center gap-2 font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Low</dt>
                <dd className="mt-1 pl-3.5 text-muted-foreground">General welfare observations</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 font-medium text-warning"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Medium</dt>
                <dd className="mt-1 pl-3.5 text-muted-foreground">The animal shows signs of distress</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 font-medium text-[hsl(358_85%_74%)]"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />High</dt>
                <dd className="mt-1 pl-3.5 text-muted-foreground">Needs medical attention now</dd>
              </div>
            </dl>
          </aside>
        </div>
      </Page>
    </MainLayout>
  );
}
