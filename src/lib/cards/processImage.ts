/**
 * Sistema otimizado de processamento de imagens
 * - Validação rápida de URLs
 * - Retorna links diretos quando possível
 * - Processamento mínimo apenas quando necessário
 */

// ✅ FUNÇÃO PRINCIPAL: Processamento inteligente e rápido
export async function processImageSmart(
  imageSource: string,
  sizeOrW: number = 120,
  h?: number,
  forceProcess: boolean = false
): Promise<string> {
  console.log(`🚀 Processamento inteligente: ${imageSource.substring(0, 50)}...`);
  
  try {
    const shouldProcess = forceProcess || !!h;

    // 1️⃣ VERIFICAÇÃO RÁPIDA: Se é uma URL válida e não precisa de processamento
    if (!shouldProcess && await isValidImageUrl(imageSource)) {
      console.log('✅ URL válida detectada, retornando diretamente');
      return imageSource;
    }
    
    // 2️⃣ VERIFICAÇÃO: Se já é base64 válido
    if (imageSource.startsWith('data:image/')) {
      console.log('✅ Base64 válido detectado, retornando diretamente');
      return imageSource;
    }
    
    // 3️⃣ SÓ PROCESSA SE NECESSÁRIO
    console.log('🔄 Processamento necessário, iniciando...');
    return await fastImageProcess(imageSource, sizeOrW, h);
    
  } catch (error) {
    console.warn('⚠️ Falha no processamento, usando fallback:', error);
    return createSimpleFallback(sizeOrW, h);
  }
}

// ✅ FUNÇÃO: Validação rápida de URL de imagem
async function isValidImageUrl(url: string): Promise<string | boolean> {
  try {
    // Verificar se é uma URL válida
    if (!url.startsWith('http')) return false;
    
    // Verificar extensão comum de imagem
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
    if (imageExtensions.test(url)) {
      console.log('📸 Extensão de imagem detectada');
      
      // Verificação rápida de conectividade (apenas HEAD request)
      const isAccessible = await quickUrlCheck(url);
      console.log(`🌐 URL acessível: ${isAccessible}`);
      if (isAccessible) {
        return url;
      }
    }
    
    // Se não tem extensão clara, fazer verificação mais profunda
    // return await deepUrlCheck(url);
    const base64 = await deepUrlCheckAndConvertToBase64(url);
    if (base64) {
      return base64;
    }
    return false;
  } catch (error) {
    console.warn('⚠️ Erro na validação de URL:', error);
    return false;
  }
}

// ✅ FUNÇÃO: Verificação rápida de URL (HEAD request)
async function quickUrlCheck(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Accept': 'image/*',
      }
    });
    
    clearTimeout(timeoutId);
    
    const contentType = response.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');
    
    console.log(`📋 Content-Type: ${contentType}, É imagem: ${isImage}`);
    return response.ok && isImage;
    
  } catch (error) {
    console.warn('⚠️ Erro no quickUrlCheck:', error);
    return false;
  }
}

async function deepUrlCheckAndConvertToBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const blob = await resp.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ✅ FUNÇÃO: Verificação profunda de URL
// async function deepUrlCheck(url: string): Promise<string> {
//   try {
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    
//     // Fazer requisição parcial para verificar o tipo
//     const response = await fetch(url, {
//       method: 'GET',
//       signal: controller.signal,
//       headers: {
//         'Range': 'bytes=0-1023', // Primeiros 1KB
//         'Accept': 'image/*',
//       }
//     });
    
//     clearTimeout(timeoutId);
    
//     if (!response.ok) return false;
    
//     const contentType = response.headers.get('content-type') || '';
//     return contentType.startsWith('image/');
    
//   } catch (error) {
//     console.warn('⚠️ Erro no deepUrlCheck:', error);
//     return false;
//   }
// }

// ✅ FUNÇÃO: Processamento rápido (sem retry desnecessário)
async function fastImageProcess(
  imageSource: string,
  sizeOrW: number,
  h?: number
): Promise<string> {
  let sourceForImageElement: string;
  let objectUrl: string | null = null; // Para limpeza posterior

  try {
    // 1. Normalizar a fonte da imagem
    if (imageSource.startsWith('data:')) {
      sourceForImageElement = imageSource;
    } else if (imageSource.startsWith('http')) {
      // ✅ CORREÇÃO PRINCIPAL: Usar fetch para contornar problemas de CORS.
      // Primeiro, buscamos a imagem como um "blob" (dados binários).
      console.log('🔄 Buscando imagem via fetch para evitar CORS...');
      const response = await fetch(imageSource);
      if (!response.ok) {
        throw new Error(`Falha ao buscar imagem, status: ${response.status}`);
      }
      const imageBlob = await response.blob();
     
      // Em seguida, criamos uma URL temporária local para este blob.
      // Esta URL não é "cross-origin", então podemos usá-la no canvas.
      objectUrl = URL.createObjectURL(imageBlob);
      sourceForImageElement = objectUrl;
      console.log('✅ Imagem carregada em uma URL de objeto local.');
     
    } else {
      // Base64 puro
      const mimeType = detectMimeTypeFast(imageSource);
      sourceForImageElement = `data:${mimeType};base64,${imageSource}`;
    }

    // 2. Carregar a imagem (agora de uma fonte segura) com timeout
    const img = await loadImageFast(sourceForImageElement, 5000);
   
    // 3. Verificar se as dimensões estão OK
    const needsResize = needsResizing(img, sizeOrW, h);
   
    if (!needsResize) {
      console.log('✅ Imagem já tem bom tamanho, retornando original');
      // Se a imagem original já serve, podemos tentar retornar a URL original se possível,
      // ou converter o blob para base64 se for a única opção.
      if (imageSource.startsWith('http')) {
         // Para evitar conversões desnecessárias, podemos retornar a URL original se ela for acessível
         // ou converter o blob que já temos para base64. Vamos converter por segurança.
         return await blobToBase64(await (await fetch(imageSource)).blob());
      }
      return sourceForImageElement;
    }
   
    // 4. Processar (redimensionar/cortar) apenas se necessário
    console.log('🔄 Redimensionando a imagem...');
    return await quickResize(img, sizeOrW, h);

  } finally {
    // 5. Limpeza importante!
    // Revoga a URL do objeto para liberar memória do navegador.
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      console.log('🗑️ URL de objeto local liberada.');
    }
  }
}

// Função auxiliar para converter blob para base64 (pode ser útil)
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
}

// ✅ FUNÇÃO: Detecção rápida de MIME type
function detectMimeTypeFast(base64: string): string {
  const first4 = base64.substring(0, 4);
  
  if (first4.startsWith('/9j/') || first4.startsWith('9j/')) return 'image/jpeg';
  if (first4.startsWith('iVBO')) return 'image/png';
  if (first4.startsWith('UklG')) return 'image/webp';
  if (first4.startsWith('R0lG')) return 'image/gif';
  
  return 'image/jpeg'; // fallback rápido
}

// ✅ FUNÇÃO: Carregamento rápido de imagem
async function loadImageFast(src: string, timeout: number = 5000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout de ${timeout}ms atingido`));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Falha ao carregar imagem'));
    };
    
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

// ✅ FUNÇÃO: Verificar se precisa redimensionar
function needsResizing(img: HTMLImageElement, targetW: number, targetH?: number): boolean {
  const maxDiff = 0.1; // 10% de tolerância
  
  if (targetH) {
    // Imagem retangular
    const wDiff = Math.abs(img.naturalWidth - targetW) / targetW;
    const hDiff = Math.abs(img.naturalHeight - targetH) / targetH;
    return wDiff > maxDiff || hDiff > maxDiff;
  } else {
    // Imagem quadrada
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    const diff = Math.abs(size - targetW) / targetW;
    return diff > maxDiff;
  }
}

// ✅ FUNÇÃO: Redimensionamento rápido (sem Pica se não necessário)
async function quickResize(
  img: HTMLImageElement,
  sizeOrW: number,
  h?: number
): Promise<string> {
  const targetW = sizeOrW;
  const targetH = h || sizeOrW;
  const isSquare = !h;
  
  // Canvas simples para redimensionamento básico
  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Falha ao obter contexto 2D");
  
  // Calcular crop central
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  
  if (isSquare) {
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    sx = (img.naturalWidth - size) / 2;
    sy = (img.naturalHeight - size) / 2;
    sw = sh = size;
  }
  
  // Aplicar máscara circular se necessário
  if (isSquare) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(targetW / 2, targetH / 2, targetW / 2, 0, Math.PI * 2);
    ctx.clip();
  }
  
  // Desenhar com boa qualidade
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
  
  if (isSquare) {
    ctx.restore();
  }
  
  // Converter para data URL
  const blob = await canvas.convertToBlob({ 
    type: "image/png",
    quality: 0.8 // Qualidade boa mas não máxima para velocidade
  });
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao converter'));
    reader.readAsDataURL(blob);
  });
}

// ✅ FUNÇÃO: Fallback simples e rápido
export function createSimpleFallback(sizeOrW: number, h?: number): string {
  const isSquare = !h;
  const width = sizeOrW;
  const height = h || sizeOrW;
  
  // ✅ SOLUÇÃO 1: SVG direto sem encoding (mais rápido e seguro)
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#d1d5db;stop-opacity:1" />
      </linearGradient>
    </defs>
    ${isSquare 
      ? `<circle cx="${width/2}" cy="${height/2}" r="${width/2}" fill="url(#grad)"/>
         <text x="${width/2}" y="${height/2}" text-anchor="middle" dominant-baseline="middle" 
               font-family="sans-serif" font-size="${width*0.3}" fill="#9ca3af">?</text>`
      : `<rect width="${width}" height="${height}" fill="url(#grad)"/>
         <text x="${width/2}" y="${height/2}" text-anchor="middle" dominant-baseline="middle" 
               font-family="sans-serif" font-size="${Math.min(width,height)*0.2}" fill="#9ca3af">IMG</text>`
    }
  </svg>`;
  
  // ✅ CORREÇÃO: Usar encodeURIComponent em vez de btoa
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ✅ EXEMPLO DE USO OTIMIZADO:
async function createPostImageOptimized(link: string, fabricTemplate: any, padding: number = 20) {
  console.log(`🖼️ Criando imagem de post: ${link.substring(0, 50)}...`);
  
  try {
    // ⚡ PROCESSAMENTO SUPER RÁPIDO
    const processedImageSrc = await processImageSmart(
      link,
      800,  // largura
      435,  // altura
      false // não forçar processamento
    );

    const postImage = {
      type: "image",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 752.5 + padding,
      top: -215.5 + 750,
      width: 800,
      height: 435,
      fill: "rgb(0,0,0)",
      stroke: null,
      strokeWidth: 0,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: null,
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      selectable: true,
      hasControls: true,
      src: processedImageSrc, // ✅ URL direta ou base64 processado
      crossOrigin: "anonymous",
      filters: [],
    };
    
    fabricTemplate.objects.push(postImage);
    console.log('✅ Imagem de post criada rapidamente');
    
  } catch (error) {
    console.error('❌ Falha ao criar imagem:', error);
    
    // Fallback super simples
    const fallbackSrc = createSimpleFallback(800, 435);
    
    const placeholderImage = {
      type: "image",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 752.5 + padding,
      top: -215.5 + 750,
      width: 800,
      height: 435,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      selectable: true,
      hasControls: true,
      src: fallbackSrc,
      crossOrigin: "anonymous",
    };
    
    fabricTemplate.objects.push(placeholderImage);
    console.log('📦 Fallback SVG adicionado');
  }

  return fabricTemplate;
}

// ✅ FUNÇÃO PARA PERFIL (também otimizada)
async function createProfileImageOptimized(imageSource: string, size: number = 120): Promise<string> {
  return await processImageSmart(imageSource, size, undefined, true); // forçar processamento circular
}