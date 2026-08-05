import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
  low: { label: "Low Priority", variant: "success" as const },
  medium: { label: "Medium Priority", variant: "warning" as const },
  high: { label: "High Priority", variant: "destructive" as const },
};

const mockReports: AnimalReport[] = [];

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
      toast.success("Report submitted successfully!");
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
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await animalWelfareService.deleteReport(id);
        toast.success("Report deleted successfully!");
        await loadReports();
      } catch (error) {
        console.error("Error deleting report:", error);
        toast.error("Failed to delete report");
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Animal Welfare</h1>
            <p className="text-muted-foreground mt-1">Report and track animal welfare issues on campus</p>
          </div>
          <Button variant="glow" className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        </div>

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Report Animal Welfare Issue</DialogTitle>
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
                <div>
                  <Label htmlFor="posted_by">Your Name</Label>
                  <Input
                    id="posted_by"
                    value={formData.posted_by}
                    onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Reports Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={urgencyFilter === "all" ? "default" : "secondary"}
                size="sm"
                onClick={() => setUrgencyFilter("all")}
              >
                All Reports
              </Button>
              {Object.entries(zoneConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant={urgencyFilter === key ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setUrgencyFilter(key)}
                >
                  {config.label}
                </Button>
              ))}
            </div>

            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No reports found
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report, index) => {
                const urgencyConfig = zoneConfig[report.urgency];
                const statusBadge = statusConfig[report.urgency];
                
                return (
                  <Card 
                    key={report.id} 
                    variant="interactive"
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${urgencyConfig.color}`}>
                          <Heart className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </div>
                          {report.title && <h3 className="font-semibold text-foreground">{report.title}</h3>}
                          <p className="text-sm text-foreground">{report.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {report.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {report.posted_by}
                            </span>
                          </div>
                        </div>
                        <div className="flex-col gap-2 hidden sm:flex">
                          {report.user_id === "current-user-id" && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                              className="gap-1"
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
              })
            )}
          </div>

          {/* Info Section */}
          <div>
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">How to Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Click the "Report Issue" button to submit a report about any animal welfare concerns on campus.
                </p>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Priority Levels:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• <span className="text-success">Low</span>: General welfare observations</li>
                    <li>• <span className="text-warning">Medium</span>: Animal shows signs of distress</li>
                    <li>• <span className="text-destructive">High</span>: Immediate medical attention needed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
