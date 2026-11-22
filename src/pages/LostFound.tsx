import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DateBlock, EmptyState, FilterBar, RowList } from "@/components/editorial";
import { StatusDot } from "@/components/ui/status-dot";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  MessageCircle,
  User,
  Loader2,
  Trash2
} from "lucide-react";
import { BoardRow, lostFoundService } from "@/services/database.service";
import { toast } from "sonner";

interface LostFoundItem extends BoardRow {
  title: string;
  description: string;
  location: string;
  item_type: "lost" | "found";
  status: "lost" | "found";
  contact_number?: string;
  posted_by: string;
}

export default function LostFound() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    type: "lost" as "lost" | "found",
    contact_number: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await lostFoundService.list<LostFoundItem>();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim() || !formData.contact_number.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await lostFoundService.create({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        item_type: formData.type,
        contact_number: formData.contact_number,
      });
      toast.success("Item posted successfully!");
      setFormData({
        title: "",
        description: "",
        location: "",
        type: "lost",
        contact_number: "",
      });
      setIsDialogOpen(false);
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await lostFoundService.remove(id);
        toast.success("Item deleted successfully!");
        await loadItems();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete item");
      }
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || item.item_type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-day-reflection.webp", alt: "BUET buildings on a clear day, reflected in standing water" }}
          eyebrow={"Lost & found"}
          title="Lost something?"
          accent="Found something?"
          description="Report it here. Most things turn up within a day or two."
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Report an item
              </Button>
            </>
          }
        />

        <section aria-label="Lost and found items">
          <FilterBar<"all" | "lost" | "found">
            label="Show"
            tabs={[
              { value: "all", label: "All", count: items.length },
              { value: "lost", label: "Lost", count: items.filter((i) => i.item_type === "lost").length },
              { value: "found", label: "Found", count: items.filter((i) => i.item_type === "found").length },
            ]}
            value={filter}
            onChange={setFilter}
            search={searchQuery}
            onSearch={setSearchQuery}
            searchLabel="Search items"
          />

          {filteredItems.length > 0 ? (
            <RowList label="Items">
              {filteredItems.map((item) => (
                <li key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-5 py-8 md:grid-cols-[96px_minmax(0,1fr)_220px] md:gap-8">
                  <DateBlock date={item.created_at} />
                  <div className="min-w-0">
                    <StatusDot tone={item.item_type === "found" ? "resolved" : "open"} className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d857c]">
                      {item.item_type === "found" ? "Found" : "Lost"}
                    </StatusDot>
                    <h3 className="mt-2.5 font-display text-[26px] font-normal leading-[1.2]">{item.title}</h3>
                    {item.description && <p className="mt-2 max-w-2xl text-[15px] leading-[26px] text-muted-foreground">{item.description}</p>}
                    <p className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                      {item.location}
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-end">
                    {item.posted_by && <span className="text-[13px] text-muted-foreground">Posted by {item.posted_by}</span>}
                    {item.contact_number && (
                      <a
                        href={`tel:${item.contact_number}`}
                        className="inline-flex h-10 items-center rounded-md border border-foreground/30 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-foreground/70"
                      >
                        Call {item.contact_number}
                      </a>
                    )}
                    {item.can_delete && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive">
                        <Trash2 aria-hidden="true" /> Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </RowList>
          ) : (
            <EmptyState
              title={items.length === 0 ? "Nothing reported yet." : "Nothing matches."}
              text={items.length === 0 ? "Lost something on campus, or found something that isn't yours? Post it here." : "Try another tab or a different search."}
              action={items.length === 0 ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Report an item</Button> : undefined}
            />
          )}
        </section>

        {/* New Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report an item.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
              <div>
                <label htmlFor="lostfound-type" className="block text-sm font-medium mb-1">Type *</label>
                <Select 
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value as "lost" | "found"})}
                  disabled={isLoading}
                >
                  <SelectTrigger id="lostfound-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost Item</SelectItem>
                    <SelectItem value="found">Found Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="lostfound-title" className="block text-sm font-medium mb-1">Title *</label>
                <Input id="lostfound-title"
                  placeholder="Item name or brief description"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="lostfound-location" className="block text-sm font-medium mb-1">Location *</label>
                <Input id="lostfound-location"
                  placeholder="Where was it lost/found?"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="lostfound-description" className="block text-sm font-medium mb-1">Description *</label>
                <Textarea id="lostfound-description"
                  placeholder="Describe the item in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <label htmlFor="lostfound-contact-number" className="block text-sm font-medium mb-1">Contact Number *</label>
                <Input id="lostfound-contact-number"
                  placeholder="Your contact number"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
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
                  Post Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
