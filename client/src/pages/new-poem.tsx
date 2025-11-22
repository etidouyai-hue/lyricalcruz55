import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Feather, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/api";
import { POEM_CATEGORIES } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function NewPoem() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [poemText, setPoemText] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await getSession();
      if (!session) {
        toast({
          title: "Unauthorized",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        setLocation("/admin");
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setLocation("/admin");
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !category || !excerpt || !poemText) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get the Supabase session token
      const session = await getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create poems",
          variant: "destructive",
        });
        setLocation("/admin");
        return;
      }

      const poemLines = poemText.split('\n');
      
      const poemData = {
        title,
        category,
        excerpt,
        poem: poemLines,
      };

      // Get access token from session (if available)
      const accessToken = 'access_token' in session ? session.access_token : 'local-admin-token';
      
      const response = await fetch("/api/poems", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(poemData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save poem");
      }

      // Invalidate the poems cache so the new poem appears immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/poems"] });

      toast({
        title: "Success!",
        description: "Your poem has been published",
      });

      setLocation("/poems");
    } catch (error: any) {
      console.error("Error saving poem:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save poem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin")}
          className="mb-6"
          data-testid="button-back-to-admin"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Feather className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create New Poem</CardTitle>
                <CardDescription>
                  Write and publish your latest poetry
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter poem title"
                  required
                  data-testid="input-poem-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger data-testid="select-poem-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {POEM_CATEGORIES.filter(c => c !== "All").map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A brief, compelling line from your poem"
                  required
                  data-testid="input-poem-excerpt"
                />
                <p className="text-sm text-muted-foreground">
                  This will appear in poem listings and previews
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poem">Poem</Label>
                <Textarea
                  id="poem"
                  value={poemText}
                  onChange={(e) => setPoemText(e.target.value)}
                  placeholder="Write your poem here... (each line will be preserved as you type)"
                  rows={15}
                  className="font-mono"
                  required
                  data-testid="textarea-poem-content"
                />
                <p className="text-sm text-muted-foreground">
                  Line breaks will be preserved. Blank lines create stanza breaks.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin")}
                  disabled={isSaving}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  data-testid="button-publish-poem"
                >
                  {isSaving ? "Publishing..." : "Publish Poem"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
