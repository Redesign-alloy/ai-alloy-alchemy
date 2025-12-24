import { AlloyResult, AchievedImprovement } from "@/types/alloy";
import { CheckCircle2, Loader2, Clock, TrendingUp, Flame, Droplets, Thermometer, Timer, MessageCircle, Send, IndianRupee, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { calculateCompositionCostFromObject } from "@/lib/elementPrices";

interface ResultsDisplayProps {
  result: AlloyResult | null;
  isLoading: boolean;
}

export const ResultsDisplay = ({ result, isLoading }: ResultsDisplayProps) => {
  const { toast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);

  // Handle Ask AI function
  const handleAskAI = async () => {
    if (!userQuestion.trim() || !result) {
      toast({
        title: "Cannot ask question",
        description: "Please enter a question and ensure results are available.",
        variant: "destructive",
      });
      return;
    }

    setIsAskingAI(true);
    setAiAnswer("");

    try {
      const response = await fetch(
        "https://tejanaidu4.app.n8n.cloud/webhook/ask-results",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userQuestion: userQuestion.trim(),
            fullResultContext: result, // The entire JSON object stored from the redesign API
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Handle response - could be string directly or in a response field
      const answer = typeof data === 'string' ? data : (data.response || data.answer || data.message || JSON.stringify(data));
      setAiAnswer(answer);
    } catch (error) {
      console.error("Error asking AI:", error);
      toast({
        title: "AI Query Failed",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsAskingAI(false);
    }
  };

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

  // Extract achieved_improvements array from response
  let achievedImprovements: AchievedImprovement[] = [];
  if (redesigned_alloy.achieved_improvements && Array.isArray(redesigned_alloy.achieved_improvements)) {
    achievedImprovements = redesigned_alloy.achieved_improvements;
  } else if (finalOutput.achieved_improvements && Array.isArray(finalOutput.achieved_improvements)) {
    achievedImprovements = finalOutput.achieved_improvements;
  }

  console.log("Achieved improvements:", achievedImprovements);

  // Helper function to get status styling
  const getStatusStyle = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'achieved' || lowerStatus === 'exceeded') {
      return {
        bg: 'bg-success/10',
        border: 'border-success/30',
        text: 'text-success',
        icon: <CheckCircle className="w-5 h-5 text-success" />,
      };
    } else if (lowerStatus === 'failed' || lowerStatus === 'not met') {
      return {
        bg: 'bg-destructive/10',
        border: 'border-destructive/30',
        text: 'text-destructive',
        icon: <XCircle className="w-5 h-5 text-destructive" />,
      };
    }
    return {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      icon: <AlertCircle className="w-5 h-5 text-warning" />,
    };
  };

  // Helper function to parse research-style Q&A output from JSON response
  const parseResearchOutput = (response: string) => {
    let outputText = '';
    
    // Try to parse as JSON array first (webhook response format)
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed) && parsed[0]?.output) {
        outputText = parsed[0].output;
      } else if (parsed.output) {
        outputText = parsed.output;
      } else if (typeof parsed === 'string') {
        outputText = parsed;
      } else {
        outputText = response;
      }
    } catch {
      // If not JSON, use as-is
      outputText = response;
    }

    // Split by the "---" separator to get analysis and sources sections
    const parts = outputText.split('---');
    let analysisText = parts[0]?.trim() || outputText;
    let sourcesText = parts.slice(1).join('---').trim() || '';
    
    // Parse markdown headers and format content
    // Replace ### headers with styled versions
    analysisText = analysisText
      .replace(/^### (\d+)\.\s*(.+)$/gm, '<h3 class="text-lg font-bold text-foreground mt-4 mb-2 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">$1</span>$2</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-foreground mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-foreground mt-4 mb-2">$1</h1>');
    
    // Replace [^X] and [^X, ^Y, ^Z] patterns with superscript citations
    analysisText = analysisText.replace(/\[\^(\d+)(?:,\s*\^(\d+))?(?:,\s*\^(\d+))?\]/g, (match, g1, g2, g3) => {
      const nums = [g1, g2, g3].filter(Boolean);
      return `<sup class="text-primary font-semibold cursor-pointer hover:underline">[${nums.join(', ')}]</sup>`;
    });
    
    // Replace **bold** with <strong>
    analysisText = analysisText.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
    
    // Replace *italic* with <em>
    analysisText = analysisText.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Parse sources section - extract numbered sources with Title and URL
    const sources: { number: string; title: string; url: string }[] = [];
    if (sourcesText) {
      // Look for patterns like "1. **Title:** text URL: https://..."
      const sourceRegex = /(\d+)\.\s*\*?\*?(?:Title:)?\*?\*?\s*(.+?)\s*(?:\*?\*?URL:\*?\*?|URL:)\s*(https?:\/\/[^\s]+)/gi;
      let match;
      while ((match = sourceRegex.exec(sourcesText)) !== null) {
        sources.push({
          number: match[1],
          title: match[2].trim().replace(/\*\*/g, ''),
          url: match[3].trim()
        });
      }
      
      // Fallback: try simpler pattern if no matches
      if (sources.length === 0) {
        const simpleRegex = /(\d+)\.\s*(.+?)\s+(https?:\/\/[^\s]+)/g;
        while ((match = simpleRegex.exec(sourcesText)) !== null) {
          sources.push({
            number: match[1],
            title: match[2].trim().replace(/\*\*/g, ''),
            url: match[3].trim()
          });
        }
      }
    }
    
    return { analysis: analysisText, sources };
  };

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
            
            {/* Calculated Cost Display for Redesigned Composition */}
            <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Estimated Cost per kg (₹)</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  ₹{calculateCompositionCostFromObject(parsedComposition).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Calculated from redesigned composition using live elemental prices
              </p>
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

      {/* Achieved Improvements - Dynamic Array Rendering */}
      {achievedImprovements.length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Achieved Improvements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              {achievedImprovements.map((improvement, index) => {
                const statusStyle = getStatusStyle(improvement.status);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${statusStyle.bg} ${statusStyle.border}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground mb-2">
                          {improvement.goal_name}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Target: </span>
                            <span className="font-medium text-foreground">{improvement.target_value}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Result: </span>
                            <span className="font-bold text-foreground">{improvement.achieved_value}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusStyle.icon}
                        <span className={`text-sm font-semibold ${statusStyle.text}`}>
                          {improvement.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Section 6: Proposed Heat Treatment Cycle */}
      {redesigned_alloy.heat_treatment_cycle && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Proposed Heat Treatment Cycle
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
              The properties of the redesigned alloy are achieved through the following standardized thermal process:
            </p>

            {/* 1. Process Overview */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                Process Overview
              </h4>
              <div className="space-y-2 ml-8">
                {redesigned_alloy.heat_treatment_cycle.type && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <span className="text-foreground">{redesigned_alloy.heat_treatment_cycle.type}</span>
                  </div>
                )}
                {redesigned_alloy.heat_treatment_cycle.predicted_microstructure && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Predicted Microstructure:</span>
                    <span className="text-foreground">{redesigned_alloy.heat_treatment_cycle.predicted_microstructure}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Austenitizing (Soaking) */}
            <div className="p-4 rounded-lg border border-border bg-gradient-to-r from-red-500/5 to-orange-500/5">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-sm font-bold">2</span>
                <Thermometer className="w-4 h-4 text-red-500" />
                Austenitizing (Soaking)
              </h4>
              <div className="space-y-2 ml-8">
                {redesigned_alloy.heat_treatment_cycle.austenitizing_temp && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Temperature:</span>
                    <span className="text-foreground font-semibold">{redesigned_alloy.heat_treatment_cycle.austenitizing_temp}</span>
                  </div>
                )}
                {redesigned_alloy.heat_treatment_cycle.soaking_time && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Time:</span>
                    <span className="text-foreground font-semibold">{redesigned_alloy.heat_treatment_cycle.soaking_time}</span>
                  </div>
                )}
                <div className="mt-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground italic">
                  <strong>Rationale:</strong> To dissolve carbon and alloying elements into the austenite phase for optimal hardening.
                </div>
              </div>
            </div>

            {/* 3. Quenching (Rapid Cooling) */}
            <div className="p-4 rounded-lg border border-border bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-bold">3</span>
                <Droplets className="w-4 h-4 text-blue-500" />
                Quenching (Rapid Cooling)
              </h4>
              <div className="space-y-2 ml-8">
                {redesigned_alloy.heat_treatment_cycle.quenching_medium && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Medium:</span>
                    <span className="text-foreground font-semibold">{redesigned_alloy.heat_treatment_cycle.quenching_medium}</span>
                  </div>
                )}
                {redesigned_alloy.heat_treatment_cycle.cooling_rate && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Cooling Rate:</span>
                    <span className="text-foreground font-semibold">{redesigned_alloy.heat_treatment_cycle.cooling_rate}</span>
                  </div>
                )}
                <div className="mt-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground italic">
                  <strong>Rationale:</strong> To suppress the formation of pearlite/bainite and maximize the conversion to high-strength martensite.
                </div>
              </div>
            </div>

            {/* 4. Tempering (Stress Relief & Ductility) */}
            {redesigned_alloy.heat_treatment_cycle.tempering_stage && (
              <div className="p-4 rounded-lg border border-border bg-gradient-to-r from-amber-500/5 to-yellow-500/5">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold">4</span>
                  <Timer className="w-4 h-4 text-amber-500" />
                  Tempering (Stress Relief & Ductility)
                </h4>
                <div className="space-y-2 ml-8">
                  {redesigned_alloy.heat_treatment_cycle.tempering_stage.required !== undefined && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Required:</span>
                      <span className={`font-semibold ${redesigned_alloy.heat_treatment_cycle.tempering_stage.required ? 'text-success' : 'text-muted-foreground'}`}>
                        {redesigned_alloy.heat_treatment_cycle.tempering_stage.required ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {redesigned_alloy.heat_treatment_cycle.tempering_stage.temp && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Temperature:</span>
                      <span className="text-foreground font-semibold">{redesigned_alloy.heat_treatment_cycle.tempering_stage.temp}</span>
                    </div>
                  )}
                  {redesigned_alloy.heat_treatment_cycle.tempering_stage.time && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Time:</span>
                      <span className="text-foreground font-semibold">{redesigned_alloy.heat_treatment_cycle.tempering_stage.time}</span>
                    </div>
                  )}
                  <div className="mt-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground italic">
                    <strong>Rationale:</strong> To relieve internal stresses, improve toughness, and adjust the final hardness to the target specification.
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Section 7: Ask the Metallurgical AI */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-violet-500" />
            💬 Ask the Metallurgical AI
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Have questions about this redesigned alloy? Ask our AI expert for detailed explanations.
          </p>
          
          {/* Question Input */}
          <Textarea
            placeholder="e.g., Why was Vanadium added to the composition? What are the benefits of the TMT process?"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isAskingAI}
          />
          
          {/* Ask Button */}
          <Button
            onClick={handleAskAI}
            disabled={isAskingAI || !userQuestion.trim()}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isAskingAI ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Ask AI
              </>
            )}
          </Button>

          {/* AI Answer Display - Research Style with Citations */}
          {aiAnswer && (() => {
            const { analysis, sources } = parseResearchOutput(aiAnswer);
            return (
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                {/* Analysis Section */}
                <div className="p-6 rounded-lg bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/20">
                  <div className="text-xs font-medium text-violet-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Final Metallurgical Analysis
                  </div>
                  <div 
                    className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none [&>h3]:border-b [&>h3]:border-border/30 [&>h3]:pb-2"
                    dangerouslySetInnerHTML={{ __html: analysis.replace(/\n\n/g, '</p><p class="mt-3">').replace(/\n/g, '<br />') }}
                  />
                </div>

                {/* Sources Section */}
                {sources.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border animate-in fade-in-50 duration-300 delay-200">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      📚 Verified Research Sources
                    </div>
                    <hr className="border-border mb-3" />
                    <div className="space-y-2">
                      {sources.map((source, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {source.number}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground mb-0.5">
                              {source.title}
                            </div>
                            <a 
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline break-all"
                            >
                              {source.url}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};
