"use client";

import { fabric } from "fabric";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";

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
    saveCallback: debouncedSavePage, // Save to current page instead of project
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

  // Inicializa o canvas do Fabric.js
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current!,
    });

    return () => {
      canvas.dispose();
    };
  }, [init]);

  // Reset canvas when active page changes
  useEffect(() => {
    if (editor && pageData) {
      try {
        const fabricState = typeof pageData.fabricState === 'string' 
          ? JSON.parse(pageData.fabricState) 
          : pageData.fabricState;

        editor.canvas.loadFromJSON(fabricState, () => {
          editor.canvas.renderAll();
        });

        // Update canvas dimensions
        editor.changeSize({
          width: pageData.width,
          height: pageData.height,
        });
      } catch (error) {
        console.error("Error loading page data:", error);
      }
    }
  }, [activePageId, pageData, editor]);

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
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={initialData.id}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />

      

      <div className="absolute h-[calc(100%-68px)] w-full top-[68px] flex">
        
        
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
        <main className="bg-muted flex-1 overflow-auto relative flex flex-col">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />
              {/* Pages Sidebar */}
        <PagesNavigation
          pages={pages}
          activePageId={activePageId}
          setActivePageId={setActivePageId}
          createPage={handleCreatePage}
          projectId={initialData.id}
        />
          <div className="flex-1 h-[calc(100%-124px)] bg-muted" ref={containerRef}>
        
            <canvas ref={canvasRef} />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};