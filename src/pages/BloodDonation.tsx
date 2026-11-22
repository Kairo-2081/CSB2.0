import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState, FilterBar, Kicker, ReportButton, RowList, SectionTitle } from "@/components/editorial";
import { shortDate } from "@/lib/dates";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, MapPin, Loader2, Trash2 } from "lucide-react";
import { BoardRow, bloodDonationService } from "@/services/database.service";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface BloodRequest extends BoardRow {
  blood_type: string;
  name: string;
  location: string;
  contact_number: string;
  available_date: string;
}


const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BloodDonation() {
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [formData, setFormData] = useState({
    blood_type: "O+",
    location: "",
    phone: "",
    available_units: 1,
    consent: false,
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await bloodDonationService.list<BloodRequest>();
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
    if (!formData.location.trim() || !formData.phone) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!formData.consent) {
      toast.error("Tick the box to agree to share your blood group and phone number");
      return;
    }

    try {
      setIsLoading(true);
      await bloodDonationService.create({
        blood_type: formData.blood_type,
        contact_number: formData.phone,
        location: formData.location,
        available_date: new Date().toISOString().split('T')[0],
        consent: true,
      });
      toast.success("Donation registered successfully!");
      setFormData({
        blood_type: "O+",
        location: "",
        phone: "",
        available_units: 1,
        consent: false,
      });
      setIsDialogOpen(false);
      await loadRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register donation");
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
        await bloodDonationService.remove(id);
        
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
      <div className="page-container">
        <PageHeader
          glow="oxblood"
          motif="blood"
          eyebrow="Health"
          title="Blood donation."
          accent={"Give where it's needed."}
          description="Find a donor when someone needs blood, or list yourself as one."
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Register as a donor
              </Button>
            </>
          }
        />

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section aria-labelledby="donors">
            <SectionTitle id="donors">Donors</SectionTitle>
            <FilterBar
              label="Filter by blood group"
              tabs={[{ value: "all", label: "All" }, ...bloodGroups.map((g) => ({ value: g, label: g.replace("-", "−") }))]}
              value={bloodGroupFilter}
              onChange={setBloodGroupFilter}
            />
            {filteredRequests.length > 0 ? (
              <RowList label="Donors">
                {filteredRequests.map((request) => (
                  <li key={request.id} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-6 gap-y-3 py-6 sm:grid-cols-[88px_minmax(0,1fr)_auto]">
                    <span className="font-display text-[44px] leading-none text-accent">{request.blood_type.replace("-", "−")}</span>
                    <div className="min-w-0">
                      <Kicker>Available from {shortDate(request.available_date) || "now"}</Kicker>
                      <p className="mt-2 text-base">{request.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                        {request.location}
                      </p>
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
                      {request.contact_number && (
                        <a
                          href={`tel:${request.contact_number}`}
                          className="inline-flex h-10 items-center rounded-md border border-foreground/30 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-foreground/70"
                        >
                          Call {request.contact_number}
                        </a>
                      )}
                      {!request.is_mine && <ReportButton board="blood-donation" rowId={request.id} />}
                    {request.can_delete && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(request.id)} className="text-destructive hover:text-destructive">
                          <Trash2 aria-hidden="true" /> Delete
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </RowList>
            ) : (
              <EmptyState
                title={requests.length === 0 ? "No donors listed yet." : "No donors in this group."}
                text={requests.length === 0 ? "List yourself as a donor so people on campus can reach you when blood is needed." : "Try another blood group."}
                action={requests.length === 0 ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Register as a donor</Button> : undefined}
              />
            )}
          </section>

          <section aria-labelledby="by-group">
            <SectionTitle id="by-group">Donors by group</SectionTitle>
            <ul className="stagger grid grid-cols-4">
              {bloodGroups.map((group) => (
                <li key={group} className="border-b border-foreground/[0.07] py-5">
                  <span className="block font-display text-[26px]">{group.replace("-", "−")}</span>
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    {requests.filter((r) => r.blood_type === group).length} donors
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] leading-[22px] text-muted-foreground">
              Donors list themselves here and can remove their entry at any time. Call only to arrange a donation.
            </p>
          </section>
        </div>

        {/* New Request Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register as a donor.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
              <div>
                <label htmlFor="blooddonation-blood-type" className="block text-sm font-medium mb-1">Blood Type *</label>
                <Select 
                  value={formData.blood_type}
                  onValueChange={(value) => setFormData({...formData, blood_type: value})}
                  disabled={isLoading}
                >
                  <SelectTrigger id="blooddonation-blood-type">
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
                <label htmlFor="blooddonation-location" className="block text-sm font-medium mb-1">Location *</label>
                <Input id="blooddonation-location"
                  placeholder="Your location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="blooddonation-phone-number" className="block text-sm font-medium mb-1">Phone Number *</label>
                <Input id="blooddonation-phone-number"
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="blooddonation-available-units" className="block text-sm font-medium mb-1">Available Units</label>
                <Input id="blooddonation-available-units"
                  type="number"
                  min="1"
                  value={formData.available_units}
                  onChange={(e) => setFormData({...formData, available_units: parseInt(e.target.value)})}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-start gap-3 rounded-md border border-border px-4 py-3">
                <Checkbox
                  id="blood-consent"
                  checked={formData.consent}
                  onCheckedChange={(v) => setFormData({ ...formData, consent: v === true })}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label data-plain htmlFor="blood-consent" className="text-[13px] leading-5 text-muted-foreground">
                  I agree that signed-in students at my university can see my name, blood group, location and
                  phone number so they can contact me for a donation. I can remove this listing at any time.
                </label>
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
