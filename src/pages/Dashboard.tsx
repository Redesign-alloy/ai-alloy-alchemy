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

      // Check for empty or non-ok responses before parsing
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const rawResponse = await response.text();
      if (!rawResponse) throw new Error("Empty response received from server");

      const resultData: APIResponse = JSON.parse(rawResponse);
      
      // Robustly handle stringified 'data' fields
      if (typeof resultData.data === 'string') {
        try {
          resultData.data = JSON.parse(resultData.data);
        } catch (e) {
          console.warn("Could not parse nested data string, keeping as is.");
        }
      }

      if (resultData.status === "success" || resultData.data) {
        setResult(resultData);
        setStatus("success");
      } else {
        throw new Error("Invalid response format received.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to connect to API",
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
      // Map metrics from the finalized backend structure
      const redesignedAlloy = result.data?.redesigned_alloy || result.data;
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
        description: "Redesign successfully saved to your history.",
      });
    } catch (error) {
      console.error("Save error:", error);
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
          <div className="text-center

