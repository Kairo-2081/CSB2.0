import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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

const mockFaculty: Suggestion[] = [];

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
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Faculty Suggestions</h1>
            <p className="text-muted-foreground mt-1">Provide constructive feedback to faculty members</p>
          </div>
          <Button variant="glow" className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Suggestion
          </Button>
        </div>

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Faculty Suggestion</DialogTitle>
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Search & Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card variant="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-foreground">Total Suggestions</p>
                <p className="text-2xl font-bold text-primary">{filteredSuggestions.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Suggestions
              <Badge variant="secondary">{filteredSuggestions.length}</Badge>
            </h2>

            {filteredSuggestions.length === 0 ? (
              <Card variant="glass" className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No suggestions yet</h3>
                <p className="text-muted-foreground mt-1">Be the first to add a suggestion!</p>
              </Card>
            ) : (
              filteredSuggestions.map((suggestion, index) => (
                <Card 
                  key={suggestion.id} 
                  variant="interactive"
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground">{suggestion.title}</h3>
                          <p className="text-sm font-medium text-primary">{suggestion.faculty_name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.feedback}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: suggestion.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                            ))}
                          </div>
                          {suggestion.user_id === "current-user-id" && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(suggestion.id)}
                              className="ml-auto h-6 px-2 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
