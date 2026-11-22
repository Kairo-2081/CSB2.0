import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateBlock, EmptyState, FilterBar, Kicker, RowList } from "@/components/editorial";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { BoardRow, noticeService } from "@/services/database.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const message = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

interface Notice extends BoardRow {
  title: string;
  description: string;
  category: "general" | "academic" | "event" | "urgent";
  posted_by: string;
}

const categoryConfig: Record<Notice["category"], { label: string }> = {
  general: { label: "General" },
  academic: { label: "Academic" },
  event: { label: "Event" },
  urgent: { label: "Urgent" },
};

export default function Notices() {
  const { isAdmin } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | Notice["category"]>("all");
  const [query, setQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general" as Notice["category"],
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setIsLoading(true);
      const data = await noticeService.list<Notice>();
      setNotices(data);
    } catch (error) {
      console.error("Error loading notices:", error);
      toast.error("Failed to load notices");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await noticeService.create(formData);
      toast.success("Notice posted successfully!");
      setFormData({
        title: "",
        description: "",
        category: "general",
      });
      setIsDialogOpen(false);
      await loadNotices();
    } catch (error) {
      toast.error(message(error, "Failed to post notice"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await noticeService.remove(id);
        toast.success("Notice deleted successfully!");
        await loadNotices();
      } catch (error) {
        toast.error(message(error, "Failed to delete notice"));
      }
    }
  };

  const q = query.trim().toLowerCase();
  const visible = notices.filter(
    (n) =>
      (filter === "all" || n.category === filter) &&
      (!q || `${n.title} ${n.description} ${n.posted_by}`.toLowerCase().includes(q)),
  );

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-gate.webp", alt: "The BUET main gate, with the university name in Bangla and English" }}
          eyebrow="Announcements"
          title="Notices"
          accent="from across campus."
          description="Official announcements from offices, halls and departments."
          actions={
            isAdmin ? (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Post a notice
              </Button>
            ) : undefined
          }
        />

        <section aria-label="Notices">
          <FilterBar<"all" | Notice["category"]>
            label="Filter notices"
            tabs={[
              { value: "all", label: "All" },
              { value: "academic", label: "Academic" },
              { value: "event", label: "Events" },
              { value: "general", label: "General" },
              { value: "urgent", label: "Urgent" },
            ]}
            value={filter}
            onChange={setFilter}
            search={query}
            onSearch={setQuery}
            searchLabel="Search notices"
          />

          {visible.length > 0 ? (
            <RowList label="Notices">
              {visible.map((notice) => {
                const category = categoryConfig[notice.category] ?? categoryConfig.general;
                return (
                  <li key={notice.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-5 py-8 md:grid-cols-[96px_minmax(0,1fr)_200px] md:gap-8">
                    <DateBlock date={notice.created_at} />
                    <div className="min-w-0">
                      <Kicker className="flex items-center gap-2">
                        {notice.category === "urgent" && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                        {category.label}
                      </Kicker>
                      <h3 className="mt-2.5 font-display text-[26px] font-normal leading-[1.2] tracking-[-0.01em]">{notice.title}</h3>
                      <p className="mt-2.5 max-w-2xl whitespace-pre-line text-[15px] leading-[26px] text-muted-foreground">{notice.description}</p>
                      <p className="mt-3 text-[13px] text-muted-foreground md:hidden">{notice.posted_by}</p>
                    </div>
                    <div className="hidden flex-col items-end gap-4 text-right md:flex">
                      <span className="text-[13px] leading-5 text-muted-foreground">{notice.posted_by}</span>
                      {notice.can_delete && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(notice.id)} className="text-destructive hover:text-destructive">
                          <Trash2 aria-hidden="true" /> Delete
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </RowList>
          ) : (
            <EmptyState
              title={notices.length === 0 ? "No notices yet." : "Nothing matches."}
              text={notices.length === 0 ? "Announcements from offices, halls and departments will appear here." : "Try another category or a different search."}
              action={notices.length === 0 && isAdmin ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Post the first notice</Button> : undefined}
            />
          )}
        </section>

        {/* Post Notice Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post a notice.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
              <div>
                <label htmlFor="notices-title" className="block text-sm font-medium mb-1">Title *</label>
                <Input id="notices-title"
                  placeholder="Notice title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="notices-category" className="block text-sm font-medium mb-1">Category *</label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as Notice["category"] })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="notices-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="notices-description" className="block text-sm font-medium mb-1">Description *</label>
                <Textarea id="notices-description"
                  placeholder="Write the notice details..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-[120px]"
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
                  Post Notice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
