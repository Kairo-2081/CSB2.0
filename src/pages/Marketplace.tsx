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
      toast.error("Sign in to post items");
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
      toast.success("Item posted");
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

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this item?")) {
      try {
        setIsLoading(true);
        await marketplaceService.deleteItem(id);
        toast.success("Item deleted");
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
      <Page>
        <PageHeader
          title="Marketplace"
          description="Buy and sell books, electronics and everyday things with people on your campus"
          meta={formatCount(items.length, "listing")}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Sell an item
            </Button>
          }
        />

        <Toolbar>
          <SearchField label="Search listings" value={searchQuery} onChange={setSearchQuery} />
          {categories.length > 1 && (
            <FilterGroup
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[{ value: "all", label: "All" }, ...categories.map((category) => ({ value: category, label: category }))]}
            />
          )}
        </Toolbar>

        {filteredItems.length === 0 ? (
          <EmptyState icon={Search} title="No listings found" description="Try another search or category" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="glass-panel flex flex-col rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  {item.category ? <Badge variant="outline">{item.category}</Badge> : <span />}
                  <time dateTime={item.created_at} className="stamp">{formatDate(item.created_at)}</time>
                </div>
                <p className="mt-5 text-3xl font-medium leading-none tabular-nums text-foreground">
                  <span className="mr-1 text-xl font-normal text-subtle">$</span>
                  {Number(item.price).toLocaleString("en-US")}
                </p>
                <h3 className="mt-4 line-clamp-1 text-base font-medium text-foreground">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                    <dt className="sr-only">Seller</dt>
                    <dd className="truncate">{item.seller}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                    <dt className="sr-only">Phone</dt>
                    <dd className="truncate font-mono text-[13px] tabular-nums">{item.phone}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Contact seller</Button>
                  {user && item.user_id === user.id && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} disabled={isLoading} aria-label="Delete listing">
                      <Trash2 aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Sell Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Sell an item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <Input
                  placeholder="Item name"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Category</label>
                <Input
                  placeholder="Books, electronics, accessories"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Price ($)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                  className="min-h-28"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Your name</label>
                <Input
                  placeholder="Optional"
                  value={formData.seller}
                  onChange={(e) => setFormData({...formData, seller: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Phone number</label>
                <Input
                  placeholder="Your contact number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                  List item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Page>
    </MainLayout>
  );
}
