import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Download, Eye, Loader2, TrendingUp, TrendingDown, Minus, History as HistoryIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Project {
  id: string;
  user_id: string;
  alloy_name: string; // Changed from name/base_alloy
  redesigned_data: any; // Changed from result_data
  created_at: string;
}

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // REPLACE LINES 48-66 WITH THIS:
const fetchProjects = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from("alloy_data") // Use your actual table name
      .select("*")
      .eq("user_id", user?.id) // Filter so users only see their own data
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProjects(data || []);
  } catch (error) {
    console.error("Error fetching projects:", error);
    toast({
      title: "Error",
      description: "Could not connect to alloy_data table.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  // REPLACE LINES 68-72 WITH THIS:
const filteredProjects = projects.filter((project) =>
  project.alloy_name?.toLowerCase().includes(searchQuery.toLowerCase())
);

  const handleViewReport = (project: Project) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Project Name", "Base Alloy", "Performance Gain (%)", "Cost Delta (%)"];
    const rows = filteredProjects.map((p) => [
      format(new Date(p.created_at), "yyyy-MM-dd"),
      p.name,
      p.base_alloy,
      p.performance_gain?.toFixed(2) || "N/A",
      p.cost_delta?.toFixed(2) || "N/A",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alloy-projects-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your project data has been downloaded as CSV.",
    });
  };

  const getPerformanceIcon = (value: number | null) => {
    if (value === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project History</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your previous alloy redesign analyses
            </p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by project name or base alloy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              Saved Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
           // REPLACE TABLE BODY CONTENT (LINES 160-205) WITH THIS:
<TableBody>
  {filteredProjects.map((project) => (
    <TableRow key={project.id}>
      <TableCell className="font-mono text-sm">
        {format(new Date(project.created_at), "MMM dd, yyyy")}
      </TableCell>
      <TableCell className="font-medium">{project.alloy_name}</TableCell>
      <TableCell>
        {/* If redesigned_data is stored as a string, we parse it */}
        <span className="text-success font-semibold">
          Optimized
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewReport(project)}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          View Data
        </Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              project.cost_delta && project.cost_delta > 0
                                ? "text-destructive"
                                : project.cost_delta && project.cost_delta < 0
                                ? "text-success"
                                : ""
                            }
                          >
                            {project.cost_delta !== null
                              ? `${project.cost_delta > 0 ? "+" : ""}${project.cost_delta.toFixed(1)}%`
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(project)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Report
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          // REPLACE DIALOG CONTENT (LINES 214-245) WITH THIS:
<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Analysis for {selectedProject?.alloy_name}</DialogTitle>
  </DialogHeader>
  {selectedProject && (
    <div className="space-y-6">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">Redesign Parameters</p>
        <pre className="text-xs overflow-x-auto p-4 bg-card rounded border whitespace-pre-wrap">
          {typeof selectedProject.redesigned_data === 'string' 
            ? selectedProject.redesigned_data 
            : JSON.stringify(selectedProject.redesigned_data, null, 2)}
        </pre>
      </div>
    </div>
  )}

          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default History;
