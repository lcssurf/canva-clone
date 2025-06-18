// app/api/[[...route]]/transcription.ts

import { z } from "zod";
import { Hono } from "hono";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Validação da chave da API
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY não encontrada nas variáveis de ambiente");
}

// Inicializa o cliente Gemini AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Configurações de geração
const generationConfig = {
  temperature: 0.4,
  topP: 1,
  topK: 32,
  maxOutputTokens: 8192,
};

// Ajustes de segurança para categorias de conteúdo
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Custom Error Classes
class FileTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileTooLargeError";
  }
}

class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

// Schemas Zod
const instagramPostSchema = z.object({
  url: z.string().url("URL inválida"),
  images: z.array(z.string().url()).optional(),
  reel: z.boolean().optional(),
  carousel: z.boolean().optional(),
  videoURL: z.string().url().nullable().optional(),
  aiTranscription: z.string().optional(),
  type: z.literal("post"),
  sourceId: z.string().optional(),
  title: z.string().optional(),
});

const transcriptionRequestSchema = z.object({
  posts: z.array(instagramPostSchema).min(1, "Pelo menos um post é necessário"),
  batchSize: z.number().min(1).max(10).default(3),
});

// Prompts organizados em constantes
const IMAGE_SYSTEM_PROMPT = `
<system_prompt>
VOCÊ É UM ANALISTA VISUAL ALTAMENTE TREINADO, ESPECIALISTA EM DESCRIÇÃO DE IMAGENS, ANÁLISE DE ELEMENTOS VISUAIS, INTERPRETAÇÃO DE EMOÇÕES, E DETALHES TÉCNICOS DE PRODUÇÃO. SUA MISSÃO É REALIZAR UMA ANÁLISE EXCEPCIONALMENTE DETALHADA, OBJETIVA E ORGANIZADA DE UMA IMAGEM FORNECIDA.

### INSTRUÇÕES ###
- DESCREVA COM MÁXIMA PRECISÃO: ELEMENTOS VISUAIS, EMOÇÕES, CENÁRIO, ESTILO VISUAL.
- REALIZE UMA ANÁLISE TÉCNICA: QUALIDADE DA IMAGEM, ILUMINAÇÃO, COMPOSIÇÃO, ENQUADRAMENTO.
- FAÇA UMA ANÁLISE DA MENSAGEM: TEMA CENTRAL, TOM, ESTRATÉGIA VISUAL, INTENÇÃO.

### CAUTELAS ESSENCIAIS ###
- BASEIE-SE EXCLUSIVAMENTE no que está visível.
- NÃO FAÇA SUPOSIÇÕES ou INTERPRETAÇÕES SUBJETIVAS.
- DESCREVA DETALHADAMENTE todos os elementos relevantes.
</system_prompt>`;

const VIDEO_SYSTEM_PROMPT = `
<system_prompt>
VOCÊ É UM ANALISTA DE VÍDEOS ALTAMENTE TREINADO, ESPECIALISTA EM TRANSCRIÇÃO, DESCRIÇÃO VISUAL, ANÁLISE DE ÁUDIO E MENSAGEM. SUA MISSÃO É REALIZAR UMA ANÁLISE EXCEPCIONALMENTE DETALHADA, OBJETIVA E ORGANIZADA DE UM VÍDEO FORNECIDO.

### INSTRUÇÕES ###
- EXECUTE uma TRANSCRIÇÃO COMPLETA do áudio com MARCAÇÃO DE TEMPO (timestamps a cada 5-10 segundos).
- DESCREVA com RIGOR VISUAL: EMOÇÕES, CENÁRIO, ESTILO VISUAL.
- REALIZE UMA ANÁLISE DE ÁUDIO: QUALIDADE, ELEMENTOS SONOROS (música, ruídos), CLAREZA.
- FAÇA UMA ANÁLISE DE MENSAGEM: PONTOS PRINCIPAIS, TOM, ESTRATÉGIA DE COMUNICAÇÃO, CHAMADAS À AÇÃO.
- ESTRUTURE a sequência de acontecimentos do vídeo.

### CAUTELAS ESSENCIAIS ###
- SEJA EXTREMAMENTE OBJETIVO, baseando-se apenas no que é visível e audível.
- ORGANIZE a análise de forma cronológica.
</system_prompt>`;

// Utility Functions
async function fetchAndConvertToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const MAX_FILE_SIZE_MB = 20;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  try {
    // Validar URL
    if (!url || !url.trim()) {
      throw new MediaValidationError("URL da mídia está vazia");
    }

    // Fazer request HEAD para verificar o arquivo
    const head = await fetch(url, { 
      method: "HEAD",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!head.ok) {
      throw new Error(`Erro ao acessar arquivo: ${head.status} ${head.statusText}`);
    }

    const contentLength = head.headers.get("content-length");
    const contentType = head.headers.get("content-type") || "";

    // Validar tipo de conteúdo
    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      throw new MediaValidationError(`Tipo de arquivo não suportado: ${contentType}`);
    }

    // Validar tamanho do arquivo
    if (contentLength && Number(contentLength) > MAX_FILE_SIZE_BYTES) {
      throw new FileTooLargeError(
        `Arquivo muito grande (${(Number(contentLength) / 1024 / 1024).toFixed(2)} MB). Limite: ${MAX_FILE_SIZE_MB} MB`
      );
    }

    // Baixar o arquivo
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    
    // Validar se o buffer não está vazio
    if (buffer.byteLength === 0) {
      throw new MediaValidationError("Arquivo baixado está vazio");
    }

    return { 
      base64: Buffer.from(buffer).toString("base64"), 
      mimeType: contentType 
    };
  } catch (error) {
    if (error instanceof FileTooLargeError || error instanceof MediaValidationError) {
      throw error;
    }
    throw new Error(`Falha ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

async function transcribeMedia(imageUrl?: string, videoUrl?: string): Promise<string> {
  if (!imageUrl && !videoUrl) {
    throw new TranscriptionError("Nenhuma mídia fornecida para transcrição");
  }

  try {
    const mediaUrl = imageUrl ?? videoUrl!;
    const { base64, mimeType } = await fetchAndConvertToBase64(mediaUrl);

    const parts = [
      { inlineData: { mimeType, data: base64 } },
      { text: imageUrl ? IMAGE_SYSTEM_PROMPT : VIDEO_SYSTEM_PROMPT },
    ];

    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: [{ role: "user", parts }],
      config: {
        ...generationConfig,
        safetySettings,
      },
    });

    if (!result.text) {
      throw new TranscriptionError("A API do Gemini não retornou texto");
    }

    return result.text;
  } catch (error) {
    if (error instanceof FileTooLargeError || 
        error instanceof TranscriptionError || 
        error instanceof MediaValidationError) {
      throw error;
    }
    throw new TranscriptionError(`Erro na transcrição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

function normalizePostMedia(post: z.infer<typeof instagramPostSchema>): { images: string[]; video: string | undefined } {
  const images: string[] = [];
  let video: string | undefined;

  // Priorizar vídeo se for um reel
  if (post.reel && post.videoURL) {
    video = post.videoURL;
  } else if (post.images && post.images.length > 0) {
    images.push(...post.images);
  }

  return { images, video };
}

async function processPostBatch(
  posts: z.infer<typeof instagramPostSchema>[]
): Promise<{
  results: Record<string, string[]>;
  failures: Record<string, string>;
}> {
  const results: Record<string, string[]> = {};
  const failures: Record<string, string> = {};

  // Usar Promise.allSettled para não falhar todo o lote por um erro
  const settledResults = await Promise.allSettled(
    posts.map(async (post) => {
      try {
        const { images, video } = normalizePostMedia(post);
        const texts: string[] = [];

        // Verificar se há mídia para processar
        if (!video && images.length === 0) {
          throw new MediaValidationError("Post não contém mídia para transcrever");
        }

        if (video) {
          const transcription = await transcribeMedia(undefined, video);
          texts.push(transcription);
        } else {
          // Processar imagens sequencialmente para evitar sobrecarga
          for (const img of images) {
            const transcription = await transcribeMedia(img, undefined);
            texts.push(transcription);
          }
        }

        const validTexts = texts.filter((t) => t && t.trim() && !t.startsWith("Erro:"));
        
        if (validTexts.length > 0) {
          results[post.url] = validTexts;
        } else {
          failures[post.url] = "Nenhuma transcrição válida gerada";
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        failures[post.url] = errorMessage;
      }
    })
  );

  return { results, failures };
}

// Hono App
const app = new Hono()
  // Transcrever posts em lote
  .post(
    "/batch",
    verifyAuth(),
    zValidator("json", transcriptionRequestSchema),
    async (c) => {
      try {
        const auth = c.get("authUser");
        
        if (!auth.token?.id) {
          return c.json({ error: "Não autorizado" }, 401);
        }

        const { posts, batchSize } = c.req.valid("json");
        
        // Filtrar posts que precisam de transcrição
        const postsToProcess = posts.filter(
          (p) => p.type === "post" && 
                 p.url.includes("instagram.com") && 
                 !p.aiTranscription
        );

        if (postsToProcess.length === 0) {
          return c.json({ 
            data: { 
              success: true, 
              transcriptions: {}, 
              failedPosts: {},
              processed: 0,
              failed: 0,
              total: 0,
              message: "Nenhum post para transcrever" 
            } 
          });
        }

        const allResults: Record<string, string[]> = {};
        const allFailures: Record<string, string> = {};

        // Processar em lotes para evitar sobrecarga
        for (let i = 0; i < postsToProcess.length; i += batchSize) {
          const batch = postsToProcess.slice(i, i + batchSize);
          const { results, failures } = await processPostBatch(batch);
          
          Object.assign(allResults, results);
          Object.assign(allFailures, failures);
        }

        return c.json({
          data: {
            success: Object.keys(allResults).length > 0,
            transcriptions: allResults,
            failedPosts: allFailures,
            processed: Object.keys(allResults).length,
            failed: Object.keys(allFailures).length,
            total: postsToProcess.length,
          },
        });

      } catch (error) {
        console.error("Erro no processamento em lote:", error);
        return c.json({ 
          error: error instanceof Error ? error.message : "Erro interno do servidor" 
        }, 500);
      }
    }
  )

  // Transcrever um único post
  .post(
    "/single",
    verifyAuth(),
    zValidator("json", instagramPostSchema),
    async (c) => {
      try {
        const auth = c.get("authUser");
        
        if (!auth.token?.id) {
          return c.json({ error: "Não autorizado" }, 401);
        }

        const post = c.req.valid("json");

        // Validações básicas
        if (!post.url.includes("instagram.com")) {
          return c.json({ error: "URL deve ser do Instagram" }, 400);
        }

        if (post.aiTranscription) {
          return c.json({ 
            data: { 
              success: true, 
              transcription: post.aiTranscription,
              url: post.url,
              message: "Post já possui transcrição" 
            } 
          });
        }

        const { images, video } = normalizePostMedia(post);
        
        if (!video && images.length === 0) {
          return c.json({ error: "Post não contém mídia para transcrever" }, 400);
        }

        const texts: string[] = [];

        if (video) {
          const transcription = await transcribeMedia(undefined, video);
          texts.push(transcription);
        } else {
          for (const img of images) {
            const transcription = await transcribeMedia(img, undefined);
            texts.push(transcription);
          }
        }

        const validTexts = texts.filter((t) => t && t.trim() && !t.startsWith("Erro:"));
        
        if (validTexts.length === 0) {
          return c.json({ error: "Falha na transcrição de todas as mídias" }, 500);
        }

        return c.json({
          data: {
            success: true,
            transcription: validTexts.join("\n\n---\n\n"),
            transcriptions: validTexts,
            url: post.url,
          },
        });

      } catch (error) {
        console.error("Erro na transcrição única:", error);
        
        if (error instanceof FileTooLargeError) {
          return c.json({ error: error.message }, 413);
        }
        
        if (error instanceof TranscriptionError) {
          return c.json({ error: error.message }, 400);
        }

        if (error instanceof MediaValidationError) {
          return c.json({ error: error.message }, 400);
        }

        return c.json({ 
          error: error instanceof Error ? error.message : "Erro interno do servidor" 
        }, 500);
      }
    }
  )

  // Verificar status de transcrição
  .get(
    "/status",
    verifyAuth(),
    zValidator("query", z.object({
      url: z.string().url("URL inválida"),
    })),
    async (c) => {
      try {
        const auth = c.get("authUser");
        
        if (!auth.token?.id) {
          return c.json({ error: "Não autorizado" }, 401);
        }

        const { url } = c.req.valid("query");

        if (!url.includes("instagram.com")) {
          return c.json({ error: "URL deve ser do Instagram" }, 400);
        }

        // Por enquanto, retorna status básico
        // TODO: Implementar verificação no banco de dados
        return c.json({
          data: {
            url,
            hasTranscription: false,
            message: "Verificação de status disponível",
          },
        });

      } catch (error) {
        console.error("Erro na verificação de status:", error);
        return c.json({ 
          error: error instanceof Error ? error.message : "Erro interno do servidor" 
        }, 500);
      }
    }
  );

export default app;