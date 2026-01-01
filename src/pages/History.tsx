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
  name: string;
  base_alloy: string;
  input_data: unknown;
  result_data: unknown;
  performance_gain: number | null;
  cost_delta: number | null;
  status: string | null;
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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load project history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.base_alloy.toLowerCase().includes(searchQuery.toLowerCase())
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
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                <p className="text-muted-foreground">
                  Your saved alloy analyses will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Base Alloy</TableHead>
                      <TableHead>Performance Gain</TableHead>
                      <TableHead>Cost Delta</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(project.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.base_alloy}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPerformanceIcon(project.performance_gain)}
                            <span
                              className={
                                project.performance_gain && project.performance_gain > 0
                                  ? "text-success"
                                  : project.performance_gain && project.performance_gain < 0
                                  ? "text-destructive"
                                  : ""
                              }
                            >
                              {project.performance_gain !== null
                                ? `${project.performance_gain.toFixed(1)}%`
                                : "N/A"}
                            </span>
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject?.name}</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Base Alloy</p>
                    <p className="text-lg font-semibold">{selectedProject.base_alloy}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(selectedProject.created_at), "MMMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Performance Gain</p>
                    <p className={`text-lg font-semibold ${selectedProject.performance_gain && selectedProject.performance_gain > 0 ? 'text-success' : ''}`}>
                      {selectedProject.performance_gain?.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Cost Delta</p>
                    <p className={`text-lg font-semibold ${selectedProject.cost_delta && selectedProject.cost_delta < 0 ? 'text-success' : 'text-destructive'}`}>
                      {selectedProject.cost_delta && selectedProject.cost_delta > 0 ? '+' : ''}{selectedProject.cost_delta?.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {selectedProject.result_data && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Result Data</p>
                    <pre className="text-xs overflow-x-auto p-4 bg-card rounded border">
                      {JSON.stringify(selectedProject.result_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default History;
