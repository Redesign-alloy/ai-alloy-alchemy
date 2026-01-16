import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Project {
  id: number;
  user_id: string;
  alloy_name: string;
  redesigned_data: unknown;
  created_at: string;
}

export interface CreateProjectData {
  alloy_name: string;
  redesigned_data: unknown;
}

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all projects from alloy_data table for the current user
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['alloy_data', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("alloy_data")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Create a new project with optimistic update
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await (supabase as any)
        .from("alloy_data")
        .insert([{
          user_id: user.id,
          alloy_name: projectData.alloy_name,
          redesigned_data: projectData.redesigned_data,
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Increment search_count in users table
      try {
        // First get current count
        const { data: userData } = await (supabase as any)
          .from("users")
          .select("search_count")
          .eq("id", user.id)
          .single();
        
        const currentCount = userData?.search_count || 0;
        
        // Update with incremented count
        await (supabase as any)
          .from("users")
          .update({ search_count: currentCount + 1 })
          .eq("id", user.id);
      } catch (countError) {
        console.error("Error updating search count:", countError);
      }
      
      // Invalidate search count query
      queryClient.invalidateQueries({ queryKey: ['searchCount', user.id] });
      
      return data as Project;
    },
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ['alloy_data', user?.id] });

      const previousProjects = queryClient.getQueryData<Project[]>(['alloy_data', user?.id]);

      if (previousProjects) {
        const optimisticProject: Project = {
          id: Date.now(),
          user_id: user?.id || '',
          alloy_name: newProject.alloy_name,
          redesigned_data: newProject.redesigned_data,
          created_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Project[]>(
          ['alloy_data', user?.id],
          [optimisticProject, ...previousProjects]
        );
      }

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['alloy_data', user?.id], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alloy_data', user?.id] });
    },
  });

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

// Hook for search count from users table
export const useSearchCount = () => {
  const { user } = useAuth();

  const { data: count = 0, isLoading, refetch } = useQuery({
    queryKey: ['searchCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await (supabase as any)
        .from("users")
        .select("search_count")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching search count:", error);
        return 0;
      }
      return data?.search_count || 0;
    },
    enabled: !!user?.id,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  return { count, isLoading, refetch };
};

// Legacy hook for backward compatibility
export const useProjectCount = () => {
  const { count, isLoading } = useSearchCount();
  return { count, isLoading };
};
