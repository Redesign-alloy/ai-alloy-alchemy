import { useState } from "react";
import { AlloyForm } from "@/components/AlloyForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ExampleSelector } from "@/components/ExampleSelector";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle, XCircle, Clock, History } from "lucide-react";
import { AlloyData } from "@/types/alloy";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";


type ProcessingStatus = "idle" | "processing" | "success" | "error";

interface APIResponse {
  status?: string;
  data?: any;
  search_count?: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createProject, isCreating, projectCount, refetch: refetchProjects } = useProjects();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      "https://tejanaidu8.app.n8n.cloud/webhook/redesign-alloy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const resultData: APIResponse = await response.json();
    
    // BACKEND SYNC: The backend now returns data.redesigned_alloy as a nested object
    if (resultData.status === "success" && resultData.data) {
      setResult(resultData);
      setStatus("success");
      
      // Refetch projects to sync any backend changes
      refetchProjects();
    } else {
      throw new Error("Invalid response format: 'data' or 'status' missing.");
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

    try {
      await createProject({
        alloy_name: currentInput.original_alloy.name || 'Unnamed Alloy',
        redesigned_data: {
          input: currentInput,
          result: result,
        },
      });

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
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-medium text-foreground">Analyzing alloy composition...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alloy Redesign</h1>
            <p className="text-muted-foreground mt-1">Optimize your alloy composition for better performance</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Project Count Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {projectCount} project{projectCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              {getStatusIcon()}
              <span className="text-sm font-medium capitalize">{status}</span>
            </div>
            {result && (
              <Button
                onClick={handleSaveProject}
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save to Project
              </Button>
            )}
          </div>
        </div>

        <ExampleSelector />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AlloyForm onSubmit={handleSubmit} isLoading={isLoading} />
          {result && <ResultsDisplay result={result} />}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
