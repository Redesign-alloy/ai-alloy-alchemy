import { useState } from "react";
import { AlloyForm } from "@/components/AlloyForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ExampleSelector } from "@/components/ExampleSelector";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { AlloyData } from "@/types/alloy";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type ProcessingStatus = "idle" | "processing" | "success" | "error";

interface APIResponse {
  status?: string;
  data?: any;
  search_count?: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentInput, setCurrentInput] = useState<AlloyData | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");

  const handleSubmit = async (data: AlloyData) => {
    setIsLoading(true);
    setResult(null);
    setCurrentInput(data);
    setStatus("processing");

    try {
      const payload = {
        ...data,
        user_id: user?.id,
        email: user?.email
      };

      const response = await fetch(
        "https://tejanaidu5.app.n8n.cloud/webhook/redesign-alloy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const rawData = await response.json();
      console.log("Backend Raw Data:", rawData);

      // --- ROBUST DATA PARSING ---
      // This handles cases where n8n might send redesign_results as a string or nested object
      let processedData = rawData;
      if (typeof rawData.data === 'string') {
        try {
          processedData.data = JSON.parse(rawData.data);
        } catch (e) {
          console.error("Failed to parse nested data string", e);
        }
      }

      if (processedData.status === "success" || processedData.data) {
        setResult(processedData);
        setStatus("success");
        toast({
          title: "Analysis Complete",
          description: `Alloy redesigned successfully. (Search #${processedData.search_count || 'N/A'})`,
        });
      } else {
        throw new Error("The AI failed to generate a valid redesign. Please check your inputs.");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setStatus("error");
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Connection error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!result || !currentInput || !user) return;
    setIsSaving(true);

    try {
      // Map data from the finalized n8n structure
      const redesign = result.data?.redesigned_alloy || result.data;
      const summary = result.data?.analysis_summary || result.data?.summary;
      
      const performanceGain = summary?.performance_gain_percent || 0;
      const costDelta = summary?.cost_change_percent || 0;

      const { error } = await supabase.from("projects").insert([{
        user_id: user.id,
        name: `${currentInput.original_alloy.name} Optimized`,
        base_alloy: currentInput.original_alloy.name,
        input_data: currentInput as unknown as Json,
        result_data: result as unknown as Json,
        performance_gain: performanceGain,
        cost_delta: costDelta,
        status: "completed",
      }]);

      if (error) throw error;

      toast({
        title: "Project Saved",
        description: "View this redesign anytime in Project History.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "processing": return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
          <div className="text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <Loader2 className="w-24 h-24 text-primary animate-spin opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Optimizing Composition</h3>
              <p className="text-muted-foreground">AI is running metallurgical simulations...</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Alloy Redesign Workspace</h1>
            <p className="text-muted-foreground mt-2">Professional AI-assisted metallurgical engineering</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border shadow-sm">
              {getStatusIcon()}
              <span className="text-sm font-semibold uppercase tracking-wider">
                {status === "processing" ? "Analyzing..." : status}
              </span>
            </div>
            <Button
              onClick={handleSaveProject}
              disabled={!result || isSaving}
              className="shadow-lg hover:shadow-primary/20 transition-all gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Project
            </Button>
          </div>
        </div>

        <ExampleSelector />

        <div className="grid lg:grid-cols-2 gap-8 mt-12 items-start">
          <div className="sticky top-24">
            <AlloyForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
          <div>
            <ResultsDisplay result={result} isLoading={isLoading} inputData={currentInput} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
