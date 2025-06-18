// hooks/useTranscription.ts (versão final otimizada para produção)
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { InstagramPost } from "@/content/crawler";

// ===== TIPOS TYPESCRIPT =====
export type BatchTranscriptionRequestType = InferRequestType<typeof client.api.transcription.batch["$post"]>["json"];
export type SingleTranscriptionRequestType = InferRequestType<typeof client.api.transcription.single["$post"]>["json"];

type BatchTranscriptionResponse = InferResponseType<typeof client.api.transcription.batch["$post"], 200>["data"];
type SingleTranscriptionResponse = InferResponseType<typeof client.api.transcription.single["$post"], 200>["data"];
type TranscriptionStatusResponse = InferResponseType<typeof client.api.transcription.status["$get"], 200>["data"];

interface UseTranscriptionOptions {
  onSuccess?: (data: BatchTranscriptionResponse) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

interface UseSingleTranscriptionOptions {
  onSuccess?: (data: SingleTranscriptionResponse) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

export interface TranscriptionStats {
  total: number;
  withTranscription: number;
  needsTranscription: number;
  withoutMedia: number;
  completionRate: number;
}

export interface PostValidationResult {
  validPosts: InstagramPost[];
  invalidPosts: Array<{
    post: InstagramPost;
    reason: string;
  }>;
}

// ===== FUNÇÕES UTILITÁRIAS =====
export const filterPostsForTranscription = (posts: InstagramPost[]): InstagramPost[] => {
  if (!Array.isArray(posts)) return [];
  
  return posts.filter(post => 
    post?.type === 'post' && 
    post?.url?.includes('instagram.com') &&
    !post?.aiTranscription &&
    (post?.images?.length || post?.videoURL)
  );
};

export const canTranscribePost = (post: InstagramPost): boolean => {
  if (!post || typeof post !== 'object') return false;
  
  return (
    post.type === 'post' &&
    post.url?.includes('instagram.com') &&
    !post.aiTranscription &&
    (!!post.images?.length || !!post.videoURL)
  );
};

const validateBatchSize = (size: number): number => {
  const validSize = Number(size);
  if (isNaN(validSize) || validSize < 1) return 3;
  if (validSize > 10) return 10;
  return Math.floor(validSize);
};

const estimateProcessingTime = (postsCount: number, batchSize: number): string => {
  const batches = Math.ceil(postsCount / batchSize);
  const minutes = Math.ceil(batches * 0.5); // ~30 segundos por lote
  
  if (minutes < 1) return "menos de 1 minuto";
  if (minutes === 1) return "1 minuto";
  return `${minutes} minutos`;
};

const formatErrorsForDisplay = (failedPosts: Record<string, string>) => {
  return Object.entries(failedPosts).map(([url, error]) => ({
    URL: url.length > 50 ? url.slice(0, 47) + '...' : url,
    Erro: error.length > 100 ? error.slice(0, 97) + '...' : error
  }));
};

// ===== HOOKS BÁSICOS =====
export const useBatchTranscription = (options?: UseTranscriptionOptions) => {
  return useMutation<
    BatchTranscriptionResponse,
    Error,
    { posts: InstagramPost[]; batchSize?: number }
  >({
    mutationFn: async ({ posts, batchSize = 3 }) => {
      if (!Array.isArray(posts) || posts.length === 0) {
        return {
          success: true,
          transcriptions: {},
          failedPosts: {},
          processed: 0,
          failed: 0,
          total: 0,
          message: "Nenhum post enviado para transcrição"
        };
      }

      const validBatchSize = validateBatchSize(batchSize);
      
      const response = await client.api.transcription.batch.$post({
        json: { posts, batchSize: validBatchSize },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: "Erro de comunicação com a API" 
        }));
        throw new Error(errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    onSettled: options?.onSettled,
    retry: (failureCount, error) => {
      // Não tentar novamente para erros 4xx
      if (error.message.includes('400') || 
          error.message.includes('401') || 
          error.message.includes('403') ||
          error.message.includes('413')) {
        return false;
      }
      return failureCount < 2; // Máximo 2 tentativas
    },
  });
};

export const useSingleTranscription = (options?: UseSingleTranscriptionOptions) => {
  return useMutation<
    SingleTranscriptionResponse,
    Error,
    InstagramPost
  >({
    mutationFn: async (post) => {
      if (!post || typeof post !== 'object') {
        throw new Error("Post inválido fornecido");
      }

      const response = await client.api.transcription.single.$post({
        json: post,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: "Erro de comunicação com a API" 
        }));
        throw new Error(errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    onSettled: options?.onSettled,
    retry: (failureCount, error) => {
      // Não tentar novamente para erros 4xx
      if (error.message.includes('400') || 
          error.message.includes('401') || 
          error.message.includes('403') ||
          error.message.includes('413')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useTranscriptionStatus = (url: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["transcription-status", url],
    queryFn: async (): Promise<TranscriptionStatusResponse> => {
      if (!url || !url.includes('instagram.com')) {
        throw new Error("URL inválida ou não é do Instagram");
      }

      const response = await client.api.transcription.status.$get({
        query: { url },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: "Erro de comunicação com a API" 
        }));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const { data } = await response.json();
      return data;
    },
    enabled: enabled && !!url && url.includes('instagram.com'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error.message.includes('400') || 
          error.message.includes('401') || 
          error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// ===== HOOK PRINCIPAL COM UI =====
export const useTranscriptionWithToasts = (
  allPosts: InstagramPost[],
  setSelectedPosts: (updater: (prevPosts: InstagramPost[]) => InstagramPost[]) => void
) => {
  // Validar parâmetros de entrada
  if (!Array.isArray(allPosts)) {
    console.error("useTranscriptionWithToasts: allPosts deve ser um array");
    allPosts = [];
  }
  
  if (typeof setSelectedPosts !== 'function') {
    console.error("useTranscriptionWithToasts: setSelectedPosts deve ser uma função");
    setSelectedPosts = () => {};
  }

  const batchTranscription = useBatchTranscription({
    onSuccess: (data) => {
      const { processed, failed, total } = data;

      // Toast de sucesso
      if (processed > 0) {
        toast.success(
          `✅ ${processed} transcrições concluídas!`,
          {
            description: failed > 0 
              ? `${failed} de ${total} posts falharam. Clique em "Ver Detalhes" para mais informações.` 
              : `Todos os ${total} posts foram processados com sucesso.`,
            duration: 6000,
          }
        );

        // Atualizar posts com as transcrições
        try {
          setSelectedPosts(prevPosts => {
            if (!Array.isArray(prevPosts)) return prevPosts;
            
            return prevPosts.map(post => {
              const transcriptions = data.transcriptions[post.url];
              if (transcriptions && Array.isArray(transcriptions) && transcriptions.length > 0) {
                return {
                  ...post,
                  aiTranscription: transcriptions.join('\n\n---\n\n'),
                };
              }
              return post;
            });
          });
        } catch (error) {
          console.error("Erro ao atualizar posts:", error);
          toast.error("Erro ao atualizar posts com transcrições");
        }
      }

      // Toast de erro para falhas
      if (failed > 0) {
        console.warn("⚠️ Posts que falharam na transcrição:", data.failedPosts);
        
        setTimeout(() => {
          toast.error(
            `⚠️ ${failed} posts falharam`,
            {
              description: `${failed} de ${total} posts não puderam ser processados.`,
              duration: 10000,
              action: {
                label: "Ver Detalhes",
                onClick: () => {
                  const formattedErrors = formatErrorsForDisplay(data.failedPosts);
                  console.table(formattedErrors);
                  toast.info("📋 Detalhes dos erros exibidos no console do navegador");
                },
              }
            }
          );
        }, 1500);
      }
    },
    onError: (error) => {
      console.error("❌ Erro crítico na transcrição em lote:", error);
      toast.error(
        "💥 Falha na transcrição em lote",
        {
          description: error.message || "Não foi possível processar os posts.",
          duration: 12000,
          action: {
            label: "Ver Console",
            onClick: () => {
              console.error("Detalhes do erro:", error);
              toast.info("🔍 Detalhes do erro exibidos no console");
            }
          }
        }
      );
    },
  });

  const singleTranscription = useSingleTranscription({
    onSuccess: (data) => {
      toast.success(
        "✅ Transcrição concluída!",
        {
          description: "Post transcrito com sucesso.",
          duration: 4000,
        }
      );

      // Atualizar o post específico
      try {
        setSelectedPosts(prevPosts => {
          if (!Array.isArray(prevPosts)) return prevPosts;
          
          return prevPosts.map(post => {
            if (post.url === data.url) {
              return {
                ...post,
                aiTranscription: data.transcription,
              };
            }
            return post;
          });
        });
      } catch (error) {
        console.error("Erro ao atualizar post:", error);
        toast.error("Erro ao atualizar post com transcrição");
      }
    },
    onError: (error) => {
      console.error("❌ Erro na transcrição única:", error);
      toast.error(
        "❌ Falha na transcrição",
        {
          description: error.message || "Não foi possível transcrever o post.",
          duration: 8000,
        }
      );
    },
  });

  // ===== FUNÇÕES PRINCIPAIS =====
  const processTranscriptions = async (batchSize: number = 3) => {
    try {
      const validBatchSize = validateBatchSize(batchSize);
      const postsToTranscribe = filterPostsForTranscription(allPosts);

      if (postsToTranscribe.length === 0) {
        toast.info(
          "ℹ️ Nenhum post para transcrever", 
          { 
            description: "Todos os posts já possuem transcrição ou não contêm mídia válida.",
            duration: 5000,
          }
        );
        return;
      }

      // Verificações e avisos
      const postsWithoutMedia = allPosts.filter(post => 
        post?.type === 'post' && 
        post?.url?.includes('instagram.com') &&
        !post?.aiTranscription &&
        !post?.images?.length && 
        !post?.videoURL
      );

      if (postsWithoutMedia.length > 0) {
        toast.warning(
          `⚠️ ${postsWithoutMedia.length} posts sem mídia`,
          {
            description: "Alguns posts serão ignorados por não conterem imagens ou vídeos.",
            duration: 6000,
          }
        );
      }

      // Estimativas e loading toast
      const estimatedTime = estimateProcessingTime(postsToTranscribe.length, validBatchSize);
      const batches = Math.ceil(postsToTranscribe.length / validBatchSize);

      const loadingToast = toast.loading(
        `🔄 Transcrevendo ${postsToTranscribe.length} posts...`,
        {
          description: `${batches} lotes de ${validBatchSize} posts. Tempo estimado: ${estimatedTime}`,
          duration: Infinity,
        }
      );

      await batchTranscription.mutateAsync({
        posts: postsToTranscribe,
        batchSize: validBatchSize
      });

      toast.dismiss(loadingToast);

    } catch (error) {
      console.error("❌ Falha no processamento:", error);
      toast.error(
        "💥 Erro no processamento",
        {
          description: "Ocorreu um erro inesperado durante o processamento.",
          duration: 8000,
        }
      );
    }
  };

  const transcribeSinglePost = async (post: InstagramPost) => {
    if (!canTranscribePost(post)) {
      const reason = !post?.url?.includes('instagram.com') 
        ? "URL não é do Instagram"
        : post?.aiTranscription
        ? "Post já possui transcrição"
        : "Post não contém mídia válida";

      toast.error(
        "❌ Post não pode ser transcrito",
        {
          description: reason,
          duration: 5000,
        }
      );
      return;
    }

    const loadingToast = toast.loading(
      "🔄 Transcrevendo post...",
      {
        description: "Analisando mídia e gerando transcrição.",
        duration: Infinity,
      }
    );

    try {
      await singleTranscription.mutateAsync(post);
    } catch (error) {
      console.error("❌ Falha na transcrição única:", error);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // ===== FUNÇÕES UTILITÁRIAS =====
  const getTranscriptionStats = (): TranscriptionStats => {
    const instagramPosts = allPosts.filter(p => 
      p?.type === 'post' && p?.url?.includes('instagram.com')
    );
    
    const total = instagramPosts.length;
    const withTranscription = instagramPosts.filter(p => p.aiTranscription).length;
    const needsTranscription = filterPostsForTranscription(allPosts).length;
    const withoutMedia = instagramPosts.filter(p => 
      !p.aiTranscription && !p.images?.length && !p.videoURL
    ).length;

    return {
      total,
      withTranscription,
      needsTranscription,
      withoutMedia,
      completionRate: total > 0 ? Math.round((withTranscription / total) * 100) : 0,
    };
  };

  const validatePostsForTranscription = (posts: InstagramPost[]): PostValidationResult => {
    if (!Array.isArray(posts)) {
      return { validPosts: [], invalidPosts: [] };
    }

    const validPosts: InstagramPost[] = [];
    const invalidPosts: Array<{ post: InstagramPost; reason: string }> = [];

    for (const post of posts) {
      if (!post || typeof post !== 'object') {
        invalidPosts.push({ 
          post, 
          reason: 'Post inválido' 
        });
        continue;
      }

      if (canTranscribePost(post)) {
        validPosts.push(post);
      } else {
        let reason = 'Motivo desconhecido';
        
        if (!post.url?.includes('instagram.com')) {
          reason = 'Não é um post do Instagram';
        } else if (post.aiTranscription) {
          reason = 'Já possui transcrição';
        } else if (!post.images?.length && !post.videoURL) {
          reason = 'Não contém mídia';
        }

        invalidPosts.push({ post, reason });
      }
    }

    return { validPosts, invalidPosts };
  };

  const getFilteredPosts = () => filterPostsForTranscription(allPosts);

  // ===== RETORNO DO HOOK =====
  return {
    // Funções principais
    processTranscriptions,
    transcribeSinglePost,
    
    // Estados de loading
    isBatchLoading: batchTranscription.isPending,
    isSingleLoading: singleTranscription.isPending,
    isLoading: batchTranscription.isPending || singleTranscription.isPending,
    
    // Funções utilitárias
    getTranscriptionStats,
    validatePostsForTranscription,
    getFilteredPosts,
    canTranscribePost,
    
    // Mutações diretas (para uso avançado)
    batchMutation: batchTranscription,
    singleMutation: singleTranscription,
    
    // Status e dados
    stats: getTranscriptionStats(),
    postsToTranscribe: getFilteredPosts(),
  };
};