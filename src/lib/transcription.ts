'use server'

import { GoogleGenAI, createUserContent } from "@google/genai";
import { InstagramPost } from "@/content/crawler";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

class FileTooLargeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FileTooLargeError";
    }
}

interface TranscriptionResult {
    success: boolean;
    transcriptions: Record<string, string[]>;
    failedPosts: string[];
    errors?: string[];
}

interface TranscriptionProgress {
    completed: number;
    total: number;
    currentPost?: string;
}

async function fetchAndConvertToBase64(url: string) {
    const head = await fetch(url, { method: "HEAD" });
    if (!head.ok) {
        throw new Error(`Erro ao acessar cabeçalho do arquivo: ${url}`);
    }

    const contentLength = head.headers.get("content-length");
    const contentType = head.headers.get("content-type") || "";

    if (
        !contentType.startsWith("image/") &&
        !contentType.startsWith("video/")
    ) {
        throw new Error(`Tipo de conteúdo inválido: ${contentType}`);
    }

    if (contentLength && Number(contentLength) > 20 * 1024 * 1024) {
        throw new FileTooLargeError(
            `Arquivo muito grande (${(Number(contentLength) / 1024 / 1024).toFixed(2)} MB).`,
        );
    }

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Erro ao baixar arquivo: ${url}`);
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mimeType: contentType };
}

async function transcribeMedia(imageUrl?: string, videoUrl?: string): Promise<string | null> {
    const MAX_ATTEMPTS = 3;
    const DELAY_BETWEEN_ATTEMPTS = 1000;
    
    if (!imageUrl && !videoUrl) {
        return null;
    }

    let attempt = 0;
    
    while (attempt < MAX_ATTEMPTS) {
        attempt++;
        try {
            const parts: Array<
                | { inlineData: { mimeType: string; data: string } }
                | { text: string }
            > = [];

            if (imageUrl) {
                const base64Image = await fetchAndConvertToBase64(imageUrl);
                
                parts.push({
                    inlineData: {
                        mimeType: base64Image.mimeType,
                        data: base64Image.base64,
                    },
                });

                parts.push({
                    text: `<system_prompt>
VOCÊ É UM ANALISTA VISUAL ALTAMENTE TREINADO, ESPECIALISTA EM DESCRIÇÃO DE IMAGENS, ANÁLISE DE ELEMENTOS VISUAIS, INTERPRETAÇÃO DE EMOÇÕES, E DETALHES TÉCNICOS DE PRODUÇÃO. SUA MISSÃO É REALIZAR UMA ANÁLISE EXCEPCIONALMENTE DETALHADA, OBJETIVA E ORGANIZADA DE UMA IMAGEM FORNECIDA.

### INSTRUÇÕES ###

- DESCREVA COM MÁXIMA PRECISÃO:
  - ELEMENTOS VISUAIS PRINCIPAIS (ex.: pessoas, objetos, animais, paisagens, símbolos)
  - EMOÇÕES PERCEBIDAS nas expressões corporais e faciais (ex.: felicidade, concentração, tensão)
  - CENÁRIO E AMBIENTE (ex.: interno, externo, natureza, cidade, estúdio, fundo neutro)
  - ESTILO VISUAL (ex.: paleta de cores predominantes, tipo e intensidade da iluminação, atmosfera da imagem, qualidade e estilo da captura - amadora, profissional, artística)

- REALIZE UMA ANÁLISE TÉCNICA:
  - QUALIDADE DA IMAGEM (ex.: nítida, desfocada, pixelada)
  - ILUMINAÇÃO (ex.: natural, artificial, luz suave, luz dura)
  - COMPOSIÇÃO (ex.: regra dos terços, centralização, uso de profundidade)
  - TIPOS DE PLANO E ENQUADRAMENTO (ex.: close-up, plano geral, plongée, contra-plongée)
  - EDIÇÃO E PÓS-PRODUÇÃO (ex.: filtros aplicados, retoques, manipulação digital)

- FAÇA UMA ANÁLISE DA MENSAGEM E PROPÓSITO:
  - IDENTIFIQUE a MENSAGEM OU TEMA CENTRAL sugerido pela imagem
  - DESCREVA o TOM E A ESTRATÉGIA VISUAL utilizada (ex.: emocional, comercial, institucional, artística)
  - DETECTE INDÍCIOS DE INTENÇÃO COMUNICATIVA (ex.: chamada à ação implícita, sensibilização, promoção)

### CAUTELAS ESSENCIAIS ###

- BASEIE-SE EXCLUSIVAMENTE no que está visível na imagem
- NÃO FAÇA SUPOSIÇÕES SOBRE CONTEXTO EXTERNO ou INTENÇÕES NÃO VISUALMENTE EVIDENTES
- EVITE INTERPRETAÇÕES SUBJETIVAS ou JULGAMENTOS PESSOAIS sobre estética ou qualidade artística
- DESCREVA DETALHADAMENTE TODOS OS ELEMENTOS RELEVANTES, mesmo os aparentemente secundários
</system_prompt>`,
                });
            } else if (videoUrl) {
                const base64Video = await fetchAndConvertToBase64(videoUrl);
                
                parts.push({
                    inlineData: {
                        mimeType: base64Video.mimeType,
                        data: base64Video.base64,
                    },
                });

                parts.push({
                    text: `<system_prompt>
VOCÊ É UM ANALISTA DE VÍDEOS ALTAMENTE TREINADO, ESPECIALISTA EM TRANSCRIÇÃO, DESCRIÇÃO VISUAL, ANÁLISE DE ÁUDIO, MENSAGEM, E DETALHES TÉCNICOS. SUA MISSÃO É REALIZAR UMA ANÁLISE EXCEPCIONALMENTE DETALHADA, OBJETIVA E ORGANIZADA DE UM VÍDEO FORNECIDO.

### INSTRUÇÕES ###

- EXECUTE uma TRANSCRIÇÃO COMPLETA do vídeo, INCLUINDO:
  - MARCAÇÃO PRECISA DE TEMPO (timestamps a cada 5 segundos ou a cada troca de fala/cena)
  - IDENTIFICAÇÃO DO TOM DE VOZ de cada fala (ex.: alegre, sério, tenso, calmo)

- DESCREVA com RIGOR VISUAL:
  - EMOÇÕES PERCEBIDAS nas expressões corporais e faciais (ex.: felicidade, concentração, tensão)
  - CENÁRIO E AMBIENTE (ex.: interno, externo, natureza, cidade, ginásio, estúdio, etc.)
  - ESTILO VISUAL (ex.: paleta de cores predominantes, tipo e intensidade de iluminação, atmosfera do local, qualidade e estilo da gravação - amadora, profissional, documental)

- REALIZE UMA ANÁLISE DE ÁUDIO:
  - QUALIDADE do áudio (ex.: limpo, com ruído, distorcido)
  - ELEMENTOS SONOROS presentes (ex.: música de fundo, efeitos sonoros, ruídos ambientes)
  - VOLUME e CLAREZA da fala e trilha sonora

- FAÇA UMA ANÁLISE DE COPY/MENSAGEM:
  - IDENTIFIQUE os PRINCIPAIS PONTOS da mensagem verbal
  - DESCREVA o TOM e a ESTRATÉGIA DE COMUNICAÇÃO (ex.: persuasivo, informativo, emocional, institucional)
  - DETECTE CHAMADAS À AÇÃO (se houver)

- ESTRUTURE O DESENVOLVIMENTO DO VÍDEO:
  - RELATE CRONOLOGICAMENTE a SEQUÊNCIA DE ACONTECIMENTOS
  - DETALHE o QUE ACONTECE em cada momento-chave
  - FAÇA UM MAPEAMENTO DA EVOLUÇÃO VISUAL e NARRATIVA
</system_prompt>`,
                });
            }

            const result = await genAI.models.generateContent({
                model: "gemini-2.0-flash-lite",
                contents: createUserContent(parts),
            });

            const text = result.text;
            
            if (text) {
                return text;
            } else {
                throw new Error("Resposta sem transcrição");
            }
            
        } catch (error: any) {
            console.error(`Erro ao transcrever (tentativa ${attempt}):`, error);
            
            if (error instanceof FileTooLargeError) {
                return "Arquivo muito grande para transcrição.";
            }

            if (attempt < MAX_ATTEMPTS) {
                await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_ATTEMPTS));
            }
        }
    }

    return null;
}

function normalizePostMedia(post: InstagramPost) {
    const images: string[] = [];
    let video: string | undefined = undefined;

    if (post?.reel) {
        return { images, video: post.videoURL };
    }

    if (post?.images?.length === 1) {
        if (post.images[0]) {
            images.push(post.images[0]);
        }
    } else if (post?.images?.length > 1) {
        for (const photo of post.images) {
            if (photo) {
                images.push(photo);
            }
        }
    }

    return { images, video };
}

export async function transcribePosts(
    posts: InstagramPost[],
    batchSize: number = 3,
    onProgress?: (progress: TranscriptionProgress) => void
): Promise<TranscriptionResult> {
    console.log("📄 Iniciando transcrição de posts:", posts.length);
    
    if (posts.length === 0) {
        console.warn("Nenhum post selecionado para transcrição.");
        return {
            success: false,
            transcriptions: {},
            failedPosts: [],
            errors: ["Nenhum post selecionado para transcrição."],
        };
    }

    console.log("📄 Posts selecionados para transcrição:", posts.map((p) => p.url).join(", "));

    const transcriptionResults: Record<string, string[]> = {};
    const failed: string[] = [];
    const errors: string[] = [];
    let completed = 0;

    // Processa em batches para evitar sobrecarga
    for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        const batchPromises = batch.map(async (post) => {
            try {
                onProgress?.({ 
                    completed, 
                    total: posts.length, 
                    currentPost: post.url 
                });

                const { images, video } = normalizePostMedia(post);
                const postTranscriptions: string[] = [];

                if (video) {
                    const transcription = await transcribeMedia(undefined, video);
                    if (transcription && transcription !== "Arquivo muito grande para transcrição.") {
                        postTranscriptions.push(transcription);
                    } else {
                        failed.push(post.url);
                        if (transcription === "Arquivo muito grande para transcrição.") {
                            errors.push(`Post ${post.url}: Arquivo de vídeo muito grande`);
                        } else {
                            errors.push(`Post ${post.url}: Falha na transcrição do vídeo`);
                        }
                    }
                } else if (images.length > 0) {
                    for (const imageUrl of images) {
                        const transcription = await transcribeMedia(imageUrl, undefined);
                        if (transcription && transcription !== "Arquivo muito grande para transcrição.") {
                            postTranscriptions.push(transcription);
                        } else {
                            console.warn(`Imagem falhou: ${imageUrl}`);
                            if (transcription === "Arquivo muito grande para transcrição.") {
                                errors.push(`Post ${post.url}: Imagem muito grande - ${imageUrl}`);
                            }
                        }
                    }
                } else {
                    console.warn(`Post sem mídia utilizável: ${post.url}`);
                    failed.push(post.url);
                    errors.push(`Post ${post.url}: Sem mídia utilizável`);
                }

                if (postTranscriptions.length > 0) {
                    transcriptionResults[post.url] = postTranscriptions;
                } else if (!failed.includes(post.url)) {
                    failed.push(post.url);
                    errors.push(`Post ${post.url}: Nenhuma transcrição obtida`);
                }

                completed++;
                onProgress?.({ completed, total: posts.length });

            } catch (error: any) {
                console.error(`Erro ao processar post ${post.url}:`, error);
                failed.push(post.url);
                errors.push(`Post ${post.url}: ${error.message}`);
                completed++;
                onProgress?.({ completed, total: posts.length });
            }
        });

        // Aguarda o batch atual antes de processar o próximo
        await Promise.all(batchPromises);
    }

    const success = Object.keys(transcriptionResults).length > 0;

    console.log(`✅ Transcrição concluída. Sucessos: ${Object.keys(transcriptionResults).length}, Falhas: ${failed.length}`);

    return {
        success,
        transcriptions: transcriptionResults,
        failedPosts: failed,
        errors: errors.length > 0 ? errors : undefined,
    };
}