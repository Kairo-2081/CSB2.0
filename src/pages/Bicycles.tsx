import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
    label: "In Use", 
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

const mockBicycles: Bicycle[] = [];

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
      toast.success("Bicycle added successfully!");
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
    if (window.confirm("Are you sure you want to delete this bicycle report?")) {
      try {
        await bicycleService.deleteReport(id);
        toast.success("Report deleted successfully!");
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
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bicycle Sharing</h1>
            <p className="text-muted-foreground mt-1">Book and manage campus bicycles</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Bicycle
            </Button>
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              Booking History
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Bicycles</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rented}</p>
                <p className="text-xs text-muted-foreground">In Use</p>
              </div>
            </div>
          </Card>
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter(key)}
              className="gap-1.5"
            >
              <config.icon className="h-3.5 w-3.5" />
              {config.label}
            </Button>
          ))}
        </div>

        {/* Bicycles Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBicycles.map((bicycle, index) => {
            const status = statusConfig[bicycle.status];
            const StatusIcon = status.icon;
            
            return (
              <Card 
                key={bicycle.id} 
                variant="interactive"
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{bicycle.brand} - {bicycle.color}</h3>
                        <p className="text-sm text-muted-foreground">{bicycle.id}</p>
                      </div>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>

                    {bicycle.rented_by && (
                      <div className="text-sm text-muted-foreground">
                        Currently with: <span className="font-medium text-foreground">{bicycle.rented_by}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-border">
                      {bicycle.user_id === "current-user-id" && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(bicycle.id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {bicycle.status === "available" ? (
                        <Button variant="default" size="sm" className="flex-1">
                          Book Now
                        </Button>
                      ) : bicycle.status === "rented" ? (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          In Use
                        </Button>
                      ) : (
                        <Button variant="destructive" size="sm" className="flex-1" disabled>
                          Maintenance
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredBicycles.length === 0 && (
          <Card variant="glass" className="p-12 text-center">
            <Bike className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No bicycles found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters</p>
          </Card>
        )}

        {/* Add Bicycle Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add New Bicycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Registration Number *</label>
                <Input
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
