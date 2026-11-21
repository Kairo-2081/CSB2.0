import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Page, PageHeader, Toolbar } from "@/components/layout/Page";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterGroup } from "@/components/layout/FilterGroup";
import { SearchField } from "@/components/layout/SearchField";
import { formatCount, formatDate } from "@/lib/format";
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
      toast.success("Donation registered");
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
    if (window.confirm("Delete this request?")) {
      try {
        // Pass user info for authorization
        await bloodDonationService.deleteDonor(id);
        
        toast.success("Request deleted");
        await loadRequests();
      } catch (error) {
        console.error("Error deleting request:", error);
        toast.error("Failed to delete request");
      }
    }
  };

  return (
    <MainLayout>
      <Page>
        <PageHeader
          title="Blood donation"
          description="Donors on campus, their blood group and when they can give"
          meta={`${formatCount(requests.length, "donor")} registered`}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Register as donor
            </Button>
          }
        />

        <FilterGroup
          label="Blood group"
          value={bloodGroupFilter}
          onChange={setBloodGroupFilter}
          options={[{ value: "all", label: "All groups" }, ...bloodGroups.map((group) => ({ value: group, label: group }))]}
        />

        {filteredRequests.length === 0 ? (
          <EmptyState icon={Droplets} title="No donors in this group" description="Registered donors will appear here" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRequests.map((request) => (
              <article key={request.id} className="glass-panel flex gap-5 rounded-2xl p-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10">
                  <span className="font-mono text-xl font-medium text-[hsl(358_85%_74%)]">{request.blood_type}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-medium text-foreground">{request.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Available from <span className="text-foreground">{formatDate(request.available_date)}</span>
                  </p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                      <dt className="sr-only">Location</dt>
                      <dd className="truncate">{request.location}</dd>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                      <dt className="sr-only">Phone</dt>
                      <dd className="truncate font-mono text-[13px] tabular-nums">{request.contact_number}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" className="flex-1">Contact donor</Button>
                    {request.user_id === user?.id && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(request.id)} aria-label="Delete entry">
                        <Trash2 aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* New Request Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Register as a donor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Blood type</label>
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
                <label className="mb-2 block text-sm font-medium text-foreground">Patient name</label>
                <Input
                  placeholder="Your name"
                  value={formData.donor_name}
                  onChange={(e) => setFormData({...formData, donor_name: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Location</label>
                <Input
                  placeholder="Your location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Phone number</label>
                <Input
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Available units</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.available_units}
                  onChange={(e) => setFormData({...formData, available_units: parseInt(e.target.value)})}
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
                  Register
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Page>
    </MainLayout>
  );
}
