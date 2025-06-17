// hooks/useTranscription.ts (versão corrigida)
import { InferRequestType, InferResponseType } from "hono";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { InstagramPost } from "@/content/crawler";

// Inferir tipos da rota Hono
export type TranscriptionRequestType = InferRequestType<typeof client.api.transcription.transcribe["$post"]>["json"];
export type TranscriptionResponseType = InferResponseType<typeof client.api.transcription.transcribe["$post"], 200>;

interface UseTranscriptionOptions {
  onSuccess?: (data: TranscriptionResponseType["data"]) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

export const useTranscription = (options?: UseTranscriptionOptions) => {
  const mutation = useMutation({
    mutationFn: async ({ posts, batchSize = 3 }: { posts: InstagramPost[], batchSize?: number }) => {
      // Filtrar posts que precisam de transcrição no frontend também
      const instagramPosts = posts.filter(post => 
        post.type === 'post' && 
        post.url.includes('instagram.com') &&
        (!post.aiTranscription)
      );

      if (instagramPosts.length === 0) {
        return {
          success: true,
          transcriptions: {},
          failedPosts: [],
          message: "Nenhum post precisa de transcrição"
        };
      }

      const response = await client.api.transcription.transcribe.$post({
        json: {
          posts: instagramPosts,
          batchSize,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || `Erro na API: ${response.status}`);
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
    onSettled: () => {
      options?.onSettled?.();
    },
  });

  return mutation;
};

// Hook simplificado para usar em componentes
export const useTranscriptionWithToasts = (
  selectedPosts: InstagramPost[],
  setSelectedPosts: (posts: InstagramPost[]) => void
) => {
  const transcription = useTranscription({
    onSuccess: (data) => {
      const successCount = Object.keys(data.transcriptions).length;
      const failCount = data.failedPosts.length;

      toast.success(
        `✅ Transcrições concluídas!`,
        {
          description: `${successCount} sucessos${failCount > 0 ? `, ${failCount} falhas` : ''}`,
          duration: 5000
        }
      );

      // Atualizar posts com transcrições
      const updatedPosts = selectedPosts.map(post => {
        if (data.transcriptions[post.url]) {
          return {
            ...post,
            aiTranscription: data.transcriptions[post.url].join('\n\n'),
          };
        }
        return post;
      });

      setSelectedPosts(updatedPosts);

      // Log das transcrições para debug
      Object.entries(data.transcriptions).forEach(([url, texts]) => {
        console.log(`📝 Transcrição para ${url}:`, texts);
      });

      if (data.failedPosts.length > 0) {
        setTimeout(() => {
          toast.error(
            `⚠️ ${data.failedPosts.length} posts falharam`,
            {
              description: "Verifique o console para mais detalhes",
              duration: 8000,
              action: {
                label: "Ver erros",
                onClick: () => {
                  console.warn("⚠️ Posts que falharam:", data.failedPosts);
                  if (data.errors) {
                    console.warn("⚠️ Erros detalhados:", data.errors);
                  }
                }
              }
            }
          );
        }, 1000);
      }
    },
    onError: (error) => {
      toast.error(
        "💥 Erro durante transcrição",
        {
          description: error.message || "Erro desconhecido",
          duration: 10000,
          action: {
            label: "Ver console",
            onClick: () => console.error("Erro completo:", error)
          }
        }
      );
    },
  });

  const processTranscriptions = async (batchSize: number = 3) => {
    // Filtrar posts que precisam de transcrição
    const instagramPosts = selectedPosts.filter(post => 
      post.type === 'post' && 
      post.url.includes('instagram.com') &&
      (!post.aiTranscription)
    );

    if (instagramPosts.length === 0) {
      toast.info("ℹ️ Todos os posts já possuem transcrição");
      return;
    }

    // Toast de loading
    const loadingToast = toast.loading(
      `🔄 Iniciando transcrição de ${instagramPosts.length} posts...`,
      {
        description: "Preparando análise de mídia",
        duration: Infinity
      }
    );

    try {
      const result = await transcription.mutateAsync({
        posts: selectedPosts,
        batchSize
      });

      // Remover toast de loading
      toast.dismiss(loadingToast);
      
      return result;
      
    } catch (error) {
      toast.dismiss(loadingToast);
      throw error;
    }
  };

  return {
    processTranscriptions,
    isLoading: transcription.isPending,
    error: transcription.error,
    data: transcription.data,
  };
};