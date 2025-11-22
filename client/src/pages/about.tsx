import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Heart, Pen, Users } from "lucide-react";
import { setPageSEO } from "@/lib/seo";

export default function About() {
  useEffect(() => {
    setPageSEO(
      "About the Poet",
      "Learn about the philosophy and approach behind these contemporary poems. Discover the story of a modern poet exploring the human experience through words."
    );
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl sm:text-5xl font-display font-bold mb-4"
            data-testid="text-about-title"
          >
            Lyrical Cruz
          </h1>
          <p className="text-xl text-muted-foreground italic font-serif">
            Words as windows to the soul
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
          <Card>
            <CardContent className="p-8 sm:p-12">
              <div className="space-y-6 leading-relaxed">
                <p data-testid="text-about-intro">
                  Poetry, for me, has always been a way of making sense of the
                  world—a method of capturing the fleeting, the ineffable, the
                  moments that slip through our fingers like water. Each poem is
                  an attempt to hold onto something true, something real, even as
                  it transforms in the telling.
                </p>

                <p>
                  I write in the quiet hours, when the world feels most honest.
                  When the masks we wear during the day have been set aside, and
                  we're left with the raw material of being human. My poems
                  explore love and loss, joy and sorrow, the ordinary and the
                  extraordinary—often finding that they're not so different after
                  all.
                </p>

                <p>
                  The act of writing is, for me, an act of listening. Listening
                  to the rhythm of rain on windows, to the cadence of
                  conversations overheard in coffee shops, to the silence between
                  words that often says more than the words themselves. I believe
                  poetry lives in these in-between spaces, in the pauses and
                  breaths that give meaning to what comes before and after.
                </p>

                <p>
                  My hope is that these verses resonate with you, that they might
                  articulate something you've felt but couldn't quite name, or
                  that they might offer a new lens through which to view your own
                  experience. Poetry, at its best, is a conversation—between the
                  writer and the reader, between the past and the present,
                  between what is and what could be.
                </p>

                <p className="italic border-l-4 border-primary pl-4 text-muted-foreground">
                  "We write to taste life twice, in the moment and in
                  retrospect." — Anaïs Nin
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Philosophy Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-8 text-center">
            Writing Philosophy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover-elevate transition-all">
              <CardContent className="p-6">
                <BookOpen className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Authenticity</h3>
                <p className="text-muted-foreground">
                  Every poem is rooted in genuine experience and emotion. I write
                  what I know, what I've felt, what I've witnessed—striving
                  always for truth over artifice.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all">
              <CardContent className="p-6">
                <Heart className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connection</h3>
                <p className="text-muted-foreground">
                  Poetry should build bridges between hearts. My goal is to
                  create work that speaks to shared human experiences, fostering
                  empathy and understanding.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all">
              <CardContent className="p-6">
                <Pen className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Craft</h3>
                <p className="text-muted-foreground">
                  While emotion drives the content, craft shapes the form. I
                  believe in the power of carefully chosen words, thoughtful
                  structure, and the music of language.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all">
              <CardContent className="p-6">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-muted-foreground">
                  Poetry is meant to be shared. I value the dialogue between
                  writer and reader, and I'm grateful for everyone who takes the
                  time to engage with these words.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">
              Let's Stay Connected
            </h2>
            <p className="text-muted-foreground mb-6">
              I'd love to hear your thoughts on the poems, or connect about
              poetry and writing in general.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/contact"
                className="inline-block"
                data-testid="link-contact-from-about"
              >
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2 transition-all">
                  Get in Touch
                </button>
              </a>
              <a
                href="/poems"
                className="inline-block"
                data-testid="link-poems-from-about"
              >
                <button className="px-6 py-2 border border-border rounded-md hover-elevate active-elevate-2 transition-all">
                  Explore Poems
                </button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
