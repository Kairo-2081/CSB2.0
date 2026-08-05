import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
      toast.success("Item posted successfully!");
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
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await lostFoundService.deleteItem(id);
        toast.success("Item deleted successfully!");
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
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lost & Found</h1>
            <p className="text-muted-foreground mt-1">Report lost items or help others find theirs</p>
          </div>
          <Button 
            variant="glow" 
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Post Item
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "lost" ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter("lost")}
            >
              Lost
            </Button>
            <Button
              variant={filter === "found" ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter("found")}
            >
              Found
            </Button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, index) => (
            <Card 
              key={item.id}
              variant="interactive"
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant={item.item_type === "lost" ? "destructive" : "success"}>
                      {item.item_type === "lost" ? "Lost" : "Found"}
                    </Badge>
                    <CardTitle className="text-lg mt-2">{item.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {item.posted_by}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {item.user_id === "current-user-id" && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card variant="glass" className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </Card>
        )}

        {/* New Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report Lost/Found Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <Select 
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value as any})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost Item</SelectItem>
                    <SelectItem value="found">Found Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  placeholder="Item name or brief description"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <Input
                  placeholder="Where was it lost/found?"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Textarea
                  placeholder="Describe the item in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <Input
                  placeholder="Your name (optional)"
                  value={formData.posted_by}
                  onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Number *</label>
                <Input
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
