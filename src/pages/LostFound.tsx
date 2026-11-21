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
import { lostFoundService } from "@/services/database.service";
import { toast } from "sonner";

interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  location: string;
  item_type: "lost" | "found";
  status: "lost" | "found";
  contact_number?: string;
  posted_by: string;
  user_id: string;
  created_at: string;
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
    type: "lost" as const,
    posted_by: "Anonymous",
    contact_number: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await lostFoundService.getItems();
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
      await lostFoundService.createItem({
        ...formData,
        item_type: formData.type,
        status: formData.type,
        user_id: "current-user-id",
      });
      toast.success("Item posted");
      setFormData({
        title: "",
        description: "",
        location: "",
        type: "lost",
        posted_by: "Anonymous",
        contact_number: "",
      });
      setIsDialogOpen(false);
      await loadItems();
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to post item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this item?")) {
      try {
        await lostFoundService.deleteItem(id);
        toast.success("Item deleted");
        await loadItems();
      } catch (error) {
        console.error("Error deleting item:", error);
        toast.error("Failed to delete item");
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
      <Page>
        <PageHeader
          title="Lost and found"
          description="Report something you lost or found on campus and help it get back to its owner"
          meta={`${items.filter((item) => item.item_type === "lost").length} lost · ${items.filter((item) => item.item_type === "found").length} found`}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Post item
            </Button>
          }
        />

        <Toolbar>
          <SearchField label="Search items" value={searchQuery} onChange={setSearchQuery} />
          <FilterGroup
            label="Type"
            value={filter}
            onChange={(value) => setFilter(value as "all" | "lost" | "found")}
            options={[{ value: "all", label: "All" }, { value: "lost", label: "Lost" }, { value: "found", label: "Found" }]}
          />
        </Toolbar>

        {filteredItems.length === 0 ? (
          <EmptyState icon={Search} title="No items found" description="Try another search or type" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="glass-panel flex flex-col rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={item.item_type === "lost" ? "warning" : "success"}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{item.item_type === "lost" ? "Lost" : "Found"}</Badge>
                  <time dateTime={item.created_at} className="stamp">{formatDate(item.created_at)}</time>
                </div>
                <h3 className="mt-4 text-base font-medium text-foreground">{item.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <dl className="mb-4 mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                    <dt className="sr-only">Location</dt>
                    <dd className="truncate">{item.location}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                    <dt className="sr-only">Posted by</dt>
                    <dd className="truncate">{item.posted_by}</dd>
                  </div>
                </dl>
                <div className="mt-auto flex gap-2 border-t border-border pt-4">
                  <Button variant="outline" size="sm" className="flex-1">View details</Button>
                  {item.user_id === "current-user-id" && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} aria-label="Delete item">
                      <Trash2 aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* New Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report a lost or found item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
                <Select 
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value as any})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost item</SelectItem>
                    <SelectItem value="found">Found item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <Input
                  placeholder="Item name or brief description"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Location</label>
                <Input
                  placeholder="Where it was lost or found"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="Describe the item in detail"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-32"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Your name</label>
                <Input
                  placeholder="Optional"
                  value={formData.posted_by}
                  onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Contact number</label>
                <Input
                  placeholder="Your contact number"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
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
                  Post item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Page>
    </MainLayout>
  );
}
