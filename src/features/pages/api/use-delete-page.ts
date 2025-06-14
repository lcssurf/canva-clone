// src/features/pages/api/use-delete-page.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["pages"][":pageId"]["$delete"], 200>;

export const useDeletePage = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, { pageId: string }>({
    mutationFn: async ({ pageId }) => {
      const response = await client.api.projects[":projectId"]["pages"][":pageId"].$delete({
        param: { projectId, pageId },
      });

      if (!response.ok) {
        throw new Error("Failed to delete page");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Page deleted");
      queryClient.invalidateQueries({ queryKey: ["pages", projectId] });
    },
    onError: () => {
      toast.error("Failed to delete page");
    },
  });

  return mutation;
};