import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Star, ArrowLeft, Calendar, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Poem, Review } from "@shared/schema";
import { getLikeCount, incrementLike, getReviews, submitReview } from "@/lib/api";
import { setPageSEO } from "@/lib/seo";

export default function PoemPage() {
  const [, params] = useRoute("/poem/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();

  const { data: poems } = useQuery<Poem[]>({
    queryKey: ["/api/poems"],
  });

  const poem = poems?.find((p) => p.slug === slug);

  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linesVisible, setLinesVisible] = useState<boolean[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    comment: "",
  });

  useEffect(() => {
    if (poem) {
      setLinesVisible(new Array(poem.poem.length).fill(false));
      // Trigger line animations
      poem.poem.forEach((_, index) => {
        setTimeout(() => {
          setLinesVisible((prev) => {
            const newVisible = [...prev];
            newVisible[index] = true;
            return newVisible;
          });
        }, index * 100);
      });

      // Check if user has liked this poem
      const likedPoems = JSON.parse(localStorage.getItem("likedPoems") || "{}");
      setHasLiked(!!likedPoems[slug]);

      // Set page SEO
      setPageSEO(
        poem.title,
        poem.excerpt
      );
    }
  }, [poem, slug]);

  const handleLike = async () => {
    if (isLiking || hasLiked) return;

    setIsLiking(true);
    try {
      const newCount = await incrementLike(slug);
      
      // Save to localStorage to track that user has liked
      const likedPoems = JSON.parse(localStorage.getItem("likedPoems") || "{}");
      likedPoems[slug] = true;
      localStorage.setItem("likedPoems", JSON.stringify(likedPoems));

      setLikes(newCount);
      setHasLiked(true);

      toast({
        title: "Added to favorites!",
        description: "Thank you for your support.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not save your like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.comment || rating === 0) {
      toast({
        title: "Missing fields",
        description: "Please fill in your name, rating, and comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        post_slug: slug,
        name: formData.name,
        email: formData.email,
        rating,
        comment: formData.comment,
      };

      // Submit review to backend API which stores it and sends email notification
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to submit review");
      }

      const result = await response.json();
      
      // Also submit to Supabase/localStorage since that's where reviews are currently read from
      // This maintains backward compatibility with the existing review display system
      const newReview = await submitReview(reviewData);

      setReviews((prev) => [newReview, ...prev]);
      setFormData({ name: "", email: "", comment: "" });
      setRating(0);

      toast({
        title: "Review submitted!",
        description: "Thank you for sharing your thoughts.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Load reviews and likes from API (Supabase or localStorage)
    async function loadData() {
      try {
        const [reviewsData, likesCount] = await Promise.all([
          getReviews(slug),
          getLikeCount(slug)
        ]);
        setReviews(reviewsData);
        setLikes(likesCount);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    if (slug) {
      loadData();
    }
  }, [slug]);

  if (!poem) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Poem not found</h1>
          <Link href="/poems">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Poems
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <Link href="/poems">
          <Button variant="ghost" className="gap-2 mb-8 group" data-testid="button-back-to-poems">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Poems
          </Button>
        </Link>

        {/* Poem Header */}
        <div className="mb-12 text-center animate-fade-in">
          <h1
            className="text-4xl sm:text-5xl font-alice font-bold mb-4 bg-gradient-to-br from-foreground via-primary to-foreground bg-clip-text text-transparent"
            data-testid="text-poem-title"
          >
            {poem.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span data-testid="text-poem-date">
                {new Date(poem.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <Badge variant="secondary" data-testid="badge-poem-category">{poem.category}</Badge>
            </div>
          </div>
        </div>

        {/* Poem Content */}
        <Card className="mb-12 bg-card/50 backdrop-blur-sm border-2 hover:border-primary/20 transition-all duration-500 relative overflow-hidden group">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/10 group-hover:border-primary/30 transition-colors" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/10 group-hover:border-primary/30 transition-colors" />
          
          <CardContent className="p-8 sm:p-12 relative z-10">
            <div className="space-y-2 font-alice text-base sm:text-lg leading-loose">
              {poem.poem.map((line, index) => (
                <p
                  key={index}
                  className={`transition-all duration-700 hover:text-primary/80 ${
                    linesVisible[index]
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4"
                  }`}
                  data-testid={`text-poem-line-${index}`}
                >
                  {line || "\u00A0"}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Like Button */}
        <div className="flex justify-center mb-12">
          <Button
            size="lg"
            variant={hasLiked ? "default" : "outline"}
            onClick={handleLike}
            disabled={isLiking || hasLiked}
            className={`gap-2 min-w-[140px] transition-all duration-300 ${
              hasLiked ? "scale-110 shadow-lg" : "hover:scale-105"
            }`}
            data-testid="button-like-poem"
          >
            <Heart
              className={`h-5 w-5 transition-all ${
                hasLiked ? "fill-current animate-bounce" : ""
              }`}
            />
            {hasLiked ? "Liked" : "Like"} ({likes})
          </Button>
        </div>

        {/* Reviews Section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-display font-bold" data-testid="text-reviews-title">
            Reader Reflections
          </h2>

          {/* Submit Review Form */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-share-thoughts">Share Your Thoughts</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Star Rating */}
                <div>
                  <Label data-testid="label-rating">Your Rating</Label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-all duration-200 hover:scale-125 hover:rotate-12"
                        data-testid={`button-star-${star}`}
                      >
                        <Star
                          className={`h-8 w-8 transition-all duration-200 ${
                            star <= (hoveredRating || rating)
                              ? "fill-primary text-primary scale-110"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your name"
                      required
                      data-testid="input-review-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="your@email.com"
                      data-testid="input-review-email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">Your Thoughts *</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) =>
                      setFormData({ ...formData, comment: e.target.value })
                    }
                    placeholder="What did this poem mean to you?"
                    rows={4}
                    required
                    data-testid="textarea-review-comment"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  data-testid="button-submit-review"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Display Reviews */}
          {reviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold" data-testid="text-reviews-count">
                {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
              </h3>
              {reviews.map((review) => (
                <Card key={review.id} data-testid={`card-review-${review.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold" data-testid={`text-review-name-${review.id}`}>
                          {review.name}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground" data-testid={`text-review-date-${review.id}`}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2" data-testid={`text-review-comment-${review.id}`}>
                      {review.comment}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
