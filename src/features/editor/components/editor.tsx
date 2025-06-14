// src/features/editor/components/editor.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { fabric } from "fabric";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { Footer } from "./footer";
import { ActiveTool, selectionDependentTools } from "@/features/editor/types";
import { ShapeSidebar } from "./shape-sidebar";
import { FillColorSidebar } from "./fill-color-sidebar";
import { StrokeColorSidebar } from "./stroke-color-sidebar";
import { StrokeWidthSidebar } from "./stroke-width-sidebar";
import { OpacitySidebar } from "./opacity-sidebar";
import { TextSidebar } from "./text-sidebar";
import { FontSidebar } from "./font-sidebar";
import { ImageSidebar } from "./image-sidebar";
import { FilterSidebar } from "./filter-sidebar";
import { AiSidebar } from "./ai-sidebar";
import { RemoveBgSidebar } from "./remove-bg-sidebar";
import { DrawSidebar } from "./draw-sidebar";
import { SettingsSidebar } from "./settings-sidebar";
import { TemplateSidebar } from "./template-sidebar";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { Loader, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EditorProps {
  initialProjectId: string;
}

export const Editor = ({ initialProjectId }: EditorProps) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
  const [isLoading, setIsLoading] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch project data
  const { 
    data: projectData, 
    isLoading: isLoadingProject, 
    isError: isErrorProject 
  } = useGetProject(initialProjectId);

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    defaultState: projectData?.json,
    defaultWidth: projectData?.width || 900,
    defaultHeight: projectData?.height || 1200,
    clearSelectionCallback: onClearSelection,
    saveCallback: (values) => {
      // Implementar salvamento
      console.log("Saving:", values);
    },
  });

  const onChangeActiveTool = useCallback(
    (tool: ActiveTool) => {
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
    },
    [activeTool, editor]
  );

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current,
    });

    setIsLoading(false);

    return () => {
      canvas.dispose();
    };
  }, [init]);

  if (isLoadingProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isErrorProject || !projectData) {
    return (
      <div className="h-full flex flex-col gap-y-5 items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Failed to fetch project
        </p>
        <Button asChild variant="secondary">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={projectData.id}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />
      <div className="absolute h-[calc(100%-68px)] w-full top-[68px] flex">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        {activeTool === "templates" && (
          <TemplateSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "shapes" && (
          <ShapeSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "fill" && (
          <FillColorSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "stroke-color" && (
          <StrokeColorSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "stroke-width" && (
          <StrokeWidthSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "opacity" && (
          <OpacitySidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "text" && (
          <TextSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "font" && (
          <FontSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "images" && (
          <ImageSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "filter" && (
          <FilterSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "draw" && (
          <DrawSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "settings" && (
          <SettingsSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "ai" && (
          <AiSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        {activeTool === "remove-bg" && (
          <RemoveBgSidebar
            editor={editor}
            onClose={() => setActiveTool("select")}
          />
        )}
        <main className="bg-muted flex-1 overflow-auto relative flex flex-col">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />
          <div
            className="flex-1 h-[calc(100%-124px)] bg-muted relative"
            ref={containerRef}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-50">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading editor...</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};