// src/features/pages/api/use-get-pages.ts

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetPages = (projectId: string) => {
  const query = useQuery({
    enabled: !!projectId,
    queryKey: ["pages", projectId],
    queryFn: async () => {
      const response = await client.api.projects[":projectId"]["pages"].$get({
        param: { projectId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pages");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};