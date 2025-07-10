"use client";

import { fabric } from "fabric";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";

import { ResponseType } from "@/features/projects/api/use-get-project";
import { useUpdateProject } from "@/features/projects/api/use-update-project";

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
import { PagesNavigation } from "./pages-navigation";
import { useGetPages } from "@/features/pages/api/use-get-pages";
import { useCreatePage } from "@/features/pages/api/use-create-page";
import { useUpdatePage } from "@/features/pages/api/use-update-page";

interface EditorProps {
  initialData: ResponseType["data"];
};

export const Editor = ({ initialData }: EditorProps) => {

  const [isSaving, setIsSaving] = useState(false);

  const [generatedContent, setGeneratedContent] = useState<{
  headline: string;
  cards: string;
} | null>(null);

  useEffect(() => {
    console.log("generatedContent", generatedContent);
  }, [generatedContent]);

  const { mutate } = useUpdateProject(initialData.id);

  const { mutate: updatePage } = useUpdatePage(initialData.id);



  const { mutate: createPage, isPending: pendingCreatePage } = useCreatePage(initialData.id);
  const [activePageId, setActivePageId] = useState<string>(initialData.pages[0].id);

  const [pageData, setPageData] = useState(initialData.pages[0])

  const handleCreatePage = async () => {
    createPage({ height: initialData.height, width: initialData.width }, {
      onSuccess: async (data: any) => {
        await refetchPages();
        console.log("Page created successfully", data);
        
        if (data?.data?.id) {
          setActivePageId(data.data?.id);
        } 
      }
    });
  };

  const {
    data: pages = [],
    isLoading: loadingPages,
    refetch: refetchPages,
  } = useGetPages(initialData.id);

  // console.log("pages", pages);

  // useEffect(() => {
  //   console.log("activePageId", activePageId);
  //   const current = pages.find((p) => p.id === activePageId);
  //   console.log("currentPageData", current?.fabricState);
  // }, [activePageId, pages]);

  // Update the pageData state when activePageId changes
  useEffect(() => {
    const current = pages.find(p => p.id === activePageId);
    if (current) {
      setPageData(current);
    }
  }, [activePageId, pages]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(
     async (values: {
        json: string,
        height: number,
        width: number,
      }) => {
        setIsSaving(true);
        // mutate(values);
        try {
        await updatePage({
          pageId: activePageId,
          data: {
            fabricState: values.json,
            height: values.height,
            width: values.width,
          }
        });
      } finally {
        setIsSaving(false);
      }
      },
      200
    ), [updatePage, activePageId]);


  const [activeTool, setActiveTool] = useState<ActiveTool>("ai");

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    defaultState: pageData.fabricState,
    defaultWidth: initialData.width,
    defaultHeight: initialData.height,
    clearSelectionCallback: onClearSelection,
    saveCallback: debouncedSave,
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Example: attach activePageId to refs if needed
  // You can use a ref to store the current page id if you want to access it elsewhere
  const activePageIdRef = useRef<string>(activePageId);

  // useEffect(() => {
  //   activePageIdRef.current = activePageId;
  // }, [activePageId]);

  useEffect(() => {

    if (!canvasRef.current || !containerRef.current) return;

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
  }, [init, activePageId]);


  useEffect(() => {
    // const timeout = setTimeout(() => {
      if (editor?.loadJson && pageData?.fabricState) {
        editor.loadJson(pageData.fabricState);
      }
    // }, 0);

    // return () => clearTimeout(timeout);
  }, [pageData.fabricState]);

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={initialData.id}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />


      <PagesNavigation
      pending = {pendingCreatePage}
        projectId={initialData.id}
        createPage={() => handleCreatePage()}
        activePageId={String(activePageId)}
        setActivePageId={setActivePageId}
        pages={pages}
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
        projectId= {initialData.id}
          generatedContent={generatedContent}
          setGeneratedContent={setGeneratedContent}
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
          <div className="flex-1 h-[calc(100%-124px)] bg-muted" ref={containerRef}>
            <canvas ref={canvasRef} />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};
