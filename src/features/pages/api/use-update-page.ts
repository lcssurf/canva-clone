// src/features/pages/api/use-update-page.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["pages"][":pageId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["pages"][":pageId"]["$patch"]>["json"];

export const useUpdatePage = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error,
    { pageId: string; data: RequestType }
  >({
    mutationFn: async ({ pageId, data }) => {
      const response = await client.api.projects[":projectId"]["pages"][":pageId"].$patch({
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
    onError: () => {
      toast.error("Failed to update page");
    },
  });

  return mutation;
};
