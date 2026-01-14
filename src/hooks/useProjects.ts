import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  base_alloy: string;
  input_data: unknown;
  result_data: unknown;
  status: string | null;
  performance_gain: number | null;
  cost_delta: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  base_alloy: string;
  input_data: Json;
  result_data: Json;
  performance_gain?: number;
  cost_delta?: number;
  status?: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all projects for the current user
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!user?.id,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Create a new project with optimistic update
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("projects")
        .insert([{
          user_id: user.id,
          ...projectData,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onMutate: async (newProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects', user?.id] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', user?.id]);

      // Optimistically update to the new value
      if (previousProjects) {
        const optimisticProject: Project = {
          id: `temp-${Date.now()}`,
          user_id: user?.id || '',
          name: newProject.name,
          base_alloy: newProject.base_alloy,
          input_data: newProject.input_data,
          result_data: newProject.result_data,
          status: newProject.status || 'completed',
          performance_gain: newProject.performance_gain || null,
          cost_delta: newProject.cost_delta || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Project[]>(
          ['projects', user?.id],
          [optimisticProject, ...previousProjects]
        );
      }

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      // Roll back to the previous value on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', user?.id], context.previousProjects);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  // Get project count
  const projectCount = projects.length;

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    projectCount,
  };
};

// Hook specifically for project count (lightweight)
export const useProjectCount = () => {
  const { user } = useAuth();

  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['projectCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  return { count, isLoading };
};
