import { AlloyResult } from "@/types/alloy";
import { CheckCircle2, Loader2, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="shadow-lg border-border/50">
        <CardContent className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Analyzing alloy composition...</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{elapsedSeconds}s elapsed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardContent className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-2 p-8">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Ready to Analyze</h3>
            <p className="text-muted-foreground max-w-sm">
              Enter your alloy specifications and click "Redesign Alloy" to see optimized results
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract data from nested webhook response
  let finalOutput: any = null;
  
  // Handle different response structures
  if (result.value && Array.isArray(result.value) && result.value[0]?.final_output) {
    finalOutput = result.value[0].final_output;
  } else if (result.final_output) {
    finalOutput = result.final_output;
  } else if (result.redesigned_alloy) {
    // Direct structure
    finalOutput = {
      redesigned_alloy: result.redesigned_alloy,
      analysis_summary: result.analysis_summary
    };
  }
  
  if (!finalOutput || !finalOutput.redesigned_alloy) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Webhook Response
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-[600px]">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  const redesignedAlloy = finalOutput.redesigned_alloy;
  const analysisSummary = finalOutput.analysis_summary;
  
  // Parse new_composition if it's a stringified JSON
  let parsedComposition: Record<string, number> = {};
  try {
    if (typeof redesignedAlloy.new_composition === 'string') {
      parsedComposition = JSON.parse(redesignedAlloy.new_composition);
    } else {
      parsedComposition = redesignedAlloy.new_composition;
    }
  } catch (e) {
    console.error('Failed to parse composition:', e);
    parsedComposition = redesignedAlloy.new_composition || {};
  }

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Redesign Results
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Main Header - Alloy Name */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-border px-6 py-5">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Redesigned Alloy:</span>
          <h2 className="text-3xl font-bold text-primary mt-2">{redesignedAlloy.name}</h2>
        </div>

        {/* New Composition Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">New Composition (%)</h3>
          <div className="space-y-2">
            {Object.entries(parsedComposition).map(([element, value]) => (
              <div key={element} className="flex gap-2 items-center">
                <div className="w-1/3 px-3 py-2 bg-secondary/30 rounded-md border border-border">
                  <span className="text-sm font-medium text-foreground">{element}</span>
                </div>
                <div className="flex-1 px-3 py-2 bg-secondary/30 rounded-md border border-border">
                  <span className="text-sm text-muted-foreground">
                    {typeof value === 'number' ? value.toFixed(2) : value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predicted Properties - 2 Column Grid */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Predicted Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(redesignedAlloy.predicted_properties || {}).map(([key, value]) => (
              <div key={key} className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-lg border border-border p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Summary - Performance & Cost Badges */}
        {analysisSummary && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Analysis Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {analysisSummary.performance_gain_percent !== undefined && (
                <div className="bg-gradient-to-br from-success/20 to-success/10 rounded-lg border border-success/30 p-4 text-center">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Performance Gain
                  </div>
                  <div className="text-3xl font-bold text-success">
                    +{analysisSummary.performance_gain_percent}%
                  </div>
                </div>
              )}
              {analysisSummary.cost_change_percent !== undefined && (
                <div className={`rounded-lg border p-4 text-center ${
                  analysisSummary.cost_change_percent > 0 
                    ? 'bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30' 
                    : 'bg-gradient-to-br from-success/20 to-success/10 border-success/30'
                }`}>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Cost Change
                  </div>
                  <div className={`text-3xl font-bold ${
                    analysisSummary.cost_change_percent > 0 ? 'text-destructive' : 'text-success'
                  }`}>
                    {analysisSummary.cost_change_percent > 0 ? '+' : ''}{analysisSummary.cost_change_percent}%
                  </div>
                </div>
              )}
            </div>

            {/* Remarks Section */}
            {analysisSummary.remarks && (
              <div className="bg-muted/30 rounded-lg border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">{analysisSummary.remarks}</p>
              </div>
            )}
          </div>
        )}

        {/* Additional Metrics */}
        {(redesignedAlloy.probability_of_success !== undefined || redesignedAlloy.sustainability_score !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {redesignedAlloy.probability_of_success !== undefined && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-4 text-center">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Probability of Success
                </div>
                <div className="text-3xl font-bold text-primary">
                  {(redesignedAlloy.probability_of_success * 100).toFixed(0)}%
                </div>
              </div>
            )}
            {redesignedAlloy.sustainability_score !== undefined && (
              <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 p-4 text-center">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Sustainability Score
                </div>
                <div className="text-3xl font-bold text-accent">
                  {redesignedAlloy.sustainability_score.toFixed(2)} / 1.0
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
