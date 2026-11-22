import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CountStrip, EmptyState, FilterBar, RowList } from "@/components/editorial";
import { StatusDot } from "@/components/ui/status-dot";
import { toneFor } from "@/lib/status";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { BoardRow, bicycleService } from "@/services/database.service";
import { toast } from "sonner";

interface Bicycle extends BoardRow {
  brand: string;
  color: string;
  location: string;
  contact_number: string;
  description?: string;
  status?: string;
  rented_by?: string;
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
    label: "In repair", 
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
      const data = await bicycleService.list<Bicycle>();
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
      await bicycleService.create({
        brand: formData.registration_number,
        description: formData.registration_number,
      });
      toast.success("Bicycle added successfully!");
      setFormData({ registration_number: "" });
      setIsDialogOpen(false);
      await loadBicycles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add bicycle");
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
    if (window.confirm("Are you sure you want to delete this bicycle report?")) {
      try {
        await bicycleService.remove(id);
        toast.success("Report deleted successfully!");
        await loadBicycles();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete report");
      }
    }
  };
  const filteredBicycles = bicycles.filter(bicycle => 
    filter === "all" || bicycle.status === filter
  );

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-avenue.webp", alt: "A tree-lined road through the BUET campus in morning light" }}
          eyebrow="Getting around"
          title="Bicycles"
          accent="on campus."
          description="Book a campus bicycle for a ride between buildings."
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Add a bicycle
              </Button>
            </>
          }
        />

        <CountStrip
          label="Bicycles right now"
          items={[
            { value: stats.total, label: "Total", marker: <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" /> },
            { value: stats.available, label: "Available", marker: <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" /> },
            { value: stats.rented, label: "In use", marker: <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warning" /> },
            { value: stats.maintenance, label: "In repair", marker: <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#6f685f]" /> },
          ]}
        />

        <section aria-label="Bicycles">
          <FilterBar
            label="Filter bicycles"
            tabs={[
              { value: "all", label: "All" },
              { value: "available", label: "Available" },
              { value: "rented", label: "In use" },
              { value: "maintenance", label: "In repair" },
            ]}
            value={filter}
            onChange={setFilter}
          />

          {filteredBicycles.length > 0 ? (
            <RowList label="Bicycles">
              {filteredBicycles.map((bicycle) => {
                const status = getBicycleStatus(bicycle.status);
                return (
                  <li key={bicycle.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 py-6 md:grid-cols-[minmax(0,1fr)_180px_160px] md:gap-8">
                    <div className="min-w-0">
                      <p className="font-display text-[26px] leading-tight">{bicycle.brand}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {[bicycle.color !== "Unknown" ? bicycle.color : null, bicycle.location, bicycle.rented_by ? `With ${bicycle.rented_by}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <StatusDot tone={toneFor(bicycle.status === "rented" ? "in_use" : bicycle.status)}>{bicycle.status ? status.label : "Status unknown"}</StatusDot>
                    <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-1">
                      {bicycle.can_delete && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(bicycle.id)} className="text-destructive hover:text-destructive">
                          <Trash2 aria-hidden="true" /> Delete
                        </Button>
                      )}
                      {bicycle.status === "available" && <Button variant="outline" size="sm">Book</Button>}
                    </div>
                  </li>
                );
              })}
            </RowList>
          ) : (
            <EmptyState
              title={bicycles.length === 0 ? "No bicycles yet." : "None in this state."}
              text={bicycles.length === 0 ? "Register a campus bicycle so students can book it." : "Try another tab."}
              action={bicycles.length === 0 ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Add a bicycle</Button> : undefined}
            />
          )}
        </section>

        {/* Add Bicycle Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a bicycle.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
              <div>
                <label htmlFor="bicycles-registration-number" className="block text-sm font-medium mb-1">Registration Number *</label>
                <Input id="bicycles-registration-number"
                  placeholder="e.g., BIKE-001"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
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
                  Add Bicycle
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
