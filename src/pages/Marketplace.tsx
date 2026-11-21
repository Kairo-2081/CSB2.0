import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus, 
  Search, 
  Phone, 
  User,
  DollarSign,
  Tag,
  Loader2,
  Trash2
} from "lucide-react";
import { marketplaceService } from "@/services/database.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  phone: string;
  user_id: string;
  category: string;
  is_sold: boolean;
  created_at: string;
}

export default function Marketplace() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    seller: "Anonymous",
    phone: "",
    category: "Books",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await marketplaceService.getItems();
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
    if (!user) {
      toast.error("Please login to post items");
      return;
    }
    if (!formData.title.trim() || !formData.description.trim() || !formData.price || !formData.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await marketplaceService.createItem({
        ...formData,
        price: parseFloat(formData.price),
        user_id: user.id,
      });
      toast.success("Item posted successfully!");
      setFormData({
        title: "",
        description: "",
        price: "",
        seller: "Anonymous",
        phone: "",
        category: "Books",
      });
      setIsDialogOpen(false);
      await loadItems();
    } catch (error) {
      console.error("Error creating item:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to post item";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [...new Set(items.map(item => item.category))];

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        setIsLoading(true);
        await marketplaceService.deleteItem(id);
        toast.success("Item deleted successfully!");
        await loadItems();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to delete item";
        console.error("Error deleting item:", error);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const notSold = !item.is_sold;
    return matchesSearch && matchesCategory && notSold;
  });

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8 p-6 sm:p-8 lg:p-10">
        <PageHeader
          eyebrow={"Buy & sell"}
          title="Marketplace,"
          accent="within campus."
          description="Buy and sell items with other students."
          actions={
            <>
              <Button 
             
                className="gap-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Sell Item
              </Button>
            </>
          }
        />

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
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={categoryFilter === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "secondary"}
                size="sm"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, index) => (
            <Card 
              key={item.id} 
              className="overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-32 bg-muted flex items-center justify-center">
                <Tag className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground line-clamp-1">{item.title}</h3>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xl font-bold text-primary">
                    <DollarSign className="h-5 w-5" />
                    {item.price}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {item.seller}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {item.phone}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Contact Seller
                  </Button>
                  {user && item.user_id === user.id && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="gap-2"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </Card>
        )}

        {/* Sell Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>List Item for Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  placeholder="Item name"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <Input
                  placeholder="e.g., Books, Electronics, Accessories"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price ($) *</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <Input
                  placeholder="Your name (optional)"
                  value={formData.seller}
                  onChange={(e) => setFormData({...formData, seller: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <Input
                  placeholder="Your contact number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                  List Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
