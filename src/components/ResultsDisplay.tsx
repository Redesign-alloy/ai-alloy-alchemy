import { AchievedImprovement, AlloyData } from "@/types/alloy";
import { CheckCircle2, Loader2, Clock, TrendingUp, MessageCircle, Send, IndianRupee, CheckCircle, XCircle, AlertCircle, FileDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { calculateCompositionCostFromObject } from "@/lib/elementPrices";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = any;

interface ResultsDisplayProps {
  result: ApiResult;
  isLoading: boolean;
  inputData?: AlloyData | null;
}

export const ResultsDisplay = ({ result, isLoading, inputData }: ResultsDisplayProps) => {
  const { toast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle PDF Export
  const handleExportPDF = async () => {
    if (!result || !resultsRef.current) {
      toast({
        title: "Cannot Export",
        description: "No results available to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Technical Alloy Redesign Report", margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 15;

      // Extract data from new format
      const data = result.data;
      const redesignResults = data?.redesign_results;
      const finalOutput = result.final_output || result.value?.[0]?.final_output;
      
      // Alloy Name
      const alloyName = redesignResults?.redesigned_alloy?.name || 
                        finalOutput?.redesigned_alloy?.name || 
                        "Redesigned Alloy";
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Alloy: ${alloyName}`, margin, yPosition);
      yPosition += 12;

      // Composition Table
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Composition (%)", margin, yPosition);
      yPosition += 8;

      const composition = data?.composition || [];
      if (composition.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        
        // Table header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
        pdf.text("Element", margin + 2, yPosition);
        pdf.text("Percentage", margin + 50, yPosition);
        yPosition += 8;

        composition.forEach((item: { element: string; percentage: number }) => {
          pdf.text(item.element, margin + 2, yPosition);
          pdf.text(`${item.percentage.toFixed(2)}%`, margin + 50, yPosition);
          yPosition += 6;
        });
      } else {
        // Fallback to legacy format
        const legacyComp = redesignResults?.redesigned_alloy?.new_composition ||
                           finalOutput?.redesigned_alloy?.new_composition;
        if (legacyComp) {
          let parsedComp = typeof legacyComp === 'string' ? JSON.parse(legacyComp) : legacyComp;
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          Object.entries(parsedComp).forEach(([element, value]) => {
            pdf.text(element, margin + 2, yPosition);
            pdf.text(`${Number(value).toFixed(2)}%`, margin + 50, yPosition);
            yPosition += 6;
          });
        }
      }
      yPosition += 10;

      // Properties
      const properties = data?.properties || redesignResults?.redesigned_alloy?.predicted_properties || 
                         finalOutput?.redesigned_alloy?.predicted_properties || {};
      
      if (Object.keys(properties).length > 0) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Predicted Properties", margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        Object.entries(properties).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          pdf.text(`${label}: ${value}`, margin + 2, yPosition);
          yPosition += 6;
          
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }
      yPosition += 10;

      // Summary/Remarks
      const remarks = data?.summary?.remarks || 
                      redesignResults?.analysis_summary?.remarks ||
                      finalOutput?.analysis_summary?.remarks;
      
      if (remarks) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Metallurgical Insights", margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const splitRemarks = pdf.splitTextToSize(remarks, pageWidth - 2 * margin);
        pdf.text(splitRemarks, margin, yPosition);
        yPosition += splitRemarks.length * 5 + 10;
      }

      // Capture charts as images
      const chartsElement = document.getElementById('property-analysis-charts');
      if (chartsElement) {
        if (yPosition > 150) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const canvas = await html2canvas(chartsElement, { 
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false 
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, 200));
      }

      // Save PDF
      pdf.save(`alloy-report-${alloyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
      
      toast({
        title: "Report Downloaded",
        description: "Your technical report has been saved as PDF.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        "https://tejanaidu5.app.n8n.cloud/webhook/ask-results",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userQuestion: userQuestion.trim(),
            fullResultContext: result,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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

  // Don't show loading state here - handled by full-screen overlay in Dashboard
  if (isLoading) {
    return null;
  }

  // Show ready state only when no result AND status is not success
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

  console.log("Full API Response:", result);

  // Extract data from new format first, fallback to legacy
  const apiData = result.data;
  let finalOutput: any = null;
  let redesignResults: any = null;

  if (apiData) {
    redesignResults = apiData.redesign_results;
    finalOutput = redesignResults;
  } else {
    // Legacy format extraction
    if ((result as any).final_output) {
      finalOutput = (result as any).final_output;
    } else if ((result as any).value?.[0]?.final_output) {
      finalOutput = (result as any).value[0].final_output;
    } else if (Array.isArray(result) && (result as any)[0]?.final_output) {
      finalOutput = (result as any)[0].final_output;
    } else {
      const keys = Object.keys(result);
      for (const key of keys) {
        if ((result as any)[key]?.final_output) {
          finalOutput = (result as any)[key].final_output;
          break;
        }
      }
    }
  }

  const redesigned_alloy = finalOutput?.redesigned_alloy || redesignResults?.redesigned_alloy;
  const analysis_summary = apiData?.summary || finalOutput?.analysis_summary || redesignResults?.analysis_summary;

  // Get composition from new format or parse from legacy
  let compositionArray = apiData?.composition || [];
  let parsedComposition: { [key: string]: number | string } = {};
  
  if (compositionArray.length > 0) {
    compositionArray.forEach((item: { element: string; percentage: number }) => {
      parsedComposition[item.element] = item.percentage;
    });
  } else if (redesigned_alloy?.new_composition) {
    try {
      if (typeof redesigned_alloy.new_composition === 'string') {
        parsedComposition = JSON.parse(redesigned_alloy.new_composition);
      } else {
        parsedComposition = redesigned_alloy.new_composition;
      }
    } catch (e) {
      console.error('Failed to parse new_composition:', e);
    }
  }

  // Get properties from new format or legacy
  const properties = apiData?.properties || redesigned_alloy?.predicted_properties || {};

  // Extract achieved_improvements
  let achievedImprovements: AchievedImprovement[] = [];
  if (redesigned_alloy?.achieved_improvements && Array.isArray(redesigned_alloy.achieved_improvements)) {
    achievedImprovements = redesigned_alloy.achieved_improvements;
  } else if (finalOutput?.achieved_improvements && Array.isArray(finalOutput.achieved_improvements)) {
    achievedImprovements = finalOutput.achieved_improvements;
  }

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

  // Helper function to parse research-style Q&A output
  const parseResearchOutput = (response: string) => {
    let outputText = '';
    
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
      outputText = response;
    }

    const parts = outputText.split('---');
    let analysisText = parts[0]?.trim() || outputText;
    let sourcesText = parts.slice(1).join('---').trim() || '';
    
    analysisText = analysisText
      .replace(/^### (\d+)\.\s*(.+)$/gm, '<h3 class="text-lg font-bold text-foreground mt-4 mb-2 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">$1</span>$2</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-foreground mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-foreground mt-4 mb-2">$1</h1>');
    
    analysisText = analysisText.replace(/\[\^(\d+)(?:,\s*\^(\d+))?(?:,\s*\^(\d+))?\]/g, (match, g1, g2, g3) => {
      const nums = [g1, g2, g3].filter(Boolean);
      return `<sup class="text-primary font-semibold cursor-pointer hover:underline">[${nums.join(', ')}]</sup>`;
    });
    
    analysisText = analysisText.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
    analysisText = analysisText.replace(/\*(.+?)\*/g, '<em>$1</em>');

    const sources: { number: string; title: string; url: string }[] = [];
    if (sourcesText) {
      const sourceRegex = /(\d+)\.\s*\*?\*?(?:Title:)?\*?\*?\s*(.+?)\s*(?:\*?\*?URL:\*?\*?|URL:)\s*(https?:\/\/[^\s]+)/gi;
      let match;
      while ((match = sourceRegex.exec(sourcesText)) !== null) {
        sources.push({
          number: match[1],
          title: match[2].trim().replace(/\*\*/g, ''),
          url: match[3].trim()
        });
      }
      
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
    <div className="space-y-6" ref={resultsRef}>
      {/* Results Header with Export Button */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-foreground">
              {redesigned_alloy?.name || "Redesigned Alloy"}
            </CardTitle>
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              variant="outline"
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              Download Technical Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Composition Table */}
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

      {/* Property Cards */}
      {Object.keys(properties).length > 0 && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg">Predicted Properties</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(properties).map(([key, value]) => (
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

      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {redesigned_alloy?.probability_of_success !== undefined && (
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

        {redesigned_alloy?.sustainability_score !== undefined && (
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

      {/* Achieved Improvements */}
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
                            <span className="font-medium">{improvement.target_value}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Achieved: </span>
                            <span className="font-medium">{improvement.achieved_value}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusStyle.icon}
                        <span className={`text-sm font-medium ${statusStyle.text}`}>
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

      {/* Summary/Remarks Section */}
      {analysis_summary?.remarks && (
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 border-b">
            <CardTitle className="text-lg">Metallurgical Insights</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-foreground leading-relaxed">{analysis_summary.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* Property Analysis Charts */}
      <div id="property-analysis-charts">
        <PropertyAnalysis result={result} inputData={inputData} />
      </div>

      {/* Ask AI Section */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Ask About Results
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Textarea
            placeholder="Ask any question about the analysis results..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleAskAI} 
            disabled={isAskingAI || !userQuestion.trim()}
            className="w-full gap-2"
          >
            {isAskingAI ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Ask AI
          </Button>
          
          {aiAnswer && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <div 
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: parseResearchOutput(aiAnswer).analysis }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

