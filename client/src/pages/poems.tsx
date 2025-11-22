import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Heart } from "lucide-react";
import { Poem, POEM_CATEGORIES } from "@shared/schema";
import { setPageSEO } from "@/lib/seo";

export default function Poems() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const categoryParam = searchParams.get("category") || "All";
  
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: poems, isLoading } = useQuery<Poem[]>({
    queryKey: ["/api/poems"],
  });

  useEffect(() => {
    setPageSEO(
      "Poetry Collection",
      "Explore our complete collection of contemporary poetry. Search and filter by theme, category, or keyword."
    );
  }, []);

  const filteredPoems = useMemo(() => {
    if (!poems) return [];

    let filtered = poems;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((poem) => poem.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (poem) =>
          poem.title.toLowerCase().includes(query) ||
          poem.excerpt.toLowerCase().includes(query) ||
          poem.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [poems, selectedCategory, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category !== "All") {
      setLocation(`/poems?category=${category}`);
    } else {
      setLocation("/poems");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl sm:text-5xl font-display font-bold mb-4"
            data-testid="text-poems-title"
          >
            Poetry Collection
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-poems-subtitle">
            {filteredPoems.length} {filteredPoems.length === 1 ? "poem" : "poems"} {searchQuery ? "found" : "available"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search poems by title, excerpt, or theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
              data-testid="input-search-poems"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {POEM_CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm hover-elevate active-elevate-2 transition-all"
                onClick={() => handleCategoryChange(category)}
                data-testid={`badge-filter-${category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Poems Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-64 animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-20 mb-2" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                    <div className="h-3 bg-muted rounded w-4/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPoems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No poems found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPoems.map((poem) => (
              <Link key={poem.slug} href={`/poem/${poem.slug}`}>
                <Card
                  className="h-full hover-elevate active-elevate-2 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                  data-testid={`card-poem-${poem.slug}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary" data-testid={`badge-category-${poem.slug}`}>
                        {poem.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-testid={`text-date-${poem.slug}`}>
                        {new Date(poem.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-alice group-hover:text-primary transition-colors" data-testid={`text-title-${poem.slug}`}>
                      {poem.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground font-alice text-sm leading-relaxed line-clamp-4" data-testid={`text-excerpt-${poem.slug}`}>
                      {poem.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
