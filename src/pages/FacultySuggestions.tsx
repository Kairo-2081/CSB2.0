import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState, FilterBar, RowList } from "@/components/editorial";
import { shortDate } from "@/lib/dates";
import { PageHeader } from "@/components/layout/PageHeader";
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
        subject: formData.subject,
        rating: parseInt(formData.rating.toString()),
        feedback: formData.description,
        posted_by: formData.posted_by,
        user_id: "current-user-id",
      });
      toast.success("Suggestion submitted successfully!");
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
    if (window.confirm("Are you sure you want to delete this suggestion?")) {
      try {
        await facultySuggestionService.deleteSuggestion(id);
        toast.success("Suggestion deleted successfully!");
        await loadSuggestions();
      } catch (error) {
        console.error("Error deleting suggestion:", error);
        toast.error("Failed to delete suggestion");
      }
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-studio.webp", alt: "An architecture drafting studio at BUET with model-strewn tables" }}
          eyebrow="Teaching"
          title="Faculty suggestions."
          accent="Help teaching improve."
          description="Constructive feedback on courses and teaching, sent to the department."
          actions={
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Make a suggestion
              </Button>
            </>
          }
        />

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make a suggestion.</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
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
                  <Label htmlFor="faculty">Faculty Name</Label>
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
                    placeholder="e.g., Teaching Quality"
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
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
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
                  placeholder="Share your constructive feedback..."
                />
              </div>
              <div>
                <Label htmlFor="posted_by">Your Name</Label>
                <Input
                  id="posted_by"
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <section aria-label="Suggestions">
          <FilterBar
            label="Suggestions"
            tabs={[{ value: "all", label: "All", count: filteredSuggestions.length }]}
            value="all"
            onChange={() => undefined}
            search={searchQuery}
            onSearch={setSearchQuery}
            searchLabel="Search suggestions"
          />
          {filteredSuggestions.length > 0 ? (
            <RowList label="Suggestions">
              {filteredSuggestions.map((suggestion) => (
                <li key={suggestion.id} className="grid gap-4 py-8 md:grid-cols-[180px_minmax(0,1fr)_140px] md:gap-8">
                  <div>
                    <p className="font-display text-2xl leading-tight">{suggestion.faculty_name}</p>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Rated {suggestion.rating} of 5
                    </p>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-normal leading-[1.25]">{suggestion.title}</h3>
                    <p className="mt-2 max-w-2xl text-[15px] leading-[26px] text-muted-foreground">{suggestion.feedback}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground md:flex-col md:items-end">
                    <span>{shortDate(suggestion.created_at)}</span>
                    {suggestion.user_id === "current-user-id" && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(suggestion.id)} className="text-destructive hover:text-destructive">
                        <Trash2 aria-hidden="true" /> Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </RowList>
          ) : (
            <EmptyState
              title={suggestions.length === 0 ? "No suggestions yet." : "Nothing matches."}
              text={suggestions.length === 0 ? "Constructive feedback on a course or its teaching goes here." : "Try a different search."}
              action={suggestions.length === 0 ? <Button onClick={() => setIsDialogOpen(true)}><Plus aria-hidden="true" /> Make the first suggestion</Button> : undefined}
            />
          )}
        </section>
      </div>
    </MainLayout>
  );
}
