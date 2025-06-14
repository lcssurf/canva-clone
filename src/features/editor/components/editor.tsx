"use client";

import { fabric } from "fabric";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ResponseType } from "@/features/projects/api/use-get-project";
import { useUpdateProject } from "@/features/projects/api/use-update-project";
import { useGetPage } from "@/features/pages/api/use-get-page";
import { useUpdatePage } from "@/features/pages/api/use-update-page";

import { 
  ActiveTool, 
  selectionDependentTools
} from "@/features/editor/types";
import { Navbar } from "@/features/editor/components/navbar";
import { Footer } from "@/features/editor/components/footer";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { Sidebar } from "@/features/editor/components/sidebar";
import { Toolbar } from "@/features/editor/components/toolbar";
import { ShapeSidebar } from "@/features/editor/components/shape-sidebar";
import { FillColorSidebar } from "@/features/editor/components/fill-color-sidebar";
import { StrokeColorSidebar } from "@/features/editor/components/stroke-color-sidebar";
import { StrokeWidthSidebar } from "@/features/editor/components/stroke-width-sidebar";
import { OpacitySidebar } from "@/features/editor/components/opacity-sidebar";
import { TextSidebar } from "@/features/editor/components/text-sidebar";
import { FontSidebar } from "@/features/editor/components/font-sidebar";
import { ImageSidebar } from "@/features/editor/components/image-sidebar";
import { FilterSidebar } from "@/features/editor/components/filter-sidebar";
import { DrawSidebar } from "@/features/editor/components/draw-sidebar";
import { AiSidebar } from "@/features/editor/components/ai-sidebar";
import { TemplateSidebar } from "@/features/editor/components/template-sidebar";
import { RemoveBgSidebar } from "@/features/editor/components/remove-bg-sidebar";
import { SettingsSidebar } from "@/features/editor/components/settings-sidebar";
import { PagesNavigation } from "@/features/editor/components/pages-sidebar";
import { DebugInfo } from "@/features/editor/components/debug-info";
import { Loader } from "lucide-react";

interface EditorProps {
  initialData: ResponseType["data"];
  pages: { id: string; title?: string; order: number; width?: number; height?: number }[];
  activePageId: string;
  setActivePageId: (id: string) => void;
  createPage: (req: { title?: string; width: number; height: number }) => void;
}

export const Editor = ({ 
  initialData, 
  pages, 
  activePageId, 
  setActivePageId, 
  createPage 
}: EditorProps) => {
  const { mutate } = useUpdateProject(initialData.id);

  // Hook para carregar estado da página ativa
  const { 
    data: pageData, 
    isLoading: loadingPage, 
    isError: errorPage 
  } = useGetPage(initialData.id, activePageId);

  // Hook para salvar alterações da página
  const { mutate: savePage } = useUpdatePage(initialData.id, activePageId);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(
      (values: { 
        json: string,
        height: number,
        width: number,
      }) => {
        mutate(values);
    },
    500
  ), [mutate]);

  // debounce do save para página específica
  const debouncedSavePage = useCallback(
    debounce((fabricState: any) => {
      savePage({ fabricState });
    }, 500),
    [savePage]
  );

  const [activeTool, setActiveTool] = useState<ActiveTool>("select");

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  // Use page data when available, fallback to project data
  const currentPageData = pageData || {
    fabricState: '{"objects":[],"background":""}',
    width: initialData.width,
    height: initialData.height,
  };

  const { init, editor } = useEditor({
    defaultState: currentPageData.fabricState,
    defaultWidth: currentPageData.width,
    defaultHeight: currentPageData.height,
    clearSelectionCallback: onClearSelection,
    saveCallback: debouncedSavePage,
  });

  const onChangeActiveTool = useCallback((tool: ActiveTool) => {
    if (tool === "draw") {
      editor?.enableDrawingMode();
    }

    if (activeTool === "draw") {
      editor?.disableDrawingMode();
    }

    if (tool === activeTool) {
      return setActiveTool("select");
    }
    
    setActiveTool(tool);
  }, [activeTool, editor]);

  const canvasRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado para controlar se a inicialização já foi feita
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializa o canvas do Fabric.js - versão simplificada com retry
  useLayoutEffect(() => {
    console.log("🔄 Layout effect triggered");

    const tryInitialize = () => {
      const canvasElement = canvasRef.current;
      const containerElement = containerRef.current;

      console.log("🔍 Checking elements:", { 
        canvasElement: !!canvasElement, 
        containerElement: !!containerElement,
        containerDimensions: containerElement ? {
          offsetWidth: containerElement.offsetWidth,
          offsetHeight: containerElement.offsetHeight,
          clientWidth: containerElement.clientWidth,
          clientHeight: containerElement.clientHeight,
          boundingRect: containerElement.getBoundingClientRect()
        } : 'N/A'
      });

      if (!canvasElement || !containerElement) {
        return false;
      }

      // Aguardar o container ter dimensões
      if (containerElement.offsetWidth === 0 || containerElement.offsetHeight === 0) {
        console.log("⏳ Waiting for container dimensions...");
        return false;
      }

      console.log("🚀 Initializing canvas with dimensions:", {
        width: containerElement.offsetWidth,
        height: containerElement.offsetHeight
      });
      
      const canvas = new fabric.Canvas(canvasElement, {
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });

      console.log("📞 Calling init...");
      init({
        initialCanvas: canvas,
        initialContainer: containerElement,
      });

      return true;
    };

    // Tentar imediatamente
    if (tryInitialize()) {
      return;
    }

    // Se não conseguiu, tentar após pequenos delays
    const timeouts = [100, 250, 500].map((delay, index) => 
      setTimeout(() => {
        console.log(`🔄 Retry ${index + 1} after ${delay}ms...`);
        if (tryInitialize()) {
          // Limpar timeouts restantes
          timeouts.slice(index + 1).forEach(clearTimeout);
        }
      }, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [init]);

  // Reset canvas when active page changes
  useEffect(() => {
    console.log("🔄 Page change effect triggered", { 
      editor: !!editor, 
      activePageId, 
      currentPageData: !!currentPageData 
    });

    if (!editor || !currentPageData) {
      console.log("❌ Editor or currentPageData not ready");
      return;
    }

    try {
      console.log("📄 Loading page data:", { 
        activePageId, 
        fabricState: currentPageData.fabricState?.slice(0, 100) + "...",
        width: currentPageData.width,
        height: currentPageData.height
      });

      // Primeiro, ajustar o tamanho do canvas
      console.log("📐 Changing canvas size...");
      editor.changeSize({
        width: currentPageData.width,
        height: currentPageData.height,
      });

      // Depois, carregar o conteúdo da página
      if (currentPageData.fabricState && currentPageData.fabricState !== '{"objects":[],"background":""}') {
        console.log("📋 Loading existing page state...");
        // Carregar estado existente
        editor.loadFromJSON(currentPageData.fabricState);
      } else {
        console.log("🆕 Creating new page (no existing state)...");
        // Página vazia - limpar canvas mas manter workspace
        const allObjects = editor.canvas.getObjects();
        const workspace = allObjects.find(obj => obj.name === "clip");
        
        console.log("🧹 Cleaning canvas objects:", allObjects.length);
        
        // Remover todos os objetos exceto o workspace
        allObjects.forEach(obj => {
          if (obj.name !== "clip") {
            editor.canvas.remove(obj);
          }
        });
        
        // Se não tem workspace, criar um novo
        if (!workspace) {
          console.log("🆕 Creating new workspace...");
          const newWorkspace = new fabric.Rect({
            width: currentPageData.width,
            height: currentPageData.height,
            name: "clip",
            fill: "white",
            selectable: false,
            hasControls: false,
            shadow: new fabric.Shadow({
              color: "rgba(0,0,0,0.8)",
              blur: 5,
            }),
          });

          editor.canvas.add(newWorkspace);
          editor.canvas.centerObject(newWorkspace);
          editor.canvas.clipPath = newWorkspace;
        } else {
          console.log("✅ Workspace already exists");
        }
        
        editor.canvas.renderAll();
        editor.autoZoom();
      }
      
      console.log("✅ Page loading complete");
    } catch (error) {
      console.error("❌ Error loading page data:", error);
    }
  }, [editor, activePageId, currentPageData]);

  // Handle create page with current dimensions
  const handleCreatePage = useCallback(() => {
    const currentPage = pages.find(p => p.id === activePageId);
    createPage({
      width: currentPage?.width || currentPageData.width,
      height: currentPage?.height || currentPageData.height,
    });
  }, [pages, activePageId, currentPageData, createPage]);

  if (loadingPage) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading page...</p>
      </div>
    );
  }

  console.log("🎨 Rendering Editor component", {
    editor: !!editor,
    currentPageData: !!currentPageData,
    activePageId
  });

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={initialData.id}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />

      {/* Pages Navigation - Movido para cima, depois da Navbar */}
      <PagesNavigation
        pages={pages}
        activePageId={activePageId}
        setActivePageId={setActivePageId}
        createPage={handleCreatePage}
        projectId={initialData.id}
      />

      <div className="absolute h-[calc(100%-68px-52px)] w-full top-[120px] flex">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FillColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeWidthSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <OpacitySidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TextSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FontSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ImageSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TemplateSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FilterSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <AiSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <RemoveBgSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <DrawSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <SettingsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <main className="bg-muted flex-1 overflow-auto relative flex flex-col min-h-0">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />
          <div 
            className="flex-1 bg-muted" 
            ref={containerRef}
            style={{ 
              minHeight: '500px', 
              height: 'calc(100vh - 280px)', // Altura fixa baseada na viewport
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <canvas 
              ref={canvasRef} 
              style={{ 
                display: 'block',
                width: '100%',
                height: '100%'
              }} 
            />
          </div>
          <Footer editor={editor} />
        </main>
      </div>

      {/* Debug Info - remova em produção */}
      <DebugInfo 
        pageData={pageData}
        currentPageData={currentPageData}
        activePageId={activePageId}
        editor={editor}
        loadingPage={loadingPage}
      />
    </div>
  );
};