import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DateBlock, EmptyState, FilterBar, Kicker, ReportButton, RowList, SectionTitle } from "@/components/editorial";
import { StatusDot } from "@/components/ui/status-dot";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { BoardRow, animalWelfareService } from "@/services/database.service";

interface AnimalReport extends BoardRow {
  title?: string;
  description: string;
  location: string;
  urgency: "low" | "medium" | "high";
  posted_by: string;
}

const zoneConfig = {
  low: { label: "Low", color: "bg-success/10 text-success" },
  medium: { label: "Medium", color: "bg-warning/10 text-warning" },
  high: { label: "High", color: "bg-destructive/10 text-destructive" },
};

const statusConfig = {
  low: { label: "Low priority" },
  medium: { label: "Medium priority" },
  high: { label: "High priority" },
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
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await animalWelfareService.list<AnimalReport>();
      setReports(data);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await animalWelfareService.create({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        urgency: formData.urgency_level,
      });
      toast.success("Report submitted successfully!");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        location: "",
        urgency_level: "medium",
      });
      await loadReports();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter(report =>
    urgencyFilter === "all" || report.urgency === urgencyFilter
  );

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await animalWelfareService.remove(id);
        toast.success("Report deleted successfully!");
        await loadReports();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete report");
      }
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/campus-cats.webp", alt: "Three campus cats resting together on sandy ground" }}
          eyebrow="Community"
          title="Animal welfare."
          accent="Look out for them."
          description="Report a cat or dog on campus that is hurt, sick or needs feeding."
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Report an animal
              </Button>
            </>
          }
        />

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report an animal.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
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
                  <Label htmlFor="urgency">Urgency Level</Label>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Report"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section aria-label="Reports">
            <FilterBar
              label="Filter by priority"
              tabs={[{ value: "all", label: "All" }, ...Object.entries(zoneConfig).map(([value, c]) => ({ value, label: c.label }))]}
              value={urgencyFilter}
              onChange={setUrgencyFilter}
            />
            {filteredReports.length > 0 ? (
              <RowList label="Animal reports">
                {filteredReports.map((report) => (
                  <li key={report.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-5 py-8 md:grid-cols-[88px_minmax(0,1fr)_150px] md:gap-7">
                    <DateBlock date={report.created_at} />
                    <div className="min-w-0">
                      <Kicker>{report.location}</Kicker>
                      {report.title && <h3 className="mt-2.5 font-display text-[26px] font-normal leading-[1.2]">{report.title}</h3>}
                      <p className="mt-2 text-[15px] leading-[26px] text-muted-foreground">{report.description}</p>
                      <p className="mt-2 text-[13px] text-muted-foreground">Reported by {report.posted_by || "Anonymous"}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-end">
                      <StatusDot tone={report.urgency === "high" ? "urgent" : report.urgency === "medium" ? "progress" : "open"}>
                        {statusConfig[report.urgency]?.label ?? "Reported"}
                      </StatusDot>
                      {!report.is_mine && <ReportButton board="animal-welfare" rowId={report.id} />}
                    {report.can_delete && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(report.id)} className="text-destructive hover:text-destructive">
                          <Trash2 aria-hidden="true" /> Delete
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </RowList>
            ) : (
              <EmptyState
                title={reports.length === 0 ? "No reports yet." : "Nothing at this priority."}
                text={reports.length === 0 ? "Seen a cat or dog on campus that is hurt, sick or needs feeding? Report it here." : "Try another tab."}
                action={reports.length === 0 ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Report an animal</Button> : undefined}
              />
            )}
          </section>

          <aside aria-labelledby="how-to-report">
            <SectionTitle id="how-to-report">How to report</SectionTitle>
            <dl className="divide-y divide-foreground/[0.07]">
              <div className="py-5">
                <dt><StatusDot tone="urgent">High</StatusDot></dt>
                <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">Needs a vet now: bleeding, can't stand, or hit by a vehicle.</dd>
              </div>
              <div className="py-5">
                <dt><StatusDot tone="progress">Medium</StatusDot></dt>
                <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">Shows signs of distress, an injury or an infection.</dd>
              </div>
              <div className="py-5">
                <dt><StatusDot tone="open">Low</StatusDot></dt>
                <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">General welfare, such as needing food or shelter.</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
