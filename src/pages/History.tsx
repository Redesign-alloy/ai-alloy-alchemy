import { useState } from "react";
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
import { Search, Download, Eye, Loader2, History as HistoryIcon, RefreshCw, XCircle } from "lucide-react";
import { useProjects, Project } from "@/hooks/useProjects";
import { format } from "date-fns";

const History = () => {
  const { projects, isLoading, error, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProjects = projects.filter((project) =>
    project.alloy_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ["Date", "Alloy Name"];
    const rows = filteredProjects.map((p) => [
      format(new Date(p.created_at), "yyyy-MM-dd"),
      p.alloy_name,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alloy-projects-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to extract data from redesigned_data
  const getResultSummary = (project: Project) => {
    const data = project.redesigned_data as any;
    const result = data?.result?.data || data?.result || {};
    const summary = result?.analysis_summary || result?.summary || {};
    return {
      performanceGain: summary?.performance_gain_percent,
      costDelta: summary?.cost_change_percent,
      status: result?.status || 'completed',
    };
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project History</h1>
            <p className="text-muted-foreground mt-1">
              View your saved alloy redesigns 
              {projects.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-sm rounded-full font-medium">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="icon"
              className="shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by alloy name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" /> Saved Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Failed to load projects</h3>
                <p className="text-muted-foreground mb-4">There was an error loading your project history.</p>
                <Button onClick={() => refetch()} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Try Again
                </Button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                <p className="text-muted-foreground">Your saved alloy redesigns will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Alloy Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const summary = getResultSummary(project);
                      return (
                        <TableRow key={project.id} className="animate-in fade-in-0 duration-300">
                          <TableCell>{format(new Date(project.created_at), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-medium">{project.alloy_name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              summary.status === 'success' || summary.status === 'completed'
                                ? 'bg-success/10 text-success' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {summary.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {summary.performanceGain ? (
                              <span className="text-success font-medium">+{summary.performanceGain}%</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedProject(project); setIsDialogOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" /> View Report
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Details for {selectedProject?.alloy_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Alloy Name</div>
                  <div className="font-medium">{selectedProject?.alloy_name}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Created At</div>
                  <div className="font-medium">
                    {selectedProject?.created_at && format(new Date(selectedProject.created_at), "PPpp")}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Redesigned Data</div>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedProject?.redesigned_data, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default History;
