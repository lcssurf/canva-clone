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
  // Image,
  Video,
  Grid3X3,
  X,
  Upload
} from 'lucide-react';
import {
  ActiveTool
} from "@/features/editor/types";
import { cn } from "@/lib/utils";

import { toast } from 'sonner';
import { crawlUser } from '@/content/crawler';
import Image from 'next/image';
import { useTranscriptionWithToasts } from '@/features/projects/api/useTranscription';
import { useEffect } from "react";
import { client } from '@/lib/hono';
import { useCreatePage } from '@/features/pages/api/use-create-page';
import { useRouter } from "next/router";
import { useGetPages } from '@/features/pages/api/use-get-pages';

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
  carousel?: boolean;
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
  private?: boolean;
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
  projectId: string;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  generatedContent: {
    headline: string;
    cards: string;
  } | null;
  setGeneratedContent: (content: {
    headline: string;
    cards: string;
  } | null) => void;
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

const CAROUSEL_TEMPLATES = [
  // {
  //   id: 'modern-minimal',
  //   name: 'Moderno Minimalista',
  //   description: 'Design limpo e elegante com foco na legibilidade',
  //   featured: true
  // },
  // {
  //   id: 'vibrant-creative',
  //   name: 'Criativo Vibrante',
  //   description: 'Visual dinâmico e colorido para máximo impacto',
  // },
  // {
  //   id: 'professional-corporate',
  //   name: 'Corporativo Profissional',
  //   description: 'Elegante e sóbrio, ideal para negócios e empresas',
  // },
  // {
  //   id: 'warm-personal',
  //   name: 'Pessoal Acolhedor',
  //   description: 'Design aconchegante e próximo para marcas pessoais',
  // },
  {
    id: 'editorial-bold',
    name: 'Editorial',
    description: 'Design aconchegante e próximo para marcas pessoais',
    featured: true
  }
] as const;

// --- Tipos Derivados das Constantes ---
type GoalValue = typeof GOALS[number]['value'];
type ToneValue = typeof TONES[number]['value'];
type FormatValue = typeof FORMATS[number]['value'];

const STEPS = ['sources', 'posts', 'goal', 'niche', 'audience', 'subject', 'tone', 'template'] as const;
type SectionName = typeof STEPS[number];
// Adicionar tipo para template
type TemplateId = typeof CAROUSEL_TEMPLATES[number]['id'];


// --- Componentes Filhos com Tipagem Corrigida ---

// Sources Manager Component
const SourcesManager: React.FC<{
  setErrorText?: (text: string | null) => void;
  errorText?: string | null;
  sources: SourceData[];
  onAddInstagram: (username: string) => void;
  onAddBlog: (url: string) => void;
  onRemove: (sourceId: string) => void;
  loading: boolean;
  maxSources: number;
}> = ({ sources, onAddInstagram, onAddBlog, onRemove, loading, maxSources, errorText, setErrorText }) => {
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
                onChangeCapture={() => setErrorText && setErrorText("")}
                placeholder="@perfil_instagram"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                disabled={loading}
              />
              {errorText && (
                <p className="text-xs text-red-600">{errorText}</p>
              )}
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
                onChangeCapture={() => setErrorText && setErrorText(null)}
                placeholder="https://blog.exemplo.com"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                disabled={loading}
              />
              {errorText && (
                <p className="text-xs text-red-600">{errorText}</p>
              )}
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
  selectedPosts: ContentItem[];
  onSelectionChange: (posts: ContentItem[]) => void;
  onContinue: () => void;
}> = ({ sources, selectedPosts, onSelectionChange, onContinue }) => {

  const allContent: ContentItem[] = sources.flatMap(source => {
    if (source.type === 'instagram') {
      return (source.posts ?? []).map(post => ({
        ...post,
        sourceId: source.id,
        type: 'post' as const,
        title: post.transcription?.substring(0, 80) || 'Post do Instagram',
      })) as ContentItem[];
    } else {
      return (source.articles ?? []).map(article => ({
        ...article,
        sourceId: source.id,
        type: 'article' as const,
      })) as ContentItem[];
    }
  });

  const toggleSelection = (content: ContentItem) => {
    const url = content.url;
    const isSelected = selectedPosts.some((p: any) => p.url === url);
    let newSelection;
    if (isSelected) {
      newSelection = selectedPosts.filter((p: any) => p.url !== url);
    } else if (selectedPosts.length < 3) {
      newSelection = [...selectedPosts, content];
    } else {
      newSelection = selectedPosts;
    }
    onSelectionChange(newSelection);
  };

  // console.log("🔄 Conteúdos disponíveis:", allContent);

  // console.log("🔄 Sources:", sources);



  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Selecione até 3 conteúdos para usar como referência ({selectedPosts.length}/3)
      </p>

      <ScrollArea className="h-80 pr-4">
        <div className="grid grid-cols-1 gap-3">
          {allContent.map((content) => {
            const isSelected = selectedPosts.some(post => post.url === content.url);
            const sourceData = sources.find(s => s.id === content.sourceId);
            // console.log(content);


            return (
              <div
                key={content.url}
                onClick={() => toggleSelection(content)}
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md",
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* <p>{JSON.stringify(content.images[0])}</p> */}
                  {content.type === 'post' && content.images?.length > 0 && (
                    <Image
                      crossOrigin="anonymous"
                      src={content.images[0] || "/placeholder.svg"}
                      alt="Post"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {content.type === 'post' ? (
                        <p className='flex items-center gap-1 text-xs text-gray-500 truncate'>
                          <Instagram className="w-4 h-4 text-pink-600" />
                          {content.reel && (
                            <span className="text-xs text-gray-500 truncate">
                              <Video className="inline w-4 h-4 mr-1 text-pink-600" />
                            </span>)}
                          {content.carousel && (
                            <span className="text-xs text-gray-500 truncate">
                              <Grid3X3 className="inline w-4 h-4 mr-1 text-pink-600" />
                            </span>
                          )}
                        </p>
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

// Profile Info Collector Component com Upload
const ProfileInfoCollector = ({
  username,
  profileImage,
  onUsernameChange,
  onProfileImageChange,
  onContinue,
  loading = false
}) => {
  const [imagePreview, setImagePreview] = useState(profileImage);
  const [imageError, setImageError] = useState(false);
  const [dragActive, setDragActive] = useState(false);



  const handleImageUrlChange = (url) => {
    onProfileImageChange(url);
    setImagePreview(url);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          handleImageUrlChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          handleImageUrlChange(result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const isValid = username.trim() && profileImage.trim() && !imageError;

  return (
    <div className="space-y-6 w-full">
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">👤 Informações do Perfil</h3>
        <p className="text-sm text-gray-600">
          Adicione seu @ e foto para personalizar os cards
        </p>
      </div>

      <div className="space-y-4">
        {/* Preview da foto */}
        <div className="flex justify-center">
          <div className="relative">
            {imagePreview && !imageError ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500 bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Preview do perfil"
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Campo do username */}
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium text-gray-700">
            Seu @ no Instagram
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">@</span>
            </div>
            <Input
              id="username"
              type="text"
              placeholder="seu_usuario"
              value={username.replace('@', '')}
              onChange={(e) => onUsernameChange(e.target.value.replace('@', ''))}
              className="pl-8"
              disabled={loading}
            />
          </div>
        </div>

        {/* Upload de imagem */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Foto de perfil
          </label>
          
          {/* Área de upload */}
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-4 transition-colors",
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
              "hover:border-blue-400 hover:bg-gray-50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-blue-600">Clique para fazer upload</span> ou arraste uma imagem
              </p>
              <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
            </div>
          </div>

          {/* Campo de URL alternativo */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">ou cole uma URL</span>
            </div>
          </div>

          <Input
            type="url"
            placeholder="https://exemplo.com/sua-foto.jpg"
            value={profileImage}
            onChange={(e) => handleImageUrlChange(e.target.value)}
            disabled={loading}
          />
          
          {imageError && (
            <p className="text-xs text-red-600">
              ❌ Não foi possível carregar a imagem. Tente outra.
            </p>
          )}
        </div>

        {/* Botão de continuar */}
        <Button
          className="w-full"
          onClick={onContinue}
          disabled={!isValid || loading}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processando...
            </>
          ) : (
            "✨ Finalizar Template"
          )}
        </Button>

        {!isValid && (
          <p className="text-xs text-gray-500 text-center">
            Preencha todos os campos para continuar
          </p>
        )}
      </div>
    </div>
  );
};

// Template Selector Component
const TemplateSelector = ({ 
  selectedTemplate, 
  onTemplateSelect, 
  onContinue, 
  generating 
}) => {
  return (
    <div className="space-y-4 w-full">
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">Escolha seu Template</h3>
        <p className="text-sm text-gray-600">
          Selecione o estilo visual para seu carrossel
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full p-1">
        {CAROUSEL_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={cn(
              "relative cursor-pointer transition-all duration-300 group",
              selectedTemplate === template.id && "ring-2 ring-blue-500 ring-offset-2"
            )}
            onClick={() => onTemplateSelect(template.id)}
          >
            {/* Template Preview */}
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <div className={cn(
                "absolute inset-0 transition-all duration-300",
                selectedTemplate === template.id
                  ? "scale-105"
                  : "group-hover:scale-102"
              )}>
                
                {/* Modern Minimal */}
                {/* {template.id === 'modern-minimal' && (
                  <div className="h-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                    <div className="text-white text-center space-y-2 p-4">
                      <div className="w-12 h-12 bg-white rounded-full mx-auto"></div>
                      <div className="space-y-1">
                        <div className="h-2 bg-white/80 rounded w-16 mx-auto"></div>
                        <div className="h-1 bg-white/60 rounded w-12 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Vibrant Creative */}
                {/* {template.id === 'vibrant-creative' && (
                  <div className="h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                    <div className="text-white text-center space-y-2 p-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full mx-auto"></div>
                      <div className="space-y-1">
                        <div className="h-2 bg-white/90 rounded w-16 mx-auto"></div>
                        <div className="h-1 bg-white/70 rounded w-12 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Professional Corporate */}
                {/* {template.id === 'professional-corporate' && (
                  <div className="h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <div className="text-white text-center space-y-2 p-4">
                      <div className="w-12 h-12 bg-white rounded-full mx-auto"></div>
                      <div className="space-y-1">
                        <div className="h-2 bg-white rounded w-16 mx-auto"></div>
                        <div className="h-1 bg-white/80 rounded w-12 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Warm Personal */}
                {/* {template.id === 'warm-personal' && (
                  <div className="h-full bg-gradient-to-br from-orange-400 via-pink-400 to-red-400 flex items-center justify-center">
                    <div className="text-white text-center space-y-2 p-4">
                      <div className="w-12 h-12 bg-white/30 backdrop-blur rounded-full mx-auto"></div>
                      <div className="space-y-1">
                        <div className="h-2 bg-white/90 rounded w-16 mx-auto"></div>
                        <div className="h-1 bg-white/70 rounded w-12 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Editorial Bold - Novo template baseado nas imagens */}
                {template.id === 'editorial-bold' && (
                  <div className="h-full bg-gradient-to-br from-red-500 to-orange-500 relative overflow-hidden">
                    {/* Header */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                      <div className="text-white text-[6px] font-medium opacity-80">ESTUDO DE CASO</div>
                      <div className="text-white text-[6px] font-medium opacity-80">BRANDS DECODED</div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="absolute inset-0 flex flex-col justify-center p-3">
                      {/* Bold Title */}
                      <div className="space-y-1 mb-2">
                        <div className="h-2 bg-black rounded w-full"></div>
                        <div className="h-2 bg-black rounded w-4/5"></div>
                        <div className="h-2 bg-black rounded w-3/4"></div>
                      </div>
                      
                      {/* Subtitle */}
                      <div className="space-y-1">
                        <div className="h-1 bg-white rounded w-3/4"></div>
                        <div className="h-1 bg-white rounded w-2/3"></div>
                        <div className="h-1 bg-white rounded w-1/2"></div>
                      </div>
                    </div>

                    {/* Bottom Image Placeholder */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/20 backdrop-blur-sm">
                      <div className="w-full h-full bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>

                    {/* Navigation dots */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`}></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selection Overlay */}
              {selectedTemplate === template.id && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              {/* Featured Badge */}
              {template.featured && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-green-500 text-white text-xs">
                    ⭐ Top
                  </Badge>
                </div>
              )}
            </div>

            {/* Template Name */}
            <p className="text-xs text-center mt-2 text-gray-600 font-medium">
              {template.name}
            </p>
          </div>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={onContinue}
        disabled={!selectedTemplate || generating}
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Criando páginas...
          </>
        ) : selectedTemplate ? (
          "🎨 Criar Páginas"
        ) : (
          "Selecione um template para continuar"
        )}
      </Button>
    </div>
  );
};

// --- Componente Principal com Estados Tipados ---
export const AiSidebar: React.FC<AiSidebarProps> = ({
  projectId,
  activeTool,
  onChangeActiveTool,
  generatedContent,
  setGeneratedContent,
}) => {

  const {
      data: pages = [],
      isLoading: loadingPages,
      refetch: refetchPages,
    } = useGetPages(projectId);

  const { mutate: createPage, isPending: pendingCreatePage } = useCreatePage(projectId);

  // State management com tipos precisos
  const [expandedSections, setExpandedSections] = useState<Partial<Record<SectionName, boolean>>>({ sources: true });
  const [loading, setLoading] = useState<Partial<Record<SectionName, boolean>>>({});
  const [completed, setCompleted] = useState<Partial<Record<SectionName, boolean>>>({});

  const [errorText, setErrorText] = useState<string | null>(null);

  // Form state com tipos literais
  const [sources, setSources] = useState<SourceData[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<ContentItem[]>([]);
  const [goal, setGoal] = useState<GoalValue | ''>('');
  const [niche, setNiche] = useState('');
  const [audience, setAudience] = useState('');
  const [subject, setSubject] = useState('');
  const [tone, setTone] = useState<ToneValue[]>([]);
  const [format, setFormat] = useState<FormatValue | ''>('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [generatedContentRaw, setGeneratedContentRaw] = useState<{
    headline: string;
    cards: string;
  } | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | ''>('');
  const [generatingImages, setGeneratingImages] = useState(false);

  // 🎯 NOVOS ESTADOS para perfil
  const [profileUsername, setProfileUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Current focus tracking
  const [currentFocus, setCurrentFocus] = useState<SectionName>('sources');

  const { processTranscriptions, isBatchLoading: isLoading } = useTranscriptionWithToasts(selectedPosts, setSelectedPosts);


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

  // const setCompletedState = (key: SectionName, value: boolean) => {
  //   setCompleted(prev => ({ ...prev, [key]: value }));
  //   if (value) {
  //     const currentIndex = STEPS.indexOf(key);
  //     if (currentIndex < STEPS.length - 1) {
  //       const nextStep = STEPS[currentIndex + 1];
  //       setCurrentFocus(nextStep);
  //       // Abre a próxima seção automaticamente
  //       setExpandedSections(prev => ({...prev, [key]: false, [nextStep]: true}));
  //     }
  //   }
  // };

  const setCompletedState = (key: SectionName, value: boolean) => {
    setCompleted(prev => ({ ...prev, [key]: value }));

    if (value) {
      const currentIndex = STEPS.indexOf(key);
      if (currentIndex < STEPS.length - 1) {
        const nextStep = STEPS[currentIndex + 1];

        setCurrentFocus(nextStep);
        setExpandedSections(prev => ({
          ...prev,
          // só “fecha” (seta false) a seção atual se NÃO for a de sources
          ...(key !== 'sources' && { [key]: false }),
          // e sempre abre a próxima
          [nextStep]: true,
        }));
      }
    }
  };


  const onClose = () => {
    onChangeActiveTool("select");
  };

  // API calls
  const handleAddInstagramSource = async (username: string) => {

    setLoadingState('sources', true);


    if (!username.trim() || sources.length >= 3) {
      // Exibe erro usando sonner

      toast.error('Usuário do Instagram inválido ou limite de fontes atingido.');

      return;
    }


    let user = username.trim().replace('@', '');

    const cacheKey = `profile_${user}`;

    // try {
    //   const cached = sessionStorage.getItem(cacheKey);
    //   if (cached) {
    //     const parsed = JSON.parse(cached);
    //     const now = Date.now();
    //     const cacheAge = now - (parsed._cachedAt || 0);

    //     if (cacheAge < 24 * 60 * 60 * 1000) { // Cache válido por 24 horas 
    //       setReferenceProfile(parsed.profile);
    //       setReferencePosts(parsed.posts);
    //       setReferenceUsername(sanitized);
    //       nextIfValid("profile", () => { });
    //       console.log("🔄 Cache encontrado e válido para:", sanitized);
    //       setLoadingState('isLoadingProfile', false);
    //       return;
    //     } else {
    //       console.log("🔄 Cache expirado para:", sanitized);
    //     }
    //   }
    // } catch (e) {
    //   console.warn("⚠️ Erro ao acessar cache:", e);
    // }

    try {

      const posts = await crawlUser(user);

      if (posts.private) {
        setErrorText('Usuário encontrado, mas é privado');
        console.error('Usuário encontrado, mas é privado');
        return;
      }

      if (!posts || !posts.posts) {
        setErrorText('Não foi possível encontrar este usuário ou ele não possui posts públicos. Verifique o nome de usuário e tente novamente.');
        console.error('Não foi possível encontrar este usuário ou ele não possui posts públicos. Verifique o nome de usuário e tente novamente.');
        return;
      }
      // console.log(`🔄`, posts);


      const mockProfile: Profile = {
        username: username.replace('@', ''),
        followers: Number(posts.followersCount),
        profile_image_link: posts.profilePicUrl,
        posts_count: posts.posts.length,
        private: posts.private,
      };

      const mockPosts: InstagramPost[] = (posts.posts || []).map((post: any, i: number) => ({
        url: post.url || `https://instagram.com/p/${i}-${username}`,
        images: Array.isArray(post.images) ? post.images : ['/placeholder.svg'],
        reel: post.reel ?? (i % 4 === 0),
        carousel: post.carousel ?? (i % 3 === 0),
        videoURL: post.videoURL,
        transcription: post.transcription || ``,
        // likes: post.likes,
        // datetime: post.datetime
      }));

      const newSource: SourceData = {
        id: `instagram-${Date.now()}`,
        type: 'instagram',
        data: mockProfile,
        posts: mockPosts
      };


      setSources(prev => [...prev, newSource]);

      // console.log(`🔄 Fonte Instagram adicionada:`, newSource);


      if (sources.length === 0) {
        setCompletedState('sources', true);
      }
    } catch (error) {
      setErrorText('Erro ao buscar perfil do Instagram. Verifique o nome de usuário e tente novamente.');
      console.error('Error fetching Instagram profile:', error);
    } finally {
      setLoadingState('sources', false);
    }
  };

  interface BlogData {
    title: string;
    sourceUrl: string;
    publishedTime: Date;
    markdownContent: string;
  }
  function parseJinaOutput(raw: string): BlogData {
    // Regex para cada campo
    const titleMatch = raw.match(/^Title:\s*(.+)$/m);
    const urlMatch = raw.match(/^URL Source:\s*(.+)$/m);
    const dateMatch = raw.match(/^Published Time:\s*(.+)$/m);

    // Índice onde começa o Markdown
    const mdHeader = "Markdown Content:";
    const mdIndex = raw.indexOf(mdHeader);
    if (mdIndex === -1) {
      throw new Error("parseJinaOutput: cabeçalho 'Markdown Content:' não encontrado");
    }

    // Extrai e trim
    const title = titleMatch?.[1].trim() ?? "";
    const sourceUrl = urlMatch?.[1].trim() ?? "";
    const published = dateMatch?.[1].trim() ?? "";
    const markdown = raw.substring(mdIndex + mdHeader.length).trim();

    if (!title || !sourceUrl || !published) {
      throw new Error("parseJinaOutput: falha ao extrair campos obrigatórios");
    }

    return {
      title,
      sourceUrl,
      publishedTime: new Date(published),
      markdownContent: markdown,
    };
  }
  const handleAddBlogSource = async (url: string) => {
    if (!url.trim() || sources.length >= 3) {
      toast.error('URL inválido ou limite de fontes atingido.');
      return
    };

    setLoadingState('sources', true);
    try {

      const response = await fetch(
        `https://r.jina.ai/${encodeURIComponent(url)}`,
        {
          headers: {
            "Authorization": "Bearer jina_f4511a1947e8448cb4ec156021cdcc89sT50jkwcGWNeJ2EpC5FoUvNaN5rv",
            "X-Retain-Images": "none",
            "X-Timeout": "30"
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do blog via Jina AI');
      }


      const raw = await response.text();
      let blog;
      try {
        blog = parseJinaOutput(raw);
      } catch (err) {
        setErrorText('Erro ao processar dados do blog. Verifique a URL e tente novamente.');
        console.error('Erro ao processar dados do blog:', err);
        return;
      }
      // Aqui você pode processar jinaData conforme necessário para extrair artigos reais
      // await new Promise(resolve => setTimeout(resolve, 1500));

      console.log(`🔄 Dados do blog recebidos:`, blog);

      const mockArticles: BlogArticle = {
        url: blog.sourceUrl,
        title: blog.title,
        content: blog.markdownContent,
        publishDate: blog.publishedTime ? blog.publishedTime.toISOString() : undefined
      };

      const newSource: SourceData = {
        id: `blog-${Date.now()}`,
        type: 'blog',
        data: { url, domain: new URL(url).hostname },
        articles: [mockArticles]
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
    setSelectedPosts(prev => prev.filter(post => post.sourceId !== sourceId));
    if (sources.length === 1) {
      setCompletedState('sources', false);
    }
  };

  useEffect(() => {
    console.log("📝 Posts selecionados:", selectedPosts);
  }, [selectedPosts]);

  const handlePostsSelection = async () => {
    if (isLoading) {
      toast.info("Um processo de transcrição já está em andamento.");
      return;
    }

    if (selectedPosts.length === 0) {
      toast.warning("Nenhum post selecionado para transcrever.");
      return;
    }

    console.log("Iniciando o processo de transcrição...");

    // Não precisa de um try/catch aqui, pois o hook já lida com os erros e a UI.
    // Apenas chame a função.
    processTranscriptions(3); // Definindo o batchSize

    // Não é mais necessário manipular o estado de "concluído" aqui.
    // A UI será atualizada reativamente pelo hook `onSuccess`.
    console.log("Processo de transcrição despachado. A UI será atualizada ao concluir.");
    setCompletedState('posts', true);
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

  const handleToneContinue = async () => {
    if (tone.length === 0) return;
    const defaultFormat = 'carrossel';
    setCompletedState('tone', true);
    setExpandedSections(prev => ({ ...prev, tone: false }));

    // 🚀 Gerar conteúdo primeiro
    await handleFormatAndGenerate(defaultFormat);
  };

  const handleFormatAndGenerate = async (selectedFormat: FormatValue) => {
    setFormat(selectedFormat);
    setExpandedSections(prev => ({ ...prev, format: false }));

    setGenerating(true);

    try {
      // Preparar payload conforme o schema da API
      const payload = {
        goal,
        niche,
        audience,
        subject,
        tone,
        format: selectedFormat,
        selectedPosts: selectedPosts.map(post => ({
          url: post.url,
          type: post.type,
          title: post.title,
          // Campos opcionais baseados no tipo
          ...(post.type === 'post' && {
            transcription: post.transcription,
            aiTranscription: post.aiTranscription || '',
          }),
          ...(post.type === 'article' && {
            content: post.content,
          }),
        })),
      };

      console.log('🚀 Payload para API:', payload);

      // Chamar a nova rota de geração de conteúdo
      const response = await client.api.ai["generate-content"].$post({
        json: payload
      });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Erro de comunicação com a API"
        }));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      // Processar resposta da API
      const { data } = await response.json();

      if (data.success && data.content) {
        setGeneratedContent(data.content);
        setGeneratedContentRaw(data.content)

        // 🎯 NOVO: Avançar para seleção de template
        setCompletedState('template', false); // Resetar se necessário
        setCurrentFocus('template');
        setExpandedSections(prev => ({
          ...prev,
          template: true
        }));

        // Toast de sucesso (opcional)
        toast.success('🎯 Conteúdo gerado com sucesso!', {
          description: `Baseado em ${data.metadata?.postsUsed || selectedPosts.length} posts selecionados`,
          duration: 4000,
        });

      } else {
        throw new Error('Resposta da API não contém conteúdo válido');
      }

    } catch (error) {
      console.error('❌ Erro ao gerar conteúdo:', error);

      // Tratamento específico de erros
      let errorMessage = 'Erro desconhecido ao gerar conteúdo';

      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Erro de autenticação. Faça login novamente.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        } else if (error.message.includes('500') || error.message.includes('502')) {
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
        } else if (error.message.includes('503')) {
          errorMessage = 'Problemas de conectividade. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }

      // Toast de erro
      toast.error('💥 Falha na geração', {
        description: errorMessage,
        duration: 8000,
        action: {
          label: "Tentar Novamente",
          onClick: () => handleFormatAndGenerate(selectedFormat)
        }
      });

      // Fallback para conteúdo mock (opcional - remova se não quiser)
      //     if (process.env.NODE_ENV === 'development') {
      //       console.log('🔄 Usando conteúdo de fallback em desenvolvimento');

      //       const toneLabels = TONES.filter(t => tone.includes(t.value)).map(t => t.label.toLowerCase());
      //       const fallbackContent = `🎯 Conteúdo de fallback sobre "${subject}"

      // ✨ Criado para: ${audience}

      // 🔥 Tom: ${toneLabels.join(' e ')}

      // 📱 Formato: ${FORMATS.find(f => f.value === selectedFormat)?.label}

      // #${niche.replace(/\s/g, '')} #conteudo #marketingdigital

      // ⚠️ Este é um conteúdo de desenvolvimento. Configure a API para gerar conteúdo real.`;

      //       setGeneratedContent(fallbackContent);
      //     }

    } finally {
      setGenerating(false);
    }
  };

  // Nova função para lidar com a seleção de template
  const handleTemplateSelectionAndCreatePages = async () => {
    if (!selectedTemplate || !generatedContent) return;

    // Mostrar formulário de perfil
    setShowProfileForm(true);
  };

  const handleTemplateSelect = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
  };

  // 4. NOVA FUNÇÃO para processar perfil e criar páginas
  // Função para processar o conteúdo e criar as páginas do carrossel
const handleProfileSubmitAndCreatePages = async () => {
  if (!selectedTemplate || !generatedContent || !profileUsername || !profileImage) return;

  setGeneratingImages(true);

  try {
    // 1. Processar o conteúdo
    const processedCards = processCarouselContent(generatedContent);
    
    console.log('🔄 Conteúdo processado:', processedCards);

    // 2. Gerar as páginas com o template selecionado
    const fabricPages = await generateFabricPagesWithBase64(
      processedCards, 
      selectedTemplate, 
      {
        username: profileUsername,
        image: profileImage
      }
    );

    console.log('🎨 Páginas geradas:', fabricPages.length);

    // 3. ✅ CORREÇÃO: Criar as páginas SEQUENCIALMENTE
    await createPagesSequentially(fabricPages);

    const template = CAROUSEL_TEMPLATES.find(t => t.id === selectedTemplate);

    toast.success('🎨 Carrossel criado com sucesso!', {
      description: `${fabricPages.length} páginas criadas com template "${template?.name}"`,
      duration: 5000,
    });

    // ✅ CORREÇÃO: Marcar como concluído e resetar estados
    setCompletedState('template', true);
    setExpandedSections(prev => ({ ...prev, template: false }));
    setShowProfileForm(false);

  } catch (error) {
    console.error('❌ Erro ao criar carrossel:', error);
    toast.error('💥 Erro ao criar carrossel', {
      description: 'Tente novamente ou escolha outro template',
      duration: 6000,
    });
  } finally {
    // ✅ CORREÇÃO: Garantir que o loading seja resetado SEMPRE
    setGeneratingImages(false);
  }
};

// 🔧 NOVA FUNÇÃO: Criação sequencial de páginas (uma por vez)
const createPagesSequentially = async (fabricPages: string[]) => {
  console.log('🚀 Iniciando criação sequencial de páginas...');
  
  for (let index = 0; index < fabricPages.length; index++) {
    const fabricJson = fabricPages[index];
    const pageNumber = index + 1;
    
    try {
      console.log(`📄 Criando página ${pageNumber}/${fabricPages.length}...`);
      
      // Criar página individual e aguardar conclusão
      await createSinglePage(fabricJson, pageNumber);
      
      console.log(`✅ Página ${pageNumber} criada com sucesso`);
      
      // Pequeno delay para evitar sobrecarga da API
      if (index < fabricPages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ Erro ao criar página ${pageNumber}:`, error);
      throw new Error(`Falha na criação da página ${pageNumber}: ${error.message}`);
    }
  }
  
  // Atualizar lista de páginas após todas serem criadas
  await refetchPages();
  console.log('🎉 Todas as páginas foram criadas sequencialmente!');
};

// 🔧 FUNÇÃO HELPER: Criar uma única página
const createSinglePage = (fabricJson: string, pageNumber: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    // ✅ CORREÇÃO: Título único para cada página
    const uniqueTitle = `Página ${pageNumber} - ${Date.now()}`;
    
    createPage({ 
      height: 1080, 
      width: 1080,
      fabricState: fabricJson,
      title: uniqueTitle // ✅ Título único para evitar duplicação
    }, {
      onSuccess: (data) => {
        console.log(`✅ Página ${pageNumber} criada:`, data?.data?.id);
        resolve(data);
      },
      onError: (error) => {
        console.error(`❌ Erro ao criar página ${pageNumber}:`, error);
        reject(error);
      }
    });
  });
};

// Função para processar o conteúdo gerado
const processCarouselContent = (content: any): string[] => {
  const cards: string[] = [];
  
  // 1. Adicionar headline como primeiro card
  if (content.headline && content.headline.trim()) {
    cards.push(content.headline.trim());
  }
  
  // 2. Processar os cards do conteúdo
  if (content.cards && typeof content.cards === 'string') {
    const cardsText = content.cards
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => {
        // ✅ MELHORAMENTO: Regex mais robusta para remover numeração
        return line
          .replace(/^texto\s+\d+\s*[-–—]\s*/i, '') // Remove "texto X -"
          .replace(/^\d+[\.\)]\s*/, '') // Remove "1." ou "1)"
          .replace(/^[-–—•]\s*/, '') // Remove bullets
          .trim();
      })
      .filter((line: string) => line.length > 10); // ✅ Filtrar textos muito curtos
    
    cards.push(...cardsText);
  }
  
  // ✅ VALIDAÇÃO: Garantir que temos pelo menos 1 card
  if (cards.length === 0) {
    cards.push('Conteúdo do carrossel');
  }
  
  console.log(`📝 Processados ${cards.length} cards:`, cards.map((c, i) => `${i + 1}. ${c.substring(0, 50)}...`));
  
  return cards;
};

// Função para gerar as páginas no formato Fabric.js
const generateFabricPages = async (
  cards: string[],
  templateId: string,
  profile: { username: string; image: string }
): Promise<string[]> => {
  const fabricPages: string[] = [];
  
  for (let i = 0; i < cards.length; i++) {
    const cardText = cards[i];
    const isFirstCard = i === 0;
    
    // Gerar página baseada no template
    const fabricJson = generateFabricTemplate(
      cardText,
      templateId,
      profile,
      isFirstCard,
      i + 1,
      cards.length
    );
    
    fabricPages.push(JSON.stringify(fabricJson));
  }
  
  return fabricPages;
};

// Função para gerar o template Fabric.js baseado no tipo selecionado
const generateFabricTemplate = (
  text: string,
  templateId: string,
  profile: { username: string; image: string },
  isFirstCard: boolean,
  pageNumber: number,
  totalPages: number
) => {
  const baseTemplate = {
    version: "5.3.0",
    objects: [],
    clipPath: {
      type: "rect",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 283,
      top: -215.5,
      width: 900,
      height: 1200,
      fill: "white",
      stroke: null,
      strokeWidth: 1,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: {
        color: "rgba(0,0,0,0.8)",
        blur: 5,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        nonScaling: false
      },
      visible: true,
      selectable: true,
      hasControls: true
    }
  };

  // Fundo clipping
  const clipRect = {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 283,
    top: -215.5,
    width: 900,
    height: 1200,
    fill: "white",
    stroke: null,
    strokeWidth: 1,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: {
      color: "rgba(0,0,0,0.8)",
      blur: 5,
      offsetX: 0,
      offsetY: 0,
      affectStroke: false,
      nonScaling: false
    },
    visible: true,
    name: "clip",
    selectable: false,
    hasControls: false
  };

  baseTemplate.objects.push(clipRect);

  // Template específico baseado no ID
  switch (templateId) {
    case 'editorial-bold':
      return generateEditorialBoldTemplate(baseTemplate, text, profile, isFirstCard, pageNumber, totalPages);
    
    case 'modern-minimal':
      return generateModernMinimalTemplate(baseTemplate, text, profile, isFirstCard, pageNumber, totalPages);
    
    case 'vibrant-creative':
      return generateVibrantCreativeTemplate(baseTemplate, text, profile, isFirstCard, pageNumber, totalPages);
    
    case 'professional-corporate':
      return generateProfessionalCorporateTemplate(baseTemplate, text, profile, isFirstCard, pageNumber, totalPages);
    
    case 'warm-personal':
      return generateWarmPersonalTemplate(baseTemplate, text, profile, isFirstCard, pageNumber, totalPages);
    
    default:
      return generateEditorialBoldTemplate(baseTemplate, text, profile, isFirstCard, pageNumber, totalPages);
  }
};

// Template Editorial Bold
const generateEditorialBoldTemplate = (
  baseTemplate: any,
  text: string,
  profile: { username: string; image: string },
  isFirstCard: boolean,
  pageNumber: number,
  totalPages: number
) => {
  // ✅ Estrutura básica seguindo o padrão do JSON de exemplo
  const fabricTemplate = {
    version: "5.3.0",
    objects: [],
    clipPath: {
      type: "rect",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 175.5,
      top: -286.5,
      width: 900,
      height: 1200,
      fill: "white",
      stroke: null,
      strokeWidth: 1,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: {
        color: "rgba(0,0,0,0.8)",
        blur: 5,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        nonScaling: false
      },
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      skewX: 0,
      skewY: 0,
      rx: 0,
      ry: 0,
      selectable: true,
      hasControls: true
    }
  };

  // 1. 🔳 Retângulo de clipping (igual ao exemplo)
  const clipRect = {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 175.5,
    top: -286.5,
    width: 900,
    height: 1200,
    fill: "white",
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: "butt",
    strokeDashOffset: 0,
    strokeLineJoin: "miter",
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: {
      color: "rgba(0,0,0,0.8)",
      blur: 5,
      offsetX: 0,
      offsetY: 0,
      affectStroke: false,
      nonScaling: false
    },
    visible: true,
    backgroundColor: "",
    fillRule: "nonzero",
    paintFirst: "fill",
    globalCompositeOperation: "source-over",
    skewX: 0,
    skewY: 0,
    rx: 0,
    ry: 0,
    name: "clip",
    selectable: false,
    hasControls: false
  };

  fabricTemplate.objects.push(clipRect);

  // 2. 🎨 Fundo com gradiente (preto/branco ou azul/preto)
  let gradientFill;
  if (isFirstCard) {
    // Primeira página: gradiente preto para branco
    gradientFill = "linear-gradient(135deg, #000000 0%, #ffffff 100%)";
  } else {
    // Páginas de conteúdo: gradiente azul para preto
    gradientFill = "linear-gradient(135deg, #1e40af 0%, #000000 100%)";
  }

  const backgroundRect = {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 175.5,
    top: -286.5,
    width: 900,
    height: 1200,
    fill: gradientFill,
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: "butt",
    strokeDashOffset: 0,
    strokeLineJoin: "miter",
    strokeUniform: false,
    strokeMiterLimit: 4,
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
    skewX: 0,
    skewY: 0,
    rx: 0,
    ry: 0,
    selectable: true,
    hasControls: true
  };

  fabricTemplate.objects.push(backgroundRect);

  // 3. 👤 Profile Image (maior, no canto superior esquerdo) - apenas se NÃO for headline
  if (!isFirstCard && profile.image && profile.username) {
    
    // Profile Image (circular maior)
    const profileImage = {
      type: "image",
      version: "5.3.0",
      originX: "center",
      originY: "center",
      left: 280, // Posição x maior
      top: -180, // Posição y no topo
      width: 120, // Maior
      height: 120, // Maior
      fill: "rgb(0,0,0)",
      stroke: "rgba(255,255,255,1)",
      strokeWidth: 4,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
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
      skewX: 0,
      skewY: 0,
      cropX: 0,
      cropY: 0,
      src: profile.image,
      crossOrigin: "anonymous",
      filters: [],
      selectable: true,
      hasControls: true
    };

    fabricTemplate.objects.push(profileImage);

    // Username (ao lado da imagem, maior)
    const usernameText = {
      type: "textbox",
      version: "5.3.0",
      originX: "left",
      originY: "center",
      left: 360, // Ao lado da imagem
      top: -180, // Mesma altura
      width: 300,
      height: 60,
      fill: "rgba(255, 255, 255, 1)",
      stroke: null,
      strokeWidth: 1,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
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
      skewX: 0,
      skewY: 0,
      fontFamily: "Arial Black",
      fontWeight: 700,
      fontSize: 24, // Maior
      text: `@${profile.username}`,
      underline: false,
      overline: false,
      linethrough: false,
      textAlign: "left",
      fontStyle: "normal",
      lineHeight: 1.16,
      textBackgroundColor: "",
      charSpacing: 0,
      styles: [],
      direction: "ltr",
      path: null,
      pathStartOffset: 0,
      pathSide: "left",
      pathAlign: "baseline",
      minWidth: 20,
      splitByGrapheme: false,
      selectable: true,
      hasControls: true,
      editable: true
    };

    fabricTemplate.objects.push(usernameText);
  }

  // 4. 📝 Texto principal (posicionado no centro-baixo)
  const textLength = text.length;
  const fontSize = isFirstCard 
    ? (textLength > 100 ? 55 : textLength > 50 ? 65 : 75) // Fontes grandes para headline
    : (textLength > 200 ? 40 : textLength > 100 ? 50 : 60); // Fontes grandes para conteúdo

  // Posição do texto ajustada para centro-baixo
  const textTop = !isFirstCard ? 50 : 100; // Mais para baixo quando há perfil

  const mainText = {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 200, // Centralizado
    top: textTop,
    width: 650, // Largura generosa
    height: 400, // Altura generosa
    fill: "rgba(255, 255, 255, 1)", // Sempre branco
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: "butt",
    strokeDashOffset: 0,
    strokeLineJoin: "miter",
    strokeUniform: false,
    strokeMiterLimit: 4,
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
    skewX: 0,
    skewY: 0,
    fontFamily: "Arial Black",
    fontWeight: isFirstCard ? 900 : 700,
    fontSize: fontSize,
    text: text.trim(),
    underline: false,
    overline: false,
    linethrough: false,
    textAlign: isFirstCard ? "center" : "left", // Centralizado para headline
    fontStyle: "normal",
    lineHeight: 1.2,
    textBackgroundColor: "",
    charSpacing: 0,
    styles: [],
    direction: "ltr",
    path: null,
    pathStartOffset: 0,
    pathSide: "left",
    pathAlign: "baseline",
    minWidth: 20,
    splitByGrapheme: false,
    selectable: true,
    hasControls: true,
    editable: true
  };

  fabricTemplate.objects.push(mainText);

  // 5. 📄 Indicador de página (canto inferior direito)
  const pageIndicator = {
    type: "textbox",
    version: "5.3.0",
    originX: "right",
    originY: "bottom",
    left: 1050,
    top: 880,
    width: 100,
    height: 30,
    fill: "rgba(255, 255, 255, 0.8)",
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: "butt",
    strokeDashOffset: 0,
    strokeLineJoin: "miter",
    strokeUniform: false,
    strokeMiterLimit: 4,
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
    skewX: 0,
    skewY: 0,
    fontFamily: "Arial",
    fontWeight: 500,
    fontSize: 16,
    text: `${pageNumber}/${totalPages}`,
    underline: false,
    overline: false,
    linethrough: false,
    textAlign: "right",
    fontStyle: "normal",
    lineHeight: 1.16,
    textBackgroundColor: "",
    charSpacing: 0,
    styles: [],
    direction: "ltr",
    path: null,
    pathStartOffset: 0,
    pathSide: "left",
    pathAlign: "baseline",
    minWidth: 20,
    splitByGrapheme: false,
    selectable: true,
    hasControls: true,
    editable: true
  };

  fabricTemplate.objects.push(pageIndicator);

  return fabricTemplate;
};

// 🔧 FUNÇÃO PARA CONVERTER IMAGEM URL PARA BASE64
const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    // Se já é base64, retornar como está
    if (imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    // Tentar converter URL para base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Erro ao converter imagem para base64:', error);
    return imageUrl; // Retornar URL original se falhar
  }
};

// 🔧 FUNÇÃO MELHORADA PARA GERAR PÁGINAS COM BASE64
const generateFabricPagesWithBase64 = async (
  cards: string[],
  templateId: string,
  profile: { username: string; image: string }
): Promise<string[]> => {
  const fabricPages: string[] = [];
  
  // Converter imagem do perfil para base64 se necessário
  let profileImageBase64 = profile.image;
  if (profile.image && !profile.image.startsWith('data:image/')) {
    try {
      profileImageBase64 = await convertImageToBase64(profile.image);
      console.log('✅ Imagem convertida para base64');
    } catch (error) {
      console.warn('⚠️ Falha ao converter imagem, usando URL original');
    }
  }

  for (let i = 0; i < cards.length; i++) {
    const cardText = cards[i];
    const isFirstCard = i === 0;
    
    const fabricJson = generateEditorialBoldTemplate(
      {},
      cardText,
      { 
        username: profile.username, 
        image: profileImageBase64 
      },
      isFirstCard,
      i + 1,
      cards.length
    );
    
    fabricPages.push(JSON.stringify(fabricJson));
  }
  
  return fabricPages;
};


// Templates adicionais (você pode implementar depois)
const generateModernMinimalTemplate = (baseTemplate: any, text: string, profile: any, isFirstCard: boolean, pageNumber: number, totalPages: number) => {
  // Implementar template minimalista
  return baseTemplate;
};

const generateVibrantCreativeTemplate = (baseTemplate: any, text: string, profile: any, isFirstCard: boolean, pageNumber: number, totalPages: number) => {
  // Implementar template criativo
  return baseTemplate;
};

const generateProfessionalCorporateTemplate = (baseTemplate: any, text: string, profile: any, isFirstCard: boolean, pageNumber: number, totalPages: number) => {
  // Implementar template corporativo
  return baseTemplate;
};

const generateWarmPersonalTemplate = (baseTemplate: any, text: string, profile: any, isFirstCard: boolean, pageNumber: number, totalPages: number) => {
  // Implementar template pessoal
  return baseTemplate;
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
    setSelectedTemplate('');
    setGeneratedContentRaw(null);
    setGeneratingImages(false);
    setProfileUsername('');
    setProfileImage('');
    setShowProfileForm(false);
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
            <div>
              <Card >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Conteúdo Gerado</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (format) handleFormatAndGenerate(format);
                        }}
                        disabled={generating || !format}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={reset}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg space-y-6 max-h-64 overflow-y-auto">
                    <h2 className="text-lg font-semibold leading-tight">
                      {generatedContent.headline}
                    </h2>
                    <div className=" pr-2">
                      <ul className="list-disc list-inside space-y-3 text-base leading-relaxed">
                        {generatedContent.cards
                          .split(/\n(?:texto \d+ - )/i)
                          .filter(Boolean)
                          .map((item, i) => (
                            <li key={i}>{item.trim()}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>

              </Card>
              <div className='mt-4 space-y-2'>
              {/* // 6. COMPONENTE ATUALIZADO DA SEÇÃO DE TEMPLATE (substitua o ExpandableSection existente) */}
              <ExpandableSection
                title="6. Template do Carrossel"
                icon={FileText}
                expanded={!!expandedSections.template}
                onToggle={() => toggleSection('template')}
                completed={!!completed.template}
                required
                autoFocus={currentFocus === 'template'}
              >
                {!showProfileForm ? (
                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                    onContinue={handleTemplateSelectionAndCreatePages}
                    generating={generatingImages}
                  />
                ) : (
                  <ProfileInfoCollector
                    username={profileUsername}
                    profileImage={profileImage}
                    onUsernameChange={setProfileUsername}
                    onProfileImageChange={setProfileImage}
                    onContinue={handleProfileSubmitAndCreatePages}
                    loading={generatingImages}
                  />
                )}
              </ExpandableSection>
              </div>


            </div>
          ) : generating ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="font-medium">Gerando conteúdo...</p>
                  <p className="text-sm text-gray-500">Isso pode levar alguns minutos</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Seções de configuração (renderização condicional se não houver conteúdo gerado) */}
              <ExpandableSection title="1. Fontes de Referência" icon={Instagram}
                expanded={!!expandedSections.sources}
                onToggle={() => toggleSection('sources')}
                completed={!!completed.sources}
                autoFocus={currentFocus === 'sources'}>
                <SourcesManager errorText={errorText} setErrorText={setErrorText} sources={sources} onAddInstagram={handleAddInstagramSource} onAddBlog={handleAddBlogSource} onRemove={removeSource} loading={!!loading.sources} maxSources={3} />
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
                      {tone.length > 0 && <Button onClick={handleToneContinue} disabled={generating || isLoading} className="w-full">
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Transcrevendo... Aguarde...
                          </>
                        ) : generating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Gerando conteúdo...
                          </>
                        ) : (
                          "🚀 Gerar Conteúdo"
                        )}
                      </Button>}
                    </div>
                  </ExpandableSection>

                  {/* {canGenerate && (
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
                              {'featured' in formatOption && formatOption.featured && (<Badge>Destaque</Badge>)}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ExpandableSection>
                  )} */}
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