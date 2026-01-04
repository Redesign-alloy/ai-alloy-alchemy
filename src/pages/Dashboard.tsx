import { useState } from "react";
import { AlloyForm } from "@/components/AlloyForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ExampleSelector } from "@/components/ExampleSelector";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { AlloyData, AlloyResult } from "@/types/alloy";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type ProcessingStatus = "idle" | "processing" | "success" | "error";

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [result, setResult] = useState<AlloyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentInput, setCurrentInput] = useState<AlloyData | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");

  const handleSubmit = async (data: AlloyData) => {
    setIsLoading(true);
    setResult(null);
    setCurrentInput(data);
    setStatus("processing");

   // REPLACE LINES 33-41 WITH THIS:
try {
    // Construct the payload to include User ID and Email
    const payload = {
        ...data,             // This spreads all your existing alloy input data
        user_id: user?.id,    // Adds the Supabase User ID
        email: user?.email    // Adds the User Email
    };

    const response = await fetch(
        "https://tejanaidu5.app.n8n.cloud/webhook/redesign-alloy",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // Send the new payload instead of just 'data'
        }
    );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const resultData = await response.json();
      setResult(resultData);
      setStatus("success");
    } catch (error) {
      console.error("Error submitting alloy data:", error);
      setStatus("error");
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

  const handleSaveProject = async () => {
    if (!result || !currentInput || !user) {
      toast({
        title: "Cannot Save",
        description: "Please complete an analysis first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const performanceGain = result.analysis_summary?.performance_gain_percent || 0;
      const costDelta = result.analysis_summary?.cost_change_percent || 0;

      const { error } = await supabase.from("projects").insert([{
        user_id: user.id,
        name: `${currentInput.original_alloy.name} Redesign`,
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
        description: "Your analysis has been saved to Project History.",
      });
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "processing":
        return "AI is analyzing your alloy...";
      case "success":
        return "Analysis complete";
      case "error":
        return "Analysis failed";
      default:
        return "Ready for analysis";
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alloy Redesign Workspace</h1>
            <p className="text-muted-foreground mt-1">
              Input parameters and optimize your alloy composition with AI
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              {getStatusIcon()}
              <span className="text-sm font-medium text-muted-foreground">
                {getStatusText()}
              </span>
            </div>
            {/* Save Button */}
            <Button
              onClick={handleSaveProject}
              disabled={!result || isSaving}
              variant="outline"
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save to Project
            </Button>
          </div>
        </div>

        {/* Example Selector */}
        <ExampleSelector />

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <AlloyForm onSubmit={handleSubmit} isLoading={isLoading} />
          <ResultsDisplay result={result} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
