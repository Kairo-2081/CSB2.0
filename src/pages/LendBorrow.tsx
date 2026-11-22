import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Check, Clock3, MapPin, Plus, Search, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ObjectTile } from "@/components/editorial";
import { StatusDot } from "@/components/ui/status-dot";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { lendingService, LendingItem, LendingRequest } from "@/services/database.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const categories = ["Books", "Calculators", "Electronics", "Sports equipment", "Study supplies", "Other"];
const conditions = ["Like new", "Good", "Fair"];

const emptyListing = {
  title: "",
  description: "",
  category: categories[0],
  itemCondition: conditions[1],
  handoffLocation: "",
};

const requestStatus = {
  pending: { label: "Waiting for a response", variant: "outline" as const, className: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  approved: { label: "Approved", variant: "outline" as const, className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  declined: { label: "Declined", variant: "destructive" as const, className: "" },
  returned: { label: "Returned", variant: "secondary" as const, className: "" },
};

export default function LendBorrow() {
  const { user } = useAuth();
  const [items, setItems] = useState<LendingItem[]>([]);
  const [requests, setRequests] = useState<LendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("borrow");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isListingOpen, setIsListingOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LendingItem | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [listing, setListing] = useState(emptyListing);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [nextItems, nextRequests] = await Promise.all([
        lendingService.getItems(),
        lendingService.getRequests(),
      ]);
      setItems(nextItems);
      setRequests(nextRequests);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not load lend and borrow activity.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesText = `${item.title} ${item.description} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesText && (category === "all" || item.category === category);
  }), [category, items, search]);

  const myListings = items.filter((item) => item.owner_id === user?.id);
  const activeRequests = requests.filter((request) =>
    request.status === "pending" || request.status === "approved"
  );

  const handleCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      await lendingService.createItem(listing);
      setListing(emptyListing);
      setIsListingOpen(false);
      toast.success("Your item is now listed for lending");
      await loadData();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not post this item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBorrowRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItem) return;
    try {
      setIsSaving(true);
      await lendingService.requestToBorrow(selectedItem.id, requestMessage);
      setSelectedItem(null);
      setRequestMessage("");
      toast.success("Borrow request sent to the lender");
      await loadData();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not send borrow request");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestAction = async (
    request: LendingRequest,
    action: "approve" | "decline" | "return",
  ) => {
    try {
      setIsSaving(true);
      await lendingService.updateRequest(request.id, action);
      const message = action === "approve" ? "Borrow request approved"
        : action === "decline" ? "Borrow request declined"
          : "Item marked as returned";
      toast.success(message);
      await loadData();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update this request");
    } finally {
      setIsSaving(false);
    }
  };

  const itemCard = (item: LendingItem, index: number) => {
    const isOwner = item.owner_id === user?.id;
    const hasRequested = Boolean(item.has_active_request);
    const available = item.status === "available";
    return (
      <li key={item.id}>
        <ObjectTile title={item.title} category={item.category} index={index} />
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="text-base leading-6">{item.title}</h3>
          <StatusDot tone={available ? "resolved" : "progress"} className="whitespace-nowrap text-xs text-muted-foreground">
            {available ? "Available" : "On loan"}
          </StatusDot>
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {isOwner ? "You" : item.owner_name} · {item.item_condition}
        </p>
        {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
          {item.handoff_location}
        </p>
        <div className="mt-3">
          {isOwner ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your listing</span>
          ) : hasRequested ? (
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" /> Request sent
            </span>
          ) : available ? (
            <button
              type="button"
              onClick={() => setSelectedItem(item)}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent hover:text-foreground"
            >
              Request to borrow <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Currently on loan</span>
          )}
        </div>
      </li>
    );
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-academic-building.webp", alt: "A BUET academic building behind a large tree" }}
          eyebrow="Sharing"
          title="Lend and borrow,"
          accent="within BUET."
          description="Share useful things with people at BUET. Listings are visible only to your university."
          actions={
            <Button onClick={() => setIsListingOpen(true)}>
              <Plus className="h-4 w-4" /> Lend an item
            </Button>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
            <TabsTrigger value="lend">Your listings</TabsTrigger>
            <TabsTrigger value="activity">Requests{activeRequests.length > 0 ? ` (${activeRequests.length})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="borrow" className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search lendable items"
                  placeholder="Search items"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select
                aria-label="Filter by category"
                className="h-11 rounded-md border border-white/[0.14] bg-[#121014] px-3 text-sm text-foreground"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            {error && <ErrorState message={error} onRetry={() => void loadData()} />}
            {isLoading ? (
              <LoadingState />
            ) : filteredItems.length ? (
              <ul className="grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">{filteredItems.map(itemCard)}</ul>
            ) : !error ? (
              <EmptyState
                title={search || category !== "all" ? "No matching items" : "Nothing listed to borrow yet"}
                description={search || category !== "all"
                  ? "Try a different search or category."
                  : "When someone at your university lists an item, it will appear here."}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="lend" className="mt-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-[30px] font-normal tracking-[-0.01em]">Items you have listed</h2>
                <p className="mt-1 text-sm text-muted-foreground">Manage lending offers you have shared.</p>
              </div>
              <Button variant="outline" onClick={() => setIsListingOpen(true)}>
                <Plus className="h-4 w-4" /> Add listing
              </Button>
            </div>
            {error && <ErrorState message={error} onRetry={() => void loadData()} />}
            {isLoading ? (
              <LoadingState />
            ) : myListings.length ? (
              <ul className="grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">{myListings.map(itemCard)}</ul>
            ) : !error ? (
              <EmptyState
                title="You have not listed anything"
                description="Offer a book, calculator, or other useful item to your university community."
                action={<Button onClick={() => setIsListingOpen(true)}><Plus className="h-4 w-4" /> Lend an item</Button>}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-5">
            <div>
              <h2 className="font-display text-[30px] font-normal tracking-[-0.01em]">Borrow requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">Requests you have received and sent.</p>
            </div>
            {error && <ErrorState message={error} onRetry={() => void loadData()} />}
            {isLoading ? (
              <LoadingState />
            ) : requests.length ? (
              <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                {requests.map((request) => {
                  const incoming = request.owner_id === user?.id;
                  const status = requestStatus[request.status];
                  return (
                    <div key={request.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{request.item_title}</h3>
                          <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {incoming ? `Requested by ${request.requester_name}` : `Lender: ${request.owner_name}`}
                        </p>
                        {request.message && <p className="mt-2 text-sm text-foreground/80">{request.message}</p>}
                      </div>
                      {incoming && request.status === "pending" && (
                        <div className="flex shrink-0 gap-2">
                          <Button size="sm" disabled={isSaving} onClick={() => void handleRequestAction(request, "approve")}>
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={isSaving} onClick={() => void handleRequestAction(request, "decline")}>
                            <X className="h-4 w-4" /> Decline
                          </Button>
                        </div>
                      )}
                      {incoming && request.status === "approved" && (
                        <Button size="sm" variant="outline" disabled={isSaving} onClick={() => void handleRequestAction(request, "return")}>
                          Mark returned
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : !error ? (
              <EmptyState title="No borrow requests yet" description="Requests you send or receive will appear here." />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isListingOpen} onOpenChange={setIsListingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lend an item</DialogTitle>
            <DialogDescription>Share an item with people at your university.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateListing} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listing-title">Item name</Label>
              <Input id="listing-title" maxLength={100} required value={listing.title} onChange={(event) => setListing({ ...listing, title: event.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="listing-category">Category</Label>
                <select id="listing-category" className="glass-control h-10 w-full rounded-lg px-3 text-sm" value={listing.category} onChange={(event) => setListing({ ...listing, category: event.target.value })}>
                  {categories.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing-condition">Condition</Label>
                <select id="listing-condition" className="glass-control h-10 w-full rounded-lg px-3 text-sm" value={listing.itemCondition} onChange={(event) => setListing({ ...listing, itemCondition: event.target.value })}>
                  {conditions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing-location">Campus handoff location</Label>
              <Input id="listing-location" maxLength={120} required placeholder="For example, library entrance" value={listing.handoffLocation} onChange={(event) => setListing({ ...listing, handoffLocation: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing-description">Details</Label>
              <Textarea id="listing-description" maxLength={1200} required placeholder="Describe the item and any lending notes" value={listing.description} onChange={(event) => setListing({ ...listing, description: event.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsListingOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Posting..." : "Post listing"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null);
          setRequestMessage("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to borrow {selectedItem?.title}</DialogTitle>
            <DialogDescription>Send a request to the lender to arrange an on-campus handoff.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBorrowRequest} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This request will be sent to {selectedItem?.owner_name}. Arrange the handoff on campus if approved.
            </p>
            <div className="space-y-2">
              <Label htmlFor="borrow-message">Message to the lender (optional)</Label>
              <Textarea id="borrow-message" maxLength={500} placeholder="Add a short note" value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedItem(null)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Sending..." : "Send request"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function LoadingState() {
  return (
    <div className="glass-panel rounded-xl px-6 py-12 text-center text-sm text-muted-foreground" role="status">
      Loading university listings…
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-y border-white/[0.07] px-6 py-16 text-center">
      <h3 className="font-display text-3xl font-normal text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="glass-panel flex flex-col gap-3 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
    </div>
  );
}
