import { AlloyResult } from "@/types/alloy";
import { CheckCircle2, Loader2, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResultsDisplayProps {
  result: AlloyResult | null;
  isLoading: boolean;
}

export const ResultsDisplay = ({ result, isLoading }: ResultsDisplayProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Analyzing alloy composition...</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{elapsedSeconds}s elapsed</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-2 p-8">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Ready to Analyze</h3>
          <p className="text-muted-foreground max-w-sm">
            Enter your alloy specifications and click "Redesign Alloy" to see optimized results
          </p>
        </div>
      </div>
    );
  }

  // Log the full response for debugging
  console.log("Full API Response:", result);

  // Extract final_output from various possible nested structures
  let finalOutput: any = null;

  // Try to find final_output in various locations
  if ((result as any).final_output) {
    finalOutput = (result as any).final_output;
  } else if ((result as any).value?.[0]?.final_output) {
    finalOutput = (result as any).value[0].final_output;
  } else if (Array.isArray(result) && result[0]?.final_output) {
    finalOutput = result[0].final_output;
  } else {
    // Check for weird keys like "object Object"
    const keys = Object.keys(result);
    for (const key of keys) {
      if ((result as any)[key]?.final_output) {
        finalOutput = (result as any)[key].final_output;
        break;
      }
    }
  }

  console.log("Extracted final_output:", finalOutput);

  if (!finalOutput || !finalOutput.redesigned_alloy) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-2 p-8">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No Results Available</h3>
          <p className="text-muted-foreground max-w-sm">
            Unable to parse the response. Check console for details.
          </p>
        </div>
      </div>
    );
  }

  const redesigned_alloy = finalOutput.redesigned_alloy;
  const analysis_summary = finalOutput.analysis_summary;

  // CRITICAL: Parse the stringified new_composition JSON
  let parsedComposition: { [key: string]: number | string } = {};
  if (redesigned_alloy.new_composition) {
    try {
      if (typeof redesigned_alloy.new_composition === 'string') {
        parsedComposition = JSON.parse(redesigned_alloy.new_composition);
        console.log("Parsed composition:", parsedComposition);
      } else {
        parsedComposition = redesigned_alloy.new_composition;
      }
    } catch (e) {
      console.error('Failed to parse new_composition:', e);
      console.log('Raw composition value:', redesigned_alloy.new_composition);
    }
  }

  // Extract desired_improvements (may be nested in estimated_cost_per_kgfinal_output)
  let desiredImprovements: any = null;
  if (redesigned_alloy.estimated_cost_per_kgfinal_output?.desired_improvements) {
    desiredImprovements = redesigned_alloy.estimated_cost_per_kgfinal_output.desired_improvements;
  } else if (finalOutput.desired_improvements) {
    desiredImprovements = finalOutput.desired_improvements;
  } else if (redesigned_alloy.desired_improvements) {
    desiredImprovements = redesigned_alloy.desired_improvements;
  }

  console.log("Desired improvements:", desiredImprovements);

  return (
    <div className="space-y-6">
      {/* Section 1: Main Header - Alloy Name */}
      {redesigned_alloy.name && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-2xl font-bold text-foreground">
              {redesigned_alloy.name}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Section 2: New Composition - Parsed from String */}
      {Object.keys(parsedComposition).length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg">New Composition (%)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {Object.entries(parsedComposition).map(([element, value]) => (
                <div key={element} className="flex gap-2">
                  <div className="w-1/3 px-3 py-2 rounded-md border border-input bg-background text-sm font-medium text-foreground">
                    {element}
                  </div>
                  <div className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Predicted Properties - 2 Column Grid */}
      {redesigned_alloy.predicted_properties && Object.keys(redesigned_alloy.predicted_properties).length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg">Predicted Properties</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(redesigned_alloy.predicted_properties).map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg border border-border bg-card shadow-sm">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Scores & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Probability of Success */}
        {redesigned_alloy.probability_of_success !== undefined && (
          <Card className="shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary mb-2">
                  {(parseFloat(String(redesigned_alloy.probability_of_success)) * 100).toFixed(0)}%
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Success Probability
                </div>
              </div>
              <Progress value={parseFloat(String(redesigned_alloy.probability_of_success)) * 100} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Sustainability Score */}
        {redesigned_alloy.sustainability_score !== undefined && (
          <Card className="shadow-sm bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-success mb-2">
                  {(parseFloat(String(redesigned_alloy.sustainability_score)) * 100).toFixed(0)}%
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sustainability Score
                </div>
              </div>
              <Progress value={parseFloat(String(redesigned_alloy.sustainability_score)) * 100} className="h-2" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desired Improvements (if found) */}
      {desiredImprovements && Object.keys(desiredImprovements).length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg">Desired Improvements</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {Object.entries(desiredImprovements).map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg border border-border bg-secondary/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Executive Summary - Analysis */}
      {analysis_summary && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Performance Gain Badge */}
              {analysis_summary.performance_gain_percent !== undefined && (
                <div className="p-6 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20 text-center">
                  <div className="text-4xl font-bold text-success mb-2">
                    +{analysis_summary.performance_gain_percent}%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Performance Gain
                  </div>
                </div>
              )}

              {/* Cost Change Badge */}
              {analysis_summary.cost_change_percent !== undefined && (
                <div className={`p-6 rounded-lg border text-center ${
                  Number(analysis_summary.cost_change_percent) > 0
                    ? 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20'
                    : 'bg-gradient-to-br from-success/10 to-success/5 border-success/20'
                }`}>
                  <div className={`text-4xl font-bold mb-2 ${
                    Number(analysis_summary.cost_change_percent) > 0 ? 'text-warning' : 'text-success'
                  }`}>
                    {Number(analysis_summary.cost_change_percent) > 0 ? '+' : ''}{analysis_summary.cost_change_percent}%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Cost Change
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            {analysis_summary.remarks && (
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Metallurgical Analysis
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {analysis_summary.remarks}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estimated Cost per Kg */}
      {desiredImprovements && Object.entries(desiredImprovements).some(([key]) => key.includes('cost')) && (
        <Card className="shadow-sm bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-accent mb-2">
              ₹{String(Object.entries(desiredImprovements).find(([key]) => key.includes('cost'))?.[1] || '')}
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Estimated Cost per Kg
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
