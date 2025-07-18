// src/features/pages/api/use-delete-page.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["pages"][":pageId"]["$delete"], 200>;

export const useDeletePage = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, { pageId: string }, { previousPages: unknown }>({
    mutationFn: async ({ pageId }) => {
      const response = await client.api.projects[":projectId"]["pages"][":pageId"].$delete({
        param: { projectId, pageId },
      });

      if (!response.ok) {
        throw new Error("Failed to delete page");
      }

      return response.json();
    },
    onError: (err, variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(["pages", projectId], context.previousPages);
      }
      toast.error("Failed to delete page");
    },
    
    onSuccess: () => {
      toast.success("Page deleted");
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", projectId] });
    },
    // ✅ OPTIMISTIC DELETE
    onMutate: async ({ pageId }) => {
      await queryClient.cancelQueries({ queryKey: ["pages", projectId] });
      
      const previousPages = queryClient.getQueryData(["pages", projectId]);
      
      // Remove imediatamente da UI
      queryClient.setQueryData(["pages", projectId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((page: any) => page.id !== pageId);
      });
      
      return { previousPages };
    },
  });

  return mutation;
};