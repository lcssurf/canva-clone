// src/features/pages/api/use-update-page.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.projects)[":projectId"]["pages"][":pageId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.projects)[":projectId"]["pages"][":pageId"]["$patch"]
>["json"];

export const useUpdatePage = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error,
    { pageId: string; data: RequestType },
    { previousPages?: unknown }
  >({
    mutationKey: ["updatePage", projectId],
    mutationFn: async ({ pageId, data }) => {
      const response = await client.api.projects[":projectId"]["pages"][
        ":pageId"
      ].$patch({
        param: { projectId, pageId },
        json: data,
      });

      if (!response.ok) {
        throw new Error("Failed to update page");
      }

      return response.json();
    },
    onSuccess: (_, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["page", projectId, pageId] });
      queryClient.invalidateQueries({ queryKey: ["pages", projectId] });
    },
    onError: (err, variables, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(["pages", projectId], context.previousPages);
      }
      toast.error("Failed to update page");
    },
    // ✅ OPTIMISTIC UPDATE
    onMutate: async ({ pageId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["pages", projectId] });

      const previousPages = queryClient.getQueryData(["pages", projectId]);

      // ✅ CORREÇÃO: old é array direto, não objeto com .data
      queryClient.setQueryData(["pages", projectId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;

        // ✅ Mapear diretamente o array
        return old.map((page: any) =>
          page.id === pageId
            ? { ...page, ...data, updatedAt: new Date().toISOString() }
            : page
        );
      });

      return { previousPages };
    },
    // ✅ REVALIDAR no final
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", projectId] });
    },
  });

  return mutation;
};
