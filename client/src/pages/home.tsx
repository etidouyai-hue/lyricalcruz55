import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, BookOpen } from "lucide-react";
import { Poem, POEM_CATEGORIES } from "@shared/schema";
import { setPageSEO } from "@/lib/seo";
import { useInView } from "@/hooks/use-in-view";

export default function Home() {
  const { data: poems } = useQuery<Poem[]>({
    queryKey: ["/api/poems"],
  });

  const [fadeIn, setFadeIn] = useState(false);
  const { ref: featuredRef, isInView: featuredInView } = useInView({ threshold: 0.1 });
  const { ref: categoriesRef, isInView: categoriesInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    setFadeIn(true);
    setPageSEO(
      "Home",
      "A curated collection of contemporary poetry exploring love, life, nature, and the human experience."
    );
  }, []);

  const featuredPoems = poems?.slice(0, 3) || [];
  const categories = POEM_CATEGORIES.filter((cat) => cat !== "All");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <section
        className={`pt-32 pb-20 px-4 transition-all duration-1000 relative ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Floating Quote Marks */}
        <div className="absolute left-10 top-40 text-9xl font-serif text-primary/5 pointer-events-none select-none animate-float hidden lg:block">"</div>
        <div className="absolute right-10 bottom-20 text-9xl font-serif text-primary/5 pointer-events-none select-none animate-float-delayed hidden lg:block">"</div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold mb-6 tracking-tight bg-gradient-to-br from-foreground via-primary to-muted-foreground bg-clip-text text-transparent animate-gradient-shift"
            data-testid="text-hero-title"
          >
            Verses & Reflections
          </h1>
          <p
            className="text-xl sm:text-2xl text-muted-foreground mb-8 leading-relaxed font-serif italic"
            data-testid="text-hero-subtitle"
          >
            Where words become worlds, and silence speaks volumes
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/poems">
              <Button size="lg" className="gap-2 group" data-testid="button-explore-poems">
                <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                Explore Poems
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="gap-2 group" data-testid="button-about">
                About the Poet
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Poems */}
      <section ref={featuredRef} className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-display font-bold mb-12 text-center"
            data-testid="text-featured-title"
          >
            Featured Poems
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPoems.map((poem, index) => (
              <Link key={poem.slug} href={`/poem/${poem.slug}`}>
                <Card
                  className="h-full hover-elevate active-elevate-2 transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden group relative border-2 border-transparent hover:border-primary/20"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animation: featuredInView ? "fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
                    opacity: featuredInView ? 1 : 0,
                    transformStyle: "preserve-3d",
                  }}
                  data-testid={`card-poem-${poem.slug}`}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary" className="group-hover:scale-110 transition-transform" data-testid={`badge-category-${poem.slug}`}>
                        {poem.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-testid={`text-date-${poem.slug}`}>
                        {new Date(poem.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-alice group-hover:text-primary transition-all duration-300 group-hover:tracking-wide" data-testid={`text-title-${poem.slug}`}>
                      {poem.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-muted-foreground font-alice text-sm leading-relaxed line-clamp-3" data-testid={`text-excerpt-${poem.slug}`}>
                      {poem.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section ref={categoriesRef} className="py-16 px-4">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
          categoriesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <h2
            className="text-3xl sm:text-4xl font-display font-bold mb-8"
            data-testid="text-categories-title"
          >
            Explore by Theme
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <Link key={category} href={`/poems?category=${category}`}>
                <Badge
                  variant="outline"
                  className="text-base px-6 py-2 hover-elevate active-elevate-2 cursor-pointer transition-all"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: categoriesInView ? "fadeInUp 0.6s ease-out forwards" : "none",
                    opacity: categoriesInView ? 1 : 0,
                  }}
                  data-testid={`badge-category-filter-${category.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {category}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
            About the Collection
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Each poem is a window into the human experience—an exploration of
            love, loss, wonder, and the quiet moments that shape our lives.
            Through carefully crafted verses, we journey together through the
            landscape of emotion and meaning.
          </p>
          <Link href="/about">
            <Button variant="outline" size="lg" className="gap-2" data-testid="button-read-more">
              Read More About Me
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card border border-card-border rounded-lg p-8 sm:p-12 hover-elevate transition-all">
            <Heart className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
              Let's Connect
            </h2>
            <p className="text-muted-foreground mb-6">
              Have thoughts to share? I'd love to hear from you.
            </p>
            <Link href="/contact">
              <Button size="lg" data-testid="button-get-in-touch">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
