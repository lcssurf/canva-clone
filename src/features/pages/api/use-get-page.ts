import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetPage = (projectId: string, pageId: string) => {
  const query = useQuery({
    enabled: !!projectId && !!pageId,
    queryKey: ["page", projectId, pageId],
    queryFn: async () => {
      const response = await client.api.projects[":projectId"]["pages"][":pageId"].$get({
        param: { projectId, pageId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch page");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};