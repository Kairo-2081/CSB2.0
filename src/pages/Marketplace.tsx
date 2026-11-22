import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState, FilterBar, ObjectTile, ReportButton } from "@/components/editorial";
import { shortDate } from "@/lib/dates";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, ArrowUpRight } from "lucide-react";
import { BoardRow, marketplaceService } from "@/services/database.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const takaNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const taka = { format: (n: number) => `৳ ${takaNumber.format(n)}` };

interface MarketplaceItem extends BoardRow {
  title: string;
  description: string;
  price: number;
  seller: string;
  phone: string;
  category: string;
  is_sold: boolean;
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
    phone: "",
    category: "Books",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await marketplaceService.list<MarketplaceItem>();
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
      await marketplaceService.create({
        ...formData,
        price: parseFloat(formData.price),
      });
      toast.success("Item posted successfully!");
      setFormData({
        title: "",
        description: "",
        price: "",
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
        await marketplaceService.remove(id);
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
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/campus-night-market.webp", alt: "A night market stall hung with bags under strings of lights" }}
          eyebrow={"Buy & sell"}
          title="Marketplace,"
          accent="within campus."
          description="Buy and sell with other BUET students. Meet on campus to hand things over."
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Sell an item
              </Button>
            </>
          }
        />

        <section aria-label="Listings">
          <FilterBar
            label="Filter listings"
            tabs={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            search={searchQuery}
            onSearch={setSearchQuery}
            searchLabel="Search listings"
          />

          {filteredItems.length > 0 ? (
            <ul className="stagger mt-10 grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item, index) => (
                <li key={item.id}>
                  <ObjectTile title={item.title} category={item.category} index={index} />
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h3 className="text-base leading-6">{item.title}</h3>
                    <span className="whitespace-nowrap font-display text-2xl text-accent">{taka.format(Number(item.price) || 0)}</span>
                  </div>
                  {item.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>}
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {item.seller} · {shortDate(item.created_at)}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    {item.phone ? (
                      <a href={`tel:${item.phone}`} className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent hover:text-foreground">
                        Call {item.phone}
                        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span />
                    )}
                    {!item.is_mine && <ReportButton board="marketplace" rowId={item.id} />}
                    {item.can_delete && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} disabled={isLoading} className="text-destructive hover:text-destructive">
                        <Trash2 aria-hidden="true" /> Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={items.length === 0 ? "Nothing for sale yet." : "Nothing matches."}
              text={items.length === 0 ? "Selling books, a calculator or a lamp? List it for other BUET students." : "Try another category or a different search."}
              action={items.length === 0 ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Sell the first item</Button> : undefined}
            />
          )}
        </section>

        {/* Sell Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sell an item.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
              <div>
                <label htmlFor="marketplace-title" className="block text-sm font-medium mb-1">Title *</label>
                <Input id="marketplace-title"
                  placeholder="Item name"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="marketplace-category" className="block text-sm font-medium mb-1">Category *</label>
                <Input id="marketplace-category"
                  placeholder="e.g., Books, Electronics, Accessories"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="marketplace-price" className="block text-sm font-medium mb-1">Price (৳) *</label>
                <Input id="marketplace-price"
                  type="number"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="marketplace-description" className="block text-sm font-medium mb-1">Description *</label>
                <Textarea id="marketplace-description"
                  placeholder="Describe the item in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label htmlFor="marketplace-phone-number" className="block text-sm font-medium mb-1">Phone Number *</label>
                <Input id="marketplace-phone-number"
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
