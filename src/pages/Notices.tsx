import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Page, PageHeader, Toolbar } from "@/components/layout/Page";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterGroup } from "@/components/layout/FilterGroup";
import { SearchField } from "@/components/layout/SearchField";
import { formatCount, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Bell, Calendar, User, ChevronRight, Plus, Loader2, Trash2 } from "lucide-react";
import { noticeService } from "@/services/database.service";
import { toast } from "sonner";

interface Notice {
  id: string;
  title: string;
  description: string;
  category: "general" | "academic" | "event" | "urgent";
  posted_by: string;
  user_id: string;
  created_at: string;
}

const categoryConfig = {
  general: { label: "General", variant: "outline" as const },
  academic: { label: "Academic", variant: "info" as const },
  event: { label: "Event", variant: "secondary" as const },
  urgent: { label: "Urgent", variant: "destructive" as const },
};

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general" as const,
    posted_by: "Admin",
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setIsLoading(true);
      const data = await noticeService.getNotices();
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
      await noticeService.createNotice({
        ...formData,
        user_id: "current-user-id",
      });
      toast.success("Notice posted");
      setFormData({
        title: "",
        description: "",
        category: "general",
        posted_by: "Admin",
      });
      setIsDialogOpen(false);
      await loadNotices();
    } catch (error) {
      console.error("Error creating notice:", error);
      toast.error("Failed to post notice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this notice?")) {
      try {
        await noticeService.deleteNotice(id);
        toast.success("Notice deleted");
        await loadNotices();
      } catch (error) {
        console.error("Error deleting notice:", error);
        toast.error("Failed to delete notice");
      }
    }
  };

  return (
    <MainLayout>
      <Page>
        <PageHeader
          title="Notices"
          description="Official announcements from departments, halls and the administration"
          meta={`${formatCount(notices.length, "notice")} posted`}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Post notice
            </Button>
          }
        />

        {notices.length === 0 ? (
          <EmptyState icon={Bell} title="No notices yet" description="Announcements will appear here when they are posted" />
        ) : (
          <ol className="glass-panel divide-y divide-border overflow-hidden rounded-2xl">
            {notices.map((notice) => {
              const category = categoryConfig[notice.category];
              return (
                <li key={notice.id} className="grid gap-x-6 gap-y-2 px-6 py-5 md:grid-cols-[120px_minmax(0,1fr)_auto]">
                  <time dateTime={notice.created_at} className="stamp pt-1">{formatDate(notice.created_at)}</time>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-medium text-foreground">{notice.title}</h3>
                      <Badge variant={category.variant}>{category.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{notice.description}</p>
                    <p className="mt-2 text-xs text-subtle">Posted by {notice.posted_by}</p>
                  </div>
                  {notice.user_id === "current-user-id" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(notice.id)} aria-label="Delete notice">
                      <Trash2 aria-hidden="true" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {/* Post notice Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Post a notice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <Input
                  placeholder="Notice title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Category</label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value as any})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
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
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="Write the notice details"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-32"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Posted by</label>
                <Input
                  placeholder="Your name or department"
                  value={formData.posted_by}
                  onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
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
                  Post notice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Page>
    </MainLayout>
  );
}
