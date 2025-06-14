// src/features/pages/api/use-create-page.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["pages"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["pages"]["$post"]>["json"];

export const useCreatePage = (projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.projects[":projectId"]["pages"].$post({
        param: { projectId },
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to create page");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Page created");
      queryClient.invalidateQueries({ queryKey: ["pages", projectId] });
    },
    onError: () => {
      toast.error("Failed to create page");
    },
  });

  return mutation;
};