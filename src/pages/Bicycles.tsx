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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Bike, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  History,
  Plus,
  Loader2,
  Trash2
} from "lucide-react";
import { bicycleService } from "@/services/database.service";
import { toast } from "sonner";

interface Bicycle {
  id: string;
  brand: string;
  color: string;
  location: string;
  contact_number: string;
  description?: string;
  user_id: string;
  status?: string;
  rented_by?: string;
  created_at: string;
}

const statusConfig = {
  available: { 
    label: "Available", 
    variant: "success" as const, 
    icon: CheckCircle,
    color: "text-success"
  },
  rented: { 
    label: "In use", 
    variant: "warning" as const, 
    icon: Clock,
    color: "text-warning"
  },
  maintenance: { 
    label: "Maintenance", 
    variant: "destructive" as const, 
    icon: XCircle,
    color: "text-destructive"
  },
};

const unavailableStatus = {
  label: "Status unavailable",
  variant: "secondary" as const,
  icon: AlertTriangle,
  color: "text-muted-foreground",
};

function getBicycleStatus(status?: string) {
  switch (status) {
    case "available":
      return statusConfig.available;
    case "rented":
      return statusConfig.rented;
    case "maintenance":
      return statusConfig.maintenance;
    default:
      return unavailableStatus;
  }
}


export default function Bicycles() {
  const [filter, setFilter] = useState<string>("all");
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    registration_number: "",
  });

  useEffect(() => {
    loadBicycles();
  }, []);

  const loadBicycles = async () => {
    try {
      setIsLoading(true);
      const data = await bicycleService.getReports();
      setBicycles(data);
    } catch (error) {
      console.error("Error loading bicycles:", error);
      toast.error("Failed to load bicycles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registration_number.trim()) {
      toast.error("Please enter a registration number");
      return;
    }

    try {
      setIsLoading(true);
      await bicycleService.createReport({
        brand: formData.registration_number,
        color: "Unknown",
        location: "Campus",
        contact_number: "N/A",
        description: formData.registration_number,
        user_id: "current-user-id",
      });
      toast.success("Bicycle added");
      setFormData({ registration_number: "" });
      setIsDialogOpen(false);
      await loadBicycles();
    } catch (error) {
      console.error("Error adding bicycle:", error);
      toast.error("Failed to add bicycle");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: bicycles.length,
    available: bicycles.filter(b => b.status === "available").length,
    rented: bicycles.filter(b => b.status === "rented").length,
    maintenance: bicycles.filter(b => b.status === "maintenance").length,
  };


  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this bicycle report?")) {
      try {
        await bicycleService.deleteReport(id);
        toast.success("Report deleted");
        await loadBicycles();
      } catch (error) {
        console.error("Error deleting report:", error);
        toast.error("Failed to delete report");
      }
    }
  };
  const filteredBicycles = bicycles.filter(bicycle => 
    filter === "all" || bicycle.status === filter
  );

  return (
    <MainLayout>
      <Page>
        <PageHeader
          title="Bicycles"
          description="Campus bicycles, where they are and whether you can book one"
          actions={
            <>
              <Button variant="outline">
                <History aria-hidden="true" />
                Booking history
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Add bicycle
              </Button>
            </>
          }
        />

        <section aria-label="Fleet status" className="glass-panel grid grid-cols-2 overflow-hidden rounded-2xl lg:grid-cols-4">
          {[
            { label: "Bicycles", value: stats.total },
            { label: "Available now", value: stats.available, lead: true },
            { label: "In use", value: stats.rented },
            { label: "In maintenance", value: stats.maintenance },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`px-6 py-5 ${index % 2 === 1 ? "border-l border-border" : ""} ${index >= 2 ? "border-t border-border lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`mt-2 text-3xl font-medium leading-none tabular-nums ${stat.lead ? "text-primary" : "text-foreground"}`}>{stat.value}</p>
            </div>
          ))}
        </section>

        <FilterGroup
          label="Status"
          value={filter}
          onChange={setFilter}
          options={[{ value: "all", label: "All" }, ...Object.entries(statusConfig).map(([value, config]) => ({ value, label: config.label }))]}
        />

        {filteredBicycles.length === 0 ? (
          <EmptyState icon={Bike} title="No bicycles found" description="Try another status" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBicycles.map((bicycle) => {
              const status = getBicycleStatus(bicycle.status);
              return (
                <article key={bicycle.id} className="glass-panel flex flex-col rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-medium text-foreground">{bicycle.brand}</h3>
                      <p className="stamp mt-1 truncate">{bicycle.id}</p>
                    </div>
                    <Badge variant={status.variant}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{status.label}</Badge>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {bicycle.rented_by ? (
                      <>With <span className="text-foreground">{bicycle.rented_by}</span></>
                    ) : (
                      bicycle.color
                    )}
                  </p>
                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    {bicycle.status === "available" ? (
                      <Button size="sm" className="flex-1">Book</Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1" disabled>{status.label}</Button>
                    )}
                    {bicycle.user_id === "current-user-id" && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(bicycle.id)} aria-label="Delete bicycle">
                        <Trash2 aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Add bicycle Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add a bicycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Registration number</label>
                <Input
                  placeholder="BIKE-001"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
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
                  Add bicycle
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Page>
    </MainLayout>
  );
}
