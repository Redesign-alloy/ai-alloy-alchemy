import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, FileText, MessageSquare, Book, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const helpArticles = [
  {
    title: "Getting Started",
    description: "Learn the basics of alloy redesign with our AI platform",
    icon: Book,
    href: "#",
  },
  {
    title: "API Documentation",
    description: "Integrate our platform with your existing systems",
    icon: FileText,
    href: "#",
  },
  {
    title: "Composition Guidelines",
    description: "Best practices for inputting alloy compositions",
    icon: FileText,
    href: "#",
  },
  {
    title: "Interpreting Results",
    description: "Understanding your alloy analysis reports",
    icon: MessageSquare,
    href: "#",
  },
];

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and description.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user?.id,
        subject,
        description,
      });

      if (error) throw error;

      setSubmitted(true);
      setSubject("");
      setDescription("");

      toast({
        title: "Ticket Submitted",
        description: "We'll get back to you within 24 hours.",
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Support Center</h1>
          <p className="text-muted-foreground mt-1">
            Find answers or get help from our team
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Help Articles */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Help Articles</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {helpArticles.map((article) => (
                <Card key={article.title} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <article.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">{article.title}</h3>
                        <p className="text-sm text-muted-foreground">{article.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="#" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="w-4 h-4" />
                  View Full Documentation
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="w-4 h-4" />
                  API Reference
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="w-4 h-4" />
                  Community Forum
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Submit Ticket */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Submit a Ticket
                </CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Send us a message.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="p-3 bg-success/10 rounded-full mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Ticket Submitted!</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      We've received your request and will respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Please provide details about your question or issue..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Ticket"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Need urgent help?</p>
                    <p className="text-sm text-muted-foreground">
                      Email us at support@aialloy.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Support;
