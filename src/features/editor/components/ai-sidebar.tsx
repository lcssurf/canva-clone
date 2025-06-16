import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolSidebarClose } from '@/features/editor/components/tool-sidebar-close';
import { ToolSidebarHeader } from '@/features/editor/components/tool-sidebar-header';
import { 
  ChevronDown, 
  ChevronRight, 
  Instagram, 
  Target, 
  Users, 
  MessageSquare, 
  FileText,
  Loader2,
  Check,
  Copy,
  RefreshCw,
  RotateCcw,
  Image,
  Video,
  Grid3X3,
  X
} from 'lucide-react';
import { 
  ActiveTool
} from "@/features/editor/types";
import { cn } from "@/lib/utils";

// --- Tipos Aprimorados ---

// Interfaces de Dados
interface BlogArticle {
  url: string;
  title: string;
  content: string;
  publishDate?: string;
}

interface InstagramPost {
  url: string;
  images: string[];
  reel?: boolean;
  videoURL?: string;
  transcription?: string;
  likes?: number;
  datetime?: string;
}

interface Profile {
  username: string;
  followers?: number;
  profile_image_link?: string;
  profile_url?: string;
  posts_count?: number;
  biography?: string;
}

interface BlogData {
  url: string;
  domain: string;
}

// União Discriminada para Fontes de Dados (mais seguro que `data: any`)
type SourceData = 
  | {
      id: string;
      type: 'instagram';
      data: Profile;
      posts?: InstagramPost[];
    }
  | {
      id: string;
      type: 'blog';
      data: BlogData;
      articles?: BlogArticle[];
    };


// Props do Componente Principal
interface AiSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  generatedContent: string | null;
  setGeneratedContent: (content: string | null) => void;
}

// --- Constantes com Tipagem Estrita (`as const`) ---

const GOALS = [
  { label: 'Aumentar autoridade', value: 'autoridade', emoji: '🏆' },
  { label: 'Gerar engajamento', value: 'engajamento', emoji: '💬' },
  { label: 'Atrair clientes', value: 'clientes', emoji: '🎯' },
  { label: 'Educar / Informar', value: 'educar', emoji: '📚' },
  { label: 'Vender algo', value: 'venda', emoji: '💰' }
] as const;

const TONES = [
  { label: 'Profissional', value: 'profissional', emoji: '🧠' },
  { label: 'Engraçado', value: 'engracado', emoji: '😄' },
  { label: 'Inspirador', value: 'inspirador', emoji: '✨' },
  { label: 'Direto e provocador', value: 'provocador', emoji: '🔥' },
  { label: 'Acolhedor', value: 'acolhedor', emoji: '💬' }
] as const;

const FORMATS = [
  { label: 'Texto para carrossel', value: 'carrossel', featured: true, emoji: '📱' },
  { label: 'Roteiro para Reels', value: 'reels', emoji: '🎬' }
] as const;

// --- Tipos Derivados das Constantes ---
type GoalValue = typeof GOALS[number]['value'];
type ToneValue = typeof TONES[number]['value'];
type FormatValue = typeof FORMATS[number]['value'];

const STEPS = ['sources', 'posts', 'goal', 'niche', 'audience', 'subject', 'tone', 'format'] as const;
type SectionName = typeof STEPS[number];


// --- Componentes Filhos com Tipagem Corrigida ---

// Sources Manager Component
const SourcesManager: React.FC<{
  sources: SourceData[];
  onAddInstagram: (username: string) => void;
  onAddBlog: (url: string) => void;
  onRemove: (sourceId: string) => void;
  loading: boolean;
  maxSources: number;
}> = ({ sources, onAddInstagram, onAddBlog, onRemove, loading, maxSources }) => {
  const [activeTab, setActiveTab] = useState<'instagram' | 'blog'>('instagram');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [blogUrl, setBlogUrl] = useState('');

  const handleAddInstagram = () => {
    if (instagramUsername.trim()) {
      onAddInstagram(instagramUsername);
      setInstagramUsername('');
    }
  };

  const handleAddBlog = () => {
    if (blogUrl.trim()) {
      onAddBlog(blogUrl);
      setBlogUrl('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Sources List */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Fontes adicionadas ({sources.length}/{maxSources}):</p>
          {sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {source.type === 'instagram' ? (
                  <Instagram className="w-4 h-4 text-pink-600" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {source.type === 'instagram' 
                      ? `@${source.data.username}` 
                      : source.data.domain
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {source.type === 'instagram' 
                      ? `${source.posts?.length || 0} posts`
                      : `${source.articles?.length || 0} artigos`
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(source.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Source */}
      {sources.length < maxSources && (
        <div className="space-y-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeTab === 'instagram' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('instagram')}
            >
              <Instagram className="w-4 h-4 mr-2" />
              Instagram
            </Button>
            <Button
              variant={activeTab === 'blog' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('blog')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Blog/Site
            </Button>
          </div>

          {activeTab === 'instagram' && (
            <div className="space-y-3">
              <Input
                placeholder="@perfil_instagram"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                disabled={loading}
              />
              <Button
                className="w-full"
                onClick={handleAddInstagram}
                disabled={loading || !instagramUsername.trim()}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Adicionar Instagram
              </Button>
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="space-y-3">
              <Input
                placeholder="https://blog.exemplo.com"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                disabled={loading}
              />
              <Button
                className="w-full"
                onClick={handleAddBlog}
                disabled={loading || !blogUrl.trim()}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Adicionar Blog
              </Button>
            </div>
          )}
        </div>
      )}

      {sources.length >= maxSources && (
        <p className="text-xs text-gray-500 text-center">
          Limite máximo de {maxSources} fontes atingido
        </p>
      )}
    </div>
  );
};

// Tipo `ContentItem` reutilizando tipos existentes
type ContentItem = 
  | (InstagramPost & { sourceId: string; type: 'post'; title: string; })
  | (BlogArticle & { sourceId: string; type: 'article'; });

// Content Selector Component
const ContentSelector: React.FC<{
  sources: SourceData[];
  selectedPosts: string[];
  onSelectionChange: (posts: string[]) => void;
  onContinue: () => void;
}> = ({ sources, selectedPosts, onSelectionChange, onContinue }) => {
  
  const allContent: ContentItem[] = sources.flatMap(source => {
    if (source.type === 'instagram') {
      return (source.posts ?? []).map(post => ({
        ...post,
        sourceId: source.id,
        type: 'post' as const,
        title: post.transcription?.substring(0, 80) || 'Post do Instagram',
      }));
    } else {
      return (source.articles ?? []).map(article => ({
        ...article,
        sourceId: source.id,
        type: 'article' as const,
      }));
    }
  });

  const toggleSelection = (url: string) => {
    const newSelection = selectedPosts.includes(url)
      ? selectedPosts.filter(p => p !== url)
      : selectedPosts.length < 6 
        ? [...selectedPosts, url]
        : selectedPosts;
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Selecione até 6 conteúdos para usar como referência ({selectedPosts.length}/6)
      </p>

      <ScrollArea className="h-80 pr-4">
        <div className="grid grid-cols-1 gap-3">
          {allContent.map((content) => {
            const isSelected = selectedPosts.includes(content.url);
            const sourceData = sources.find(s => s.id === content.sourceId);
            
            return (
              <div
                key={content.url}
                onClick={() => toggleSelection(content.url)}
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md",
                  isSelected 
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start gap-3">
                  {content.type === 'post' && content.images?.length > 0 && (
                    <img
                      src={content.images[0] || "/placeholder.svg"}
                      alt="Post"
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {content.type === 'post' ? (
                        <Instagram className="w-4 h-4 text-pink-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                      <p className="text-xs text-gray-500 truncate">
                        {sourceData?.type === 'instagram' 
                          ? `@${sourceData.data.username}` 
                          : sourceData?.data.domain || 'Blog'}
                      </p>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">
                      {content.title || 'Sem título'}
                    </p>
                    {content.type === 'article' && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                        {content.content}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <Button
        className="w-full"
        onClick={onContinue}
        disabled={selectedPosts.length === 0}
      >
        Analisar Conteúdo ({selectedPosts.length} selecionados)
      </Button>
    </div>
  );
};


// Expandable Section Component
const ExpandableSection: React.FC<{
  title: string;
  icon: React.ElementType; // Mais flexível e seguro que ComponentType<any>
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  completed?: boolean;
  required?: boolean;
  autoFocus?: boolean;
}> = ({ title, icon: Icon, children, expanded, onToggle, completed = false, required = false, autoFocus = false }) => {
  return (
    <Card className={cn(
      "w-full transition-all duration-200",
      autoFocus && !completed && "ring-2 ring-blue-500 shadow-lg",
      completed && "bg-green-50 border-green-200"
    )}>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-all duration-200",
              completed ? 'bg-green-100 text-green-600' : 'bg-gray-100',
              autoFocus && !completed && "bg-blue-100 text-blue-600"
            )}>
              {completed ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className={cn(
                "text-base transition-colors",
                completed && "text-green-700",
                autoFocus && !completed && "text-blue-700"
              )}>{title}</CardTitle>
              {required && !completed && <p className="text-xs text-red-500 animate-pulse">● Obrigatório</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {completed && <Badge variant="secondary" className="bg-green-100 text-green-700">Concluído</Badge>}
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 p-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
};


// --- Componente Principal com Estados Tipados ---
export const AiSidebar: React.FC<AiSidebarProps> = ({
  activeTool,
  onChangeActiveTool,
  generatedContent,
  setGeneratedContent,
}) => {
  // State management com tipos precisos
  const [expandedSections, setExpandedSections] = useState<Partial<Record<SectionName, boolean>>>({ sources: true });
  const [loading, setLoading] = useState<Partial<Record<SectionName, boolean>>>({});
  const [completed, setCompleted] = useState<Partial<Record<SectionName, boolean>>>({});

  // Form state com tipos literais
  const [sources, setSources] = useState<SourceData[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [goal, setGoal] = useState<GoalValue | ''>('');
  const [niche, setNiche] = useState('');
  const [audience, setAudience] = useState('');
  const [subject, setSubject] = useState('');
  const [tone, setTone] = useState<ToneValue[]>([]);
  const [format, setFormat] = useState<FormatValue | ''>('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Current focus tracking
  const [currentFocus, setCurrentFocus] = useState<SectionName>('sources');

  // Helper functions
  const toggleSection = (section: SectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const setLoadingState = (key: SectionName, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const setCompletedState = (key: SectionName, value: boolean) => {
    setCompleted(prev => ({ ...prev, [key]: value }));
    if (value) {
      const currentIndex = STEPS.indexOf(key);
      if (currentIndex < STEPS.length - 1) {
        const nextStep = STEPS[currentIndex + 1];
        setCurrentFocus(nextStep);
        // Abre a próxima seção automaticamente
        setExpandedSections(prev => ({...prev, [key]: false, [nextStep]: true}));
      }
    }
  };

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // API calls
  const handleAddInstagramSource = async (username: string) => {
    if (!username.trim() || sources.length >= 3) return;
    
    setLoadingState('sources', true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockProfile: Profile = {
        username: username.replace('@', ''),
        followers: Math.floor(Math.random() * 50000),
        profile_image_link: '/placeholder.svg',
        posts_count: Math.floor(Math.random() * 300)
      };
      
      const mockPosts: InstagramPost[] = Array.from({ length: 9 }, (_, i) => ({
        url: `https://instagram.com/p/${i}-${username}`,
        images: ['/placeholder.svg'],
        reel: i % 4 === 0,
        transcription: `Esta é uma descrição de exemplo para o post ${i + 1} do perfil @${mockProfile.username}. O objetivo é simular conteúdo real para análise da IA.`
      }));

      const newSource: SourceData = {
        id: `instagram-${Date.now()}`,
        type: 'instagram',
        data: mockProfile,
        posts: mockPosts
      };

      setSources(prev => [...prev, newSource]);
      
      if (sources.length === 0) {
        setCompletedState('sources', true);
      }
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
    } finally {
      setLoadingState('sources', false);
    }
  };

  const handleAddBlogSource = async (url: string) => {
    if (!url.trim() || sources.length >= 3) return;
    
    setLoadingState('sources', true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockArticles: BlogArticle[] = Array.from({ length: 5 }, (_, i) => ({
        url: `${url}/article-${i}`,
        title: `Artigo de Exemplo ${i + 1}`,
        content: `Este é o conteúdo do artigo de exemplo número ${i + 1}. Ele serve para demonstrar como a IA pode extrair informações de um blog ou site.`,
        publishDate: new Date().toISOString()
      }));

      const newSource: SourceData = {
        id: `blog-${Date.now()}`,
        type: 'blog',
        data: { url, domain: new URL(url).hostname },
        articles: mockArticles
      };

      setSources(prev => [...prev, newSource]);
      
      if (sources.length === 0) {
        setCompletedState('sources', true);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoadingState('sources', false);
    }
  };

  const removeSource = (sourceId: string) => {
    setSources(prev => prev.filter(s => s.id !== sourceId));
    setSelectedPosts(prev => prev.filter(postUrl => !postUrl.includes(sourceId)));
    if (sources.length === 1) {
        setCompletedState('sources', false);
    }
  };

  const handlePostsSelection = () => {
    if (selectedPosts.length > 0) {
      setCompletedState('posts', true);
    }
  };

  const handleGoalSelection = (selectedGoal: GoalValue) => {
    setGoal(selectedGoal);
    setCompletedState('goal', true);
  };

  const handleNicheContinue = () => {
    if (niche.trim()) {
      setCompletedState('niche', true);
    }
  };

  const handleAudienceContinue = () => {
    if (audience.trim()) {
      setCompletedState('audience', true);
    }
  };

  const handleSubjectContinue = () => {
    if (subject.trim()) {
      setCompletedState('subject', true);
    }
  };

  const handleToneSelection = (selectedTone: ToneValue) => {
    const newTones = tone.includes(selectedTone)
        ? tone.filter(t => t !== selectedTone)
        : [...tone, selectedTone];
    setTone(newTones);
  };

  const handleToneContinue = () => {
    if (tone.length > 0) {
      setCompletedState('tone', true);
    }
  };

  const handleFormatAndGenerate = async (selectedFormat: FormatValue) => {
    setFormat(selectedFormat);
    setCompletedState('format', true);
    setExpandedSections(prev => ({ ...prev, format: false }));
    
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const toneLabels = TONES.filter(t => tone.includes(t.value)).map(t => t.label.toLowerCase());
      
      const content = `🎯 Seu conteúdo sobre "${subject}"

✨ Criado especialmente para seu público: ${audience}

🔥 Com um tom ${toneLabels.join(' e ')}.

#${niche.replace(/\s/g, '')} #conteudo #marketingdigital`;
      
      setGeneratedContent(content);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setExpandedSections({ sources: true });
    setLoading({});
    setCompleted({});
    setSources([]);
    setSelectedPosts([]);
    setGoal('');
    setNiche('');
    setAudience('');
    setSubject('');
    setTone([]);
    setFormat('');
    setGeneratedContent(null);
    setGenerating(false);
    setCurrentFocus('sources');
  };
  
  // Condições de "pronto para gerar"
  const canGenerate = goal && niche && audience && subject && tone.length > 0 && selectedPosts.length > 0;

  const handleNicheAndAudienceContinue = () => {
    // Verifica se ambos os campos estão preenchidos
    if (niche.trim() && audience.trim()) {
      // Marca ambas as etapas como concluídas
      setCompleted(prev => ({ ...prev, niche: true, audience: true }));

      // Avança o foco e expande a próxima seção ('subject')
      const nextStep = 'subject';
      setCurrentFocus(nextStep);
      setExpandedSections(prev => ({
        ...prev,
        niche: false, // Garante que a seção atual seja fechada
        [nextStep]: true,
      }));
    }
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "ai" ? "visible" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Gerador de Conteúdo AI"
        description="Crie posts personalizados baseados em análise"
      />
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* ... (O JSX dos ExpandableSection permanece o mesmo, mas agora está mais seguro devido às novas tipagens) ... */}
           {/* Generated Content */}
          {generatedContent && !generating ? (
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <CardTitle className="text-base">Conteúdo Gerado</CardTitle>
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={handleCopy}>
                       {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => handleFormatAndGenerate(format)} disabled={generating || !format}>
                       <RefreshCw className="w-4 h-4" />
                     </Button>
                     <Button variant="outline" size="sm" onClick={reset}>
                       <RotateCcw className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="p-3 bg-gray-50 rounded-lg">
                   <p className="whitespace-pre-wrap text-sm">{generatedContent}</p>
                 </div>
               </CardContent>
             </Card>
          ) : generating ? (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="font-medium">Gerando conteúdo...</p>
                    <p className="text-sm text-gray-500">Isso pode levar alguns segundos</p>
                </div>
                </CardContent>
            </Card>
          ) : (
            <>
              {/* Seções de configuração (renderização condicional se não houver conteúdo gerado) */}
              <ExpandableSection title="1. Fontes de Referência" icon={Instagram} expanded={!!expandedSections.sources} onToggle={() => toggleSection('sources')} completed={!!completed.sources} autoFocus={currentFocus === 'sources'}>
                <SourcesManager sources={sources} onAddInstagram={handleAddInstagramSource} onAddBlog={handleAddBlogSource} onRemove={removeSource} loading={!!loading.sources} maxSources={3} />
              </ExpandableSection>
              
              {sources.length > 0 && (
                <ExpandableSection title="2. Seleção de Conteúdo" icon={Grid3X3} expanded={!!expandedSections.posts} onToggle={() => toggleSection('posts')} completed={!!completed.posts} autoFocus={currentFocus === 'posts'}>
                    <ContentSelector sources={sources} selectedPosts={selectedPosts} onSelectionChange={setSelectedPosts} onContinue={handlePostsSelection} />
                </ExpandableSection>
              )}

              {completed.posts && (
                <>
                    <ExpandableSection title="3. Objetivo do Conteúdo" icon={Target} expanded={!!expandedSections.goal} onToggle={() => toggleSection('goal')} completed={!!completed.goal} required autoFocus={currentFocus === 'goal'}>
                        <div className="space-y-3">
                            {GOALS.map((goalOption) => (
                                <Card key={goalOption.value} className={cn("cursor-pointer transition-all hover:shadow-md", goal === goalOption.value && "ring-2 ring-blue-500 bg-blue-50")} onClick={() => handleGoalSelection(goalOption.value)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <span className="text-lg">{goalOption.emoji}</span>
                                        <span className="text-sm font-medium">{goalOption.label}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ExpandableSection>
                    
                    {/* Demais seções... */}
                     {/* <ExpandableSection title="4. Nicho e Público" icon={Users} expanded={!!expandedSections.niche || !!expandedSections.audience} onToggle={() => toggleSection('niche')} completed={!!completed.niche && !!completed.audience} required autoFocus={currentFocus === 'niche' || currentFocus === 'audience'}>
                        <div className="space-y-4">
                            <label className="text-sm font-medium">Nicho</label>
                            <Input placeholder="Ex: Fisioterapia, Barbearia..." value={niche} onChange={(e) => setNiche(e.target.value)} onBlur={handleNicheContinue} />
                            
                            <label className="text-sm font-medium">Público-alvo</label>
                            <Textarea placeholder="Ex: Mulheres acima de 40 anos com dor lombar..." value={audience} onChange={(e) => setAudience(e.target.value)} onBlur={handleAudienceContinue} rows={3} />
                        </div>
                    </ExpandableSection> */}

                    <ExpandableSection
  title="4. Nicho e Público"
  icon={Users}
  expanded={!!expandedSections.niche}
  onToggle={() => toggleSection('niche')}
  completed={!!completed.niche && !!completed.audience}
  required
  autoFocus={currentFocus === 'niche' || currentFocus === 'audience'}
>
  <div className="space-y-4">
    <div>
      {/* A tag de fechamento foi corrigida para </label> */}
      <label htmlFor="niche" className="text-sm font-medium">Nicho</label>
      <Input
        id="niche"
        placeholder="Ex: Fisioterapia, Barbearia..."
        value={niche}
        onChange={(e) => setNiche(e.target.value)}
      />
    </div>

    <div>
      {/* A tag de fechamento foi corrigida para </label> */}
      <label htmlFor="audience" className="text-sm font-medium">Público-alvo</label>
      <Textarea
        id="audience"
        placeholder="Ex: Mulheres acima de 40 anos com dor lombar..."
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        rows={3}
      />
    </div>

    <Button
      className="w-full"
      onClick={handleNicheAndAudienceContinue}
      disabled={!niche.trim() || !audience.trim()}
    >
      Continuar
    </Button>
  </div>
</ExpandableSection>

                    <ExpandableSection title="5. Assunto e Tom de Voz" icon={MessageSquare} expanded={!!expandedSections.subject || !!expandedSections.tone} onToggle={() => toggleSection('subject')} completed={!!completed.subject && !!completed.tone} required autoFocus={currentFocus === 'subject' || currentFocus === 'tone'}>
                        <div className="space-y-4">
                            <label className="text-sm font-medium">Assunto Específico</label>
                            <Textarea placeholder='Ex: "5 erros comuns ao investir em ações"' value={subject} onChange={(e) => setSubject(e.target.value)} onBlur={handleSubjectContinue} rows={3} />
                            
                            <label className="text-sm font-medium">Tom de Voz (selecione um ou mais)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {TONES.map((toneOption) => (
                                <div key={toneOption.value} onClick={() => handleToneSelection(toneOption.value)} className={cn("cursor-pointer transition-all border rounded-lg p-3 text-center", tone.includes(toneOption.value) && "ring-2 ring-blue-500 bg-blue-50")}>
                                    <span className="text-lg block">{toneOption.emoji}</span>
                                    <span className="text-xs font-medium">{toneOption.label}</span>
                                </div>
                                ))}
                            </div>
                            {tone.length > 0 && <Button className="w-full" onClick={handleToneContinue}>Confirmar Tom</Button>}
                        </div>
                    </ExpandableSection>

                    {canGenerate && (
                        <ExpandableSection title="6. Formato e Geração" icon={FileText} expanded={!!expandedSections.format} onToggle={() => toggleSection('format')} completed={!!completed.format} required autoFocus={currentFocus === 'format'}>
                        <div className="space-y-3">
                            <p className="text-sm text-center text-green-600 font-bold">Tudo pronto! Escolha o formato para gerar.</p>
                            {FORMATS.map((formatOption) => (
                            <Card key={formatOption.value} className={cn("cursor-pointer transition-all hover:shadow-md", format === formatOption.value && "ring-2 ring-blue-500")} onClick={() => handleFormatAndGenerate(formatOption.value)}>
                                <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{formatOption.emoji}</span>
                                    <span className="text-sm font-medium">{formatOption.label}</span>
                                </div>
                                {formatOption.featured && (<Badge>Destaque</Badge>)}
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                        </ExpandableSection>
                    )}
                </>
              )}
            </>
          )}

        </div>
      </ScrollArea>
      
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};