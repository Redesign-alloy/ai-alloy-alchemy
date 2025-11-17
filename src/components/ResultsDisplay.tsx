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

  // Try to extract data from different response formats
  let redesigned_alloy = result.redesigned_alloy;
  let analysis_summary = result.analysis_summary;
  
  // Handle array responses with final_output
  if (Array.isArray(result) && result[0]?.final_output) {
    redesigned_alloy = result[0].final_output.redesigned_alloy;
    analysis_summary = result[0].final_output.analysis_summary;
  }
  
  // Show raw webhook response if no structured data
  if (!redesigned_alloy) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
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

  // Extract desired improvements from result
  const desiredImprovements = result.desired_improvements || [];

  return (
    <div className="space-y-6">
      {/* Alloy Header Card */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-border px-6 py-5">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Redesigned Alloy:</span>
        <h2 className="text-3xl font-bold text-steel-dark dark:text-primary mt-2">{redesigned_alloy.name}</h2>
      </div>

      {/* New Composition */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg">New Composition (%)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Element</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(redesigned_alloy.new_composition).map(([element, value], index) => (
                  <tr 
                    key={element}
                    className={index % 2 === 0 ? "bg-secondary/30" : "bg-card"}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{element}</td>
                    <td className="py-3 px-4 text-sm text-right text-muted-foreground">
                      {typeof value === 'number' ? value.toFixed(2) : value}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Improvement Results */}
      {Array.isArray(desiredImprovements) && desiredImprovements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Improvement Results</h3>
          <div className="grid gap-4">
            {desiredImprovements.map((improvement: any, index: number) => {
              const propertyKey = improvement.property || improvement.id;
              const propertyValue = redesigned_alloy.predicted_properties[propertyKey.toLowerCase().replace(/ /g, '_')] || 
                                    redesigned_alloy.predicted_properties[propertyKey] ||
                                    improvement.value;
              
              return (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      {improvement.property || `Improvement ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-secondary/30 rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground">Target Value:</span>
                        <span className="text-sm font-semibold text-foreground">{improvement.value}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-sm font-medium text-muted-foreground">Achieved Value:</span>
                        <span className="text-sm font-semibold text-primary">{propertyValue}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Predicted Properties */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg">Predicted Properties</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(redesigned_alloy.predicted_properties).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-4 bg-secondary/30 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-success mb-2">
              {(redesigned_alloy.probability_of_success * 100).toFixed(0)}%
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Probability of Success
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-accent mb-2">
              {redesigned_alloy.sustainability_score.toFixed(2)} / 1.0
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Sustainability Score
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Metric */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Estimated Cost per Kg</span>
              <div className="text-3xl font-bold text-primary mt-1">₹{redesigned_alloy.estimated_cost_per_kg}</div>
            </div>
            {analysis_summary?.cost_change_percent !== undefined && (
              <div className={`text-2xl font-semibold ${analysis_summary.cost_change_percent > 0 ? 'text-destructive' : 'text-success'}`}>
                {analysis_summary.cost_change_percent > 0 ? '+' : ''}{analysis_summary.cost_change_percent}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      {analysis_summary?.remarks && (
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg">Metallurgical Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis_summary.remarks}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON Response */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg">Raw API Response</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-xs font-mono text-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
