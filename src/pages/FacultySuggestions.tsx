import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Page, PageHeader, Toolbar } from "@/components/layout/Page";
import { EmptyState } from "@/components/layout/EmptyState";
import { FilterGroup } from "@/components/layout/FilterGroup";
import { SearchField } from "@/components/layout/SearchField";
import { formatCount, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  User,
  MessageSquare,
  Clock,
  Star,
  Trash2
} from "lucide-react";
import { facultySuggestionService } from "@/services/database.service";

interface Suggestion {
  id: string;
  title: string;
  feedback: string;
  faculty_name: string;
  rating: number;
  user_id: string;
  created_at: string;
}


export default function FacultySuggestions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    faculty_name: "",
    subject: "",
    rating: 5,
    posted_by: "",
  });

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await facultySuggestionService.getSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      toast.error("Failed to load suggestions");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.faculty_name || !formData.posted_by) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await facultySuggestionService.createSuggestion({
        title: formData.title,
        faculty_name: formData.faculty_name,
        rating: parseInt(formData.rating.toString()),
        feedback: formData.description,
        user_id: "current-user-id",
      });
      toast.success("Suggestion submitted");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        faculty_name: "",
        subject: "",
        rating: 5,
        posted_by: "",
      });
      await loadSuggestions();
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error("Failed to submit suggestion");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.feedback.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this suggestion?")) {
      try {
        await facultySuggestionService.deleteSuggestion(id);
        toast.success("Suggestion deleted");
        await loadSuggestions();
      } catch (error) {
        console.error("Error deleting suggestion:", error);
        toast.error("Failed to delete suggestion");
      }
    }
  };

  return (
    <MainLayout>
      <Page>
        <PageHeader
          title="Faculty suggestions"
          description="Constructive, rated feedback for faculty members, shared with the department"
          meta={formatCount(suggestions.length, "suggestion")}
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Add suggestion
            </Button>
          }
        />

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add a suggestion</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="faculty">Faculty name</Label>
                  <Input
                    id="faculty"
                    value={formData.faculty_name}
                    onChange={(e) => setFormData({...formData, faculty_name: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject || ""}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    disabled={isLoading}
                    placeholder="Teaching quality"
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Select 
                    value={formData.rating?.toString() || "5"}
                    onValueChange={(value) => setFormData({...formData, rating: parseInt(value)})}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 · Poor</SelectItem>
                      <SelectItem value="2">2 · Fair</SelectItem>
                      <SelectItem value="3">3 · Good</SelectItem>
                      <SelectItem value="4">4 · Very good</SelectItem>
                      <SelectItem value="5">5 · Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Feedback</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isLoading}
                  rows={4}
                  placeholder="Share your constructive feedback"
                />
              </div>
              <div>
                <Label htmlFor="posted_by">Your name</Label>
                <Input
                  id="posted_by"
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit suggestion"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Toolbar>
          <SearchField label="Search suggestions" value={searchQuery} onChange={setSearchQuery} />
          <p className="stamp lg:ml-auto">{filteredSuggestions.length} shown</p>
        </Toolbar>

        {filteredSuggestions.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No suggestions yet" description="Suggestions appear here once someone adds one" />
        ) : (
          <ul className="glass-panel divide-y divide-border overflow-hidden rounded-2xl">
            {filteredSuggestions.map((suggestion) => (
              <li key={suggestion.id} className="grid gap-x-6 gap-y-3 px-6 py-5 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{suggestion.faculty_name}</p>
                  <div className="mt-2 flex items-center gap-0.5" aria-label={`Rated ${suggestion.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < suggestion.rating ? "fill-current text-foreground" : "text-subtle/60"}`} aria-hidden="true" />
                    ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-foreground">{suggestion.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{suggestion.feedback}</p>
                  <time dateTime={suggestion.created_at} className="stamp mt-3 block">{formatDate(suggestion.created_at)}</time>
                </div>
                {suggestion.user_id === "current-user-id" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(suggestion.id)} aria-label="Delete suggestion">
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Page>
    </MainLayout>
  );
}
