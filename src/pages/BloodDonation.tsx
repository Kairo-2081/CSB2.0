import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  Droplets, 
  MapPin, 
  Phone, 
  Clock,
  AlertTriangle,
  Heart,
  Loader2,
  Trash2
} from "lucide-react";
import { bloodDonationService } from "@/services/database.service";
import { toast } from "sonner";

interface BloodRequest {
  id: string;
  blood_type: string;
  name: string;
  location: string;
  contact_number: string;
  available_date: string;
  user_id: string;
  created_at: string;
}

const mockRequests: BloodRequest[] = [];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BloodDonation() {
  const { user } = useAuth();
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [formData, setFormData] = useState({
    blood_type: "O+",
    donor_name: "Anonymous",
    location: "",
    phone: "",
    available_units: 1,
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await bloodDonationService.getDonors();
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load blood requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.donor_name.trim() || !formData.location.trim() || !formData.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await bloodDonationService.createDonor({
        name: formData.donor_name,
        blood_type: formData.blood_type,
        contact_number: formData.phone,
        location: formData.location,
        available_date: new Date().toISOString().split('T')[0],
        user_id: user?.id || "anonymous",
      });
      toast.success("Donation registered successfully!");
      setFormData({
        blood_type: "O+",
        donor_name: "Anonymous",
        location: "",
        phone: "",
        available_units: 1,
      });
      setIsDialogOpen(false);
      await loadRequests();
    } catch (error) {
      console.error("Error creating donation:", error);
      toast.error("Failed to register donation");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(request =>
    bloodGroupFilter === "all" || request.blood_type === bloodGroupFilter
  );

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this request?")) {
      try {
        // Pass user info for authorization
        const user_data = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(`http://localhost:3001/api/blood-donation/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user_data.id,
            userRole: user_data.role
          }),
        });
        
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        
        toast.success("Request deleted successfully!");
        await loadRequests();
      } catch (error) {
        console.error("Error deleting request:", error);
        toast.error("Failed to delete request");
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blood Donation</h1>
            <p className="text-muted-foreground mt-1">Request or donate blood to save lives</p>
          </div>
          <Button 
            variant="glow" 
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>

        {/* Blood Group Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={bloodGroupFilter === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => setBloodGroupFilter("all")}
          >
            All Groups
          </Button>
          {bloodGroups.map((group) => (
            <Button
              key={group}
              variant={bloodGroupFilter === group ? "default" : "secondary"}
              size="sm"
              onClick={() => setBloodGroupFilter(group)}
              className="min-w-[60px]"
            >
              {group}
            </Button>
          ))}
        </div>

        {/* Requests Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRequests.map((request, index) => (
            <Card 
              key={request.id} 
              variant="interactive"
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Droplets className="h-6 w-6" />
                    <span className="text-lg font-bold mt-1">{request.blood_type}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Heart className="h-4 w-4 text-destructive" />
                        {request.name}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {request.location}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {request.contact_number}
                      </div>
                      <div className="text-muted-foreground">
                        Available Date: <span className="font-semibold">{new Date(request.available_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Contact Donor
                      </Button>
                      {request.user_id === user?.id && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <Card variant="glass" className="p-12 text-center">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No donations available</h3>
            <p className="text-muted-foreground mt-1">Be the first to register as a donor</p>
          </Card>
        )}

        {/* New Request Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Register Blood Donation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Blood Type *</label>
                <Select 
                  value={formData.blood_type}
                  onValueChange={(value) => setFormData({...formData, blood_type: value})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((group) => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Patient Name *</label>
                <Input
                  placeholder="Your name"
                  value={formData.donor_name}
                  onChange={(e) => setFormData({...formData, donor_name: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <Input
                  placeholder="Your location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <Input
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Available Units</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.available_units}
                  onChange={(e) => setFormData({...formData, available_units: parseInt(e.target.value)})}
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
                  Register
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
