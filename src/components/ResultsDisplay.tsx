import { AlloyResult } from "@/types/alloy";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { useEffect, useState } from "react";

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
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="bg-secondary/50 border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Webhook Response
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-[600px]">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alloy Header Card */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-border px-6 py-5">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Redesigned Alloy:</span>
        <h2 className="text-3xl font-bold text-steel-dark dark:text-primary mt-2">{redesigned_alloy.name}</h2>
      </div>

      {/* New Composition */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">New Composition (%)</h3>
        </div>
        <div className="p-6">
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
        </div>
      </div>

      {/* Predicted Properties */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Predicted Properties</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(redesigned_alloy.predicted_properties).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center p-4 bg-secondary/30 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {key.replace(/_/g, " ")}:
              </span>
              <span className="text-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20 p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-success mb-2">
            {(redesigned_alloy.probability_of_success * 100).toFixed(0)}%
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Probability of Success
          </div>
        </div>
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-accent mb-2">
            {redesigned_alloy.sustainability_score.toFixed(2)} / 1.0
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Sustainability Score
          </div>
        </div>
      </div>

      {/* Cost Metric */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
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
      </div>

      {/* Analysis Summary */}
      {analysis_summary?.remarks && (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Metallurgical Analysis Summary</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis_summary.remarks}
            </p>
          </div>
        </div>
      )}

      {/* Raw JSON Response */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Raw API Response</h3>
        </div>
        <div className="p-6">
          <div className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-xs font-mono text-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
