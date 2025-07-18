import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["pages"]["reorder"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["pages"]["reorder"]["$patch"]>["json"];

export const useReorderPages = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error,
    RequestType,
    { previousPages: unknown }
  >({
    mutationKey: ["reorderPages", projectId],
    mutationFn: async (json) => {
      const response = await client.api.projects[":projectId"]["pages"]["reorder"].$patch({
        param: { projectId },
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to reorder pages");
      }

      return response.json();
    },
    
    // ✅ OPTIMISTIC UPDATE
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["pages", projectId] });
      
      const previousPages = queryClient.getQueryData(["pages", projectId]);
      
      // Atualizar ordem otimisticamente
      queryClient.setQueryData(["pages", projectId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        
        // Criar mapa de nova ordem
        const orderMap = new Map(data.pages.map(p => [p.id, p.order]));
        
        // Reordenar array baseado na nova ordem
        return old
          .map(page => ({
            ...page,
            order: orderMap.get(page.id) ?? page.order
          }))
          .sort((a, b) => a.order - b.order);
      });
      
      return { previousPages };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(["pages", projectId], context.previousPages);
      }
      toast.error("Failed to reorder pages");
    },
    
    onSuccess: () => {
      toast.success("Pages reordered");
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", projectId] });
    },
  });

  return mutation;
};