// 🚀 FUNÇÃO MELHORADA - Suporta múltiplos formatos de texto
export const processCarouselContent = (content: any, options: {
  maxCards?: number;
  unlimited?: boolean;
} = {}): string[] => {
  const { 
    maxCards = 15, 
    unlimited = false 
  } = options;
  
  const cards: string[] = [];

  // 1. Adicionar headline como primeiro card
  if (content.headline && content.headline.trim()) {
    cards.push(content.headline.trim());
  }

  // 2. Processar os cards do conteúdo com múltiplas estratégias
  if (content.cards && typeof content.cards === 'string') {
    let rawText = content.cards.trim();
    
    // 🎯 ESTRATÉGIA 1: Detectar se o texto já vem com separadores "texto X -"
    const hasTextPattern = /texto\s+\d+\s*[-–—]\s*/i.test(rawText);
    
    let cardsText: string[] = [];
    
    if (hasTextPattern) {
      // ✂️ CASO 1: Texto com padrão "texto X -" 
      cardsText = rawText
        .split(/(?=texto\s+\d+\s*[-–—]\s*)/i) // Split no início de cada "texto X -"
        .map(chunk => chunk.trim())
        .filter(chunk => chunk.length > 0)
        .map(chunk => {
          // Remove o prefixo "texto X -"
          return chunk.replace(/^texto\s+\d+\s*[-–—]\s*/i, '').trim();
        });
    } else {
      // ✂️ CASO 2: Texto livre - tentar detectar separadores naturais
      
      // Detectar padrões de numeração/bullets
      const hasNumbering = /^\d+[\.\)]\s+/m.test(rawText);
      const hasBullets = /^[-–—•*]\s+/m.test(rawText);
      const hasDoubleLineBreaks = /\n\s*\n/.test(rawText);
      
      if (hasNumbering) {
        // Split por numeração (1. 2. 3. ou 1) 2) 3))
        cardsText = rawText
          .split(/(?=^\d+[\.\)]\s+)/m)
          .map(chunk => chunk.trim())
          .filter(chunk => chunk.length > 0)
          .map(chunk => chunk.replace(/^\d+[\.\)]\s+/, '').trim());
          
      } else if (hasBullets) {
        // Split por bullets (- • * etc)
        cardsText = rawText
          .split(/(?=^[-–—•*]\s+)/m)
          .map(chunk => chunk.trim())
          .filter(chunk => chunk.length > 0)
          .map(chunk => chunk.replace(/^[-–—•*]\s+/, '').trim());
          
      } else if (hasDoubleLineBreaks) {
        // Split por dupla quebra de linha (parágrafos)
        cardsText = rawText
          .split(/\n\s*\n/)
          .map(chunk => chunk.trim())
          .filter(chunk => chunk.length > 0);
          
      } else {
        // ✂️ CASO 3: Texto corrido - dividir por frases/sentenças
        cardsText = smartSentenceSplit(rawText);
      }
    }

    // 🧹 LIMPEZA FINAL - aplicar a todos os casos
    const cleanedCards = cardsText
      .map(text => text.trim())
      .filter(text => text.length > 15) // Aumentei de 10 para 15 caracteres
      .map(text => {
        // Limpar restos de formatação
        return text
          .replace(/^[-–—•*]\s*/, '') // Remove bullets restantes
          .replace(/^\d+[\.\)]\s*/, '') // Remove numeração restante
          .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
          .trim();
      })
      .filter(text => text.length > 15); // Filtro final

    cards.push(...cleanedCards);
  }

  // ✅ VALIDAÇÃO: Garantir que temos pelo menos 1 card
  if (cards.length === 0) {
    cards.push('Conteúdo do carrossel');
  }

  // 🔧 AJUSTE: Limite mais flexível baseado no conteúdo
  let finalCards = cards;
  
  if (!unlimited && cards.length > maxCards) {
    console.warn(`⚠️ Muitos cards detectados (${cards.length}). Selecionando os ${maxCards} melhores.`);
    
    // Ordenar por qualidade/tamanho e pegar os melhores
    finalCards = cards
      .map((card, index) => ({
        content: card,
        originalIndex: index,
        score: calculateCardScore(card, index)
      }))
      .sort((a, b) => b.score - a.score) // Maior score primeiro
      .slice(0, maxCards)
      .sort((a, b) => a.originalIndex - b.originalIndex) // Restaurar ordem original
      .map(item => item.content);
  }

  console.log(`📝 Processados ${finalCards.length} cards (${unlimited ? 'sem limite' : `máx: ${maxCards}`}):`, 
    finalCards.map((c, i) => `${i + 1}. ${c.substring(0, 50)}...`)
  );

  return finalCards;
};

// 🧠 FUNÇÃO AUXILIAR: Calcular qualidade do card
function calculateCardScore(card: string, index: number): number {
  let score = 0;
  
  // Pontuação base por tamanho (cards muito curtos ou muito longos perdem pontos)
  const length = card.length;
  if (length >= 50 && length <= 300) {
    score += 10; // Tamanho ideal
  } else if (length >= 30 && length <= 400) {
    score += 7; // Tamanho aceitável
  } else if (length < 30) {
    score += 2; // Muito curto
  } else {
    score += 5; // Muito longo
  }
  
  // Pontuação por posição (primeiros cards são mais importantes)
  if (index <= 2) score += 5; // Primeiros 3 cards
  else if (index <= 5) score += 3; // Cards intermediários
  else score += 1; // Cards finais
  
  // Pontuação por conteúdo
  if (card.includes('?') || card.includes('!')) score += 2; // Perguntas/exclamações são engajantes
  if (/\b(como|por que|qual|quando|onde)\b/i.test(card)) score += 3; // Palavras questionadoras
  if (/\b(dica|segredo|método|estratégia|passo)\b/i.test(card)) score += 2; // Palavras de valor
  
  // Penalizar repetição de palavras muito comum
  const commonWords = ['o', 'a', 'de', 'para', 'com', 'em', 'é', 'do', 'da'];
  const wordCount = card.split(' ').length;
  const uniqueWords = new Set(card.toLowerCase().split(' ').filter(w => !commonWords.includes(w))).size;
  const diversity = uniqueWords / wordCount;
  score += Math.floor(diversity * 5); // Bonificação por diversidade de vocabulário
  
  return score;
}
function smartSentenceSplit(text: string): string[] {
  // Dividir por pontos, exclamações, interrogações, mas preservar abreviações
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÊÇÕ])/) // Split após pontuação + espaço + letra maiúscula
    .map(s => s.trim())
    .filter(s => s.length > 20); // Sentenças muito curtas são ignoradas
  
  // Se as sentenças ficaram muito longas, tentar agrupar em chunks menores
  const chunks: string[] = [];
  
  for (const sentence of sentences) {
    if (sentence.length > 200) {
      // Quebrar sentenças muito longas em vírgulas ou pontos e vírgulas
      const subChunks = sentence
        .split(/[,;]\s+/)
        .reduce((acc: string[], chunk, index, array) => {
          if (chunk.length > 100) {
            acc.push(chunk.trim());
          } else {
            // Agrupar chunks pequenos
            const lastIndex = acc.length - 1;
            if (lastIndex >= 0 && (acc[lastIndex].length + chunk.length) < 180) {
              acc[lastIndex] += ', ' + chunk.trim();
            } else {
              acc.push(chunk.trim());
            }
          }
          return acc;
        }, []);
      
      chunks.push(...subChunks);
    } else {
      chunks.push(sentence);
    }
  }
  
  return chunks.filter(chunk => chunk.length > 15);
}

// 🧪 TESTE COM SEU EXEMPLO:
const exemploTexto = `O SEGREDO POR TRÁS DE CRIANÇAS QUE AMAM ROCK A REVOLUÇÃO SILENCIOSAtexto 1 - Seu filho ignora o rock autêntico?texto 2 - A maioria dos pais falha ao apresentar esse universo musical.texto 3 - Desvendamos por que a energia autêntica do rock é vital para o crescimento infantil, indo além de ritmos e formando mentes curiosas.texto 4 - Não é só volume; é a estrutura melódica e lírica que ativa um fascínio primitivo e duradouro na criança.texto 5 - Muitos educadores subestimam o rock como ensino. Focam só em gêneros 'infantis', limitando a cultura. Erram ao não explorar a riqueza e variedade de subgêneros. Perdem a chance de formar senso crítico. É uma perda de mente e criatividade, afastando crianças de um legado que define gerações e move a expressão. A prova é clara: adultos crescem mais conscientes ouvindo rock.texto 6 - Mas existe um método testado e comprovado para essa imersão.texto 7 - Comece com os pilares. Queen e The Beatles, por exemplo, dão melodias vician`;

// RESULTADO ESPERADO:
// [
//   "O SEGREDO POR TRÁS DE CRIANÇAS QUE AMAM ROCK A REVOLUÇÃO SILENCIOSA",
//   "Seu filho ignora o rock autêntico?",
//   "A maioria dos pais falha ao apresentar esse universo musical.",
//   "Desvendamos por que a energia autêntica do rock é vital para o crescimento infantil, indo além de ritmos e formando mentes curiosas.",
//   "Não é só volume; é a estrutura melódica e lírica que ativa um fascínio primitivo e duradouro na criança.",
//   "Muitos educadores subestimam o rock como ensino. Focam só em gêneros 'infantis', limitando a cultura. Erram ao não explorar a riqueza e variedade de subgêneros.",
//   "Mas existe um método testado e comprovado para essa imersão.",
//   "Comece com os pilares. Queen e The Beatles, por exemplo, dão melodias vician"
// ]