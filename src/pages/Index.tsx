import { useState } from "react";
import { AlloyForm } from "@/components/AlloyForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ExampleSelector } from "@/components/ExampleSelector";
import { Atom } from "lucide-react";
import { AlloyData, AlloyResult } from "@/types/alloy";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [result, setResult] = useState<AlloyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: AlloyData) => {
    setIsLoading(true);
    setResult(null); // Clear previous results
    try {
      const response = await fetch(
        "https://lefasif598.app.n8n.cloud/webhook/1f19fb01-07b0-4178-8206-c87e56a355a1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const resultData = await response.json();
      
      // Accept any response format from webhook
      setResult(resultData);
    } catch (error) {
      console.error("Error submitting alloy data:", error);
      // Show error toast to user
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to API";
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl shadow-lg">
              <Atom className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Alloy Redesigner
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Advanced metallurgical engineering powered by artificial intelligence. 
            Optimize steel alloy compositions for enhanced performance and sustainability.
          </p>
        </header>

        {/* Example Selector */}
        <ExampleSelector />

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <AlloyForm onSubmit={handleSubmit} isLoading={isLoading} />
          <ResultsDisplay result={result} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
