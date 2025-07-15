import React, { useState, useEffect } from 'react';
// Supondo que você tenha esses componentes e utilitários
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileInfoCollectorProps {
  username: string;
  profileImage: string;
  onUsernameChange: (username: string) => void;
  onProfileImageChange: (image: string) => void;
  onContinue: () => void;
  loading?: boolean;
}

const ProfileInfoCollector = ({
  username,
  profileImage,
  onUsernameChange,
  onProfileImageChange,
  onContinue,
  loading = false
}: ProfileInfoCollectorProps) => {
  // O preview pode ser uma URL de objeto (local) ou uma URL de string (externa)
  const [imagePreview, setImagePreview] = useState<string | null>(profileImage);
  const [imageError, setImageError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Efeito para sincronizar o preview com a prop externa e limpar a URL de objeto
  useEffect(() => {
    // Se a prop `profileImage` mudar, atualiza o preview
    setImagePreview(profileImage);
    if (profileImage) setImageError(false);

    // ✨ OTIMIZAÇÃO: Limpeza para evitar vazamento de memória.
    // Se o preview atual for uma URL de objeto, ele será revogado quando o componente
    // for desmontado ou quando o `profileImage` mudar.
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [profileImage]); // A dependência `imagePreview` foi removida para evitar loops

  const handleImageFromUrl = (url: string) => {
    setImageLoading(true);
    setImageError(false);
    setImagePreview(url); // Mostra o preview imediatamente
    onProfileImageChange(url); // Atualiza o estado no pai
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageLoading(true);
      setImageError(false);
      
      // ✨ OTIMIZAÇÃO PRINCIPAL: Usar createObjectURL em vez de FileReader
      const objectUrl = URL.createObjectURL(file);
      
      // Para fins de preview, usamos a URL de objeto local
      setImagePreview(objectUrl);
      
      // Para o estado "final", ainda convertemos para Base64, mas isso pode ser
      // otimizado se você puder fazer upload do objeto File diretamente.
      // Por enquanto, mantemos a lógica de conversão para não quebrar a API externa.
      const reader = new FileReader();
      reader.onloadend = () => {
        onProfileImageChange(reader.result as string);
        setImageLoading(false); // Desativa o loading SÓ quando tudo terminar
      };
      reader.onerror = () => {
        setImageError(true);
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = ''; // Permite re-upload do mesmo arquivo
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  // Handlers de drag-and-drop permanecem os mesmos
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Funções para a tag <img>
  const handleImageLoadSuccess = () => {
    if (!profileImage.startsWith('data:')) { // Apenas para URLs externas
        setImageLoading(false);
    }
    setImageError(false);
  };

  const handleImageLoadError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const isValid = username.trim() && profileImage.trim() && !imageError && !imageLoading;

  return (
    <div className="space-y-6 w-full">
      {/* O resto do seu JSX permanece praticamente o mesmo */}
      
      {/* Preview da foto */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          {imageLoading && !imagePreview && (
             <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
             </div>
          )}
          {imagePreview && !imageError && (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover" 
                onLoad={handleImageLoadSuccess}
                onError={handleImageLoadError} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Input de Username */}
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
            disabled={loading || imageLoading}
          />
        </div>
      </div>
      
      {/* Upload de Imagem */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Foto de perfil</label>
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 transition-all duration-200",
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
            "hover:border-blue-400 hover:bg-gray-50",
            (loading || imageLoading) && "opacity-50 cursor-not-allowed"
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
            disabled={loading || imageLoading}
          />
          <div className="text-center">
            {imageLoading ? (
              <>
                <Loader2 className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
                <p className="mt-2 text-sm text-blue-600 font-medium">Processando imagem...</p>
              </>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Clique para fazer upload</span> ou arraste uma imagem
                </p>
                <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
              </>
            )}
          </div>
        </div>
        
        {/* URL Alternativa */}
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
          value={profileImage.startsWith('data:') ? '' : profileImage}
          onChange={(e) => handleImageFromUrl(e.target.value)}
          disabled={loading || imageLoading}
        />
        {imageError && (
          <p className="text-xs text-red-600">
            ❌ Não foi possível carregar a imagem. Verifique a URL ou tente outra.
          </p>
        )}
      </div>

      {/* Botão de Continuar */}
      <Button
        className="w-full"
        onClick={onContinue}
        disabled={!isValid || loading}
        size="lg"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Criando carrossel...</>
        ) : imageLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando imagem...</>
        ) : (
          "✨ Criar Carrossel"
        )}
      </Button>
      
      {/* Feedback de Validação */}
      {!isValid && !loading && (
        <p className="text-xs text-gray-500 text-center">
          {imageLoading
            ? "Aguarde o processamento da imagem..."
            : "Preencha todos os campos para continuar"
          }
        </p>
      )}
    </div>
  );
};

export default ProfileInfoCollector;