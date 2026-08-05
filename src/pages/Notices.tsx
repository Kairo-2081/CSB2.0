import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
  general: { label: "General", variant: "secondary" as const },
  academic: { label: "Academic", variant: "info" as const },
  event: { label: "Event", variant: "success" as const },
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
      toast.success("Notice posted successfully!");
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
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await noticeService.deleteNotice(id);
        toast.success("Notice deleted successfully!");
        await loadNotices();
      } catch (error) {
        console.error("Error deleting notice:", error);
        toast.error("Failed to delete notice");
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notices</h1>
            <p className="text-muted-foreground mt-1">Official announcements and updates</p>
          </div>
          <Button 
            variant="glow" 
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Post Notice
          </Button>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {notices.map((notice, index) => {
            const category = categoryConfig[notice.category];
            
            return (
              <Card 
                key={notice.id} 
                variant="interactive"
                className="animate-slide-up group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{notice.title}</h3>
                        <Badge variant={category.variant}>{category.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notice.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {notice.posted_by}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(notice.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      {notice.user_id === "current-user-id" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(notice.id)}
                          className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {notices.length === 0 && (
          <Card variant="glass" className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No notices yet</h3>
            <p className="text-muted-foreground mt-1">Check back later for announcements</p>
          </Card>
        )}

        {/* Post Notice Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Post New Notice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  placeholder="Notice title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
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
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Textarea
                  placeholder="Write the notice details..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Posted By</label>
                <Input
                  placeholder="Your name or department"
                  value={formData.posted_by}
                  onChange={(e) => setFormData({...formData, posted_by: e.target.value})}
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
