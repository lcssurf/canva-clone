import { z } from "zod";
import { Hono } from "hono";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { replicate } from "@/lib/replicate";

// Validação para rota generate-content
const generateContentSchema = z.object({
  goal: z.string().min(1, "Objetivo é obrigatório"),
  niche: z.string().min(1, "Nicho é obrigatório"),
  audience: z.string().min(1, "Público-alvo é obrigatório"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  tone: z.array(z.string()).min(1, "Pelo menos um tom deve ser selecionado"),
  format: z.string().min(1, "Formato é obrigatório"),
  selectedPosts: z.array(z.object({
    url: z.string().url(),
    type: z.enum(["post", "article", "video"]),
    title: z.string().optional(),
    content: z.string().optional(),
    transcription: z.string().optional(),
    aiTranscription: z.string().optional(),
  })).optional(),
});

const app = new Hono()
  .post(
    "/remove-bg",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        image: z.string(),
      }),
    ),
    async (c) => {
      const { image } = c.req.valid("json");

      const input = {
        image: image
      };
    
      const output: unknown = await replicate.run("cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", { input });

      const res = output as string;

      return c.json({ data: res });
    },
  )
  .post(
    "/generate-image",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        prompt: z.string(),
      }),
    ),
    async (c) => {
      const { prompt } = c.req.valid("json");

      const input = {
        cfg: 3.5,
        steps: 28,
        prompt: prompt,
        aspect_ratio: "3:2",
        output_format: "webp",
        output_quality: 90,
        negative_prompt: "",
        prompt_strength: 0.85
      };
      
      const output = await replicate.run("stability-ai/stable-diffusion-3", { input });
      
      const res = output as Array<string>;

      return c.json({ data: res[0] });
    },
  )
  .post(
    "/generate-content",
    verifyAuth(),
    zValidator("json", generateContentSchema),
    async (c) => {
      console.log("🔍 Iniciando geração de conteúdo com dados:", c.req.valid("json"));
      
      try {
        const auth = c.get("authUser");
        
        if (!auth.token?.id) {
          return c.json({ error: "Não autorizado" }, 401);
        }

        const validatedData = c.req.valid("json");

        // Verificar se a API Key está configurada
        const apiKey = process.env.CONTENT_GENERATION_API_KEY;
        if (!apiKey) {
          console.error("CONTENT_GENERATION_API_KEY não encontrada");
          return c.json({ error: "Configuração da API não encontrada" }, 500);
        }

        // URL da API externa (configure conforme sua necessidade)
        const externalApiUrl = process.env.CONTENT_GENERATION_API_URL;

        if (!externalApiUrl) {
          console.error("CONTENT_GENERATION_API_URL não encontrada");
          return c.json({ error: "Configuração da URL da API não encontrada" }, 500);
        }

        // Preparar dados para envio
        const requestPayload = {
          ...validatedData,
          userId: auth.token.id, // Adiciona ID do usuário se necessário
          timestamp: new Date().toISOString(),
        };

        console.log("🚀 Enviando requisição para API externa:", requestPayload);

        // Fazer requisição para API externa
        const response = await fetch(externalApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey, // Header com API Key
            "User-Agent": "Postmix/1.0",
          },
          body: JSON.stringify(requestPayload),
        });

        // Verificar se a requisição foi bem-sucedida
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Erro desconhecido");
          console.error("❌ Erro na API externa:", response.status, errorText);
          
          // Retornar erro específico baseado no status
          if (response.status === 401) {
            return c.json({ error: "API Key inválida ou expirada" }, 401);
          } else if (response.status === 429) {
            return c.json({ error: "Limite de requisições excedido. Tente novamente mais tarde." }, 429);
          } else if (response.status >= 500) {
            return c.json({ error: "Erro interno da API de geração de conteúdo" }, 502);
          } else {
            return c.json({ error: `Erro na geração: ${errorText}` }, 400);
          }
        }

        // Processar resposta da API
        const contentType = response.headers.get("content-type");
        let apiResponse;

        if (contentType?.includes("application/json")) {
          apiResponse = await response.json();
        } else {
          // Se não for JSON, assumir que é texto
          const textResponse = await response.text();
          apiResponse = { content: textResponse };
        }

        console.log("✅ Conteúdo gerado com sucesso");

        console.log("🔍 Resposta da API:", apiResponse);
        
        // Retornar resposta padronizada
        // Se a resposta da API for um array, pegue o primeiro item
        const contentArray = Array.isArray(apiResponse) ? apiResponse : [apiResponse];
        const firstContent = contentArray[0] || {};

        return c.json({
          data: {
            success: true,
            content: {
              headline: firstContent.headline || "Título gerado",
              cards: firstContent.cards || "Cartões gerados",
              links: firstContent.links || [],
              legenda: firstContent.legenda || "Legenda gerada",
            },
            metadata: {
              goal: validatedData.goal,
              format: validatedData.format,
              generatedAt: new Date().toISOString(),
              postsUsed: validatedData.selectedPosts?.length ?? 0,
            }
          }
        });

      } catch (error) {
        console.error("💥 Erro crítico na geração de conteúdo:", error);
        
        // Verificar tipo de erro
        if (error instanceof TypeError && error.message.includes("fetch")) {
          return c.json({ 
            error: "Erro de conectividade com a API de geração de conteúdo" 
          }, 503);
        }

        return c.json({ 
          error: error instanceof Error ? error.message : "Erro interno do servidor" 
        }, 500);
      }
    }
  );

export default app;