// src/features/editor/hooks/use-load-state.ts
import { fabric } from "fabric";
import { useEffect, useRef } from "react";
import { JSON_KEYS } from "../types";
import { useProjectStore } from "@/lib/project-store";

interface UseLoadStateProps {
  canvas: fabric.Canvas | null;
  initialState: React.MutableRefObject<string | undefined>;
  autoZoom: () => void;
  projectId?: string;
  pageId?: string;
}

export const useLoadState = ({ 
  canvas, 
  initialState, 
  autoZoom,
  projectId,
  pageId
}: UseLoadStateProps) => {
  const hasInitialized = useRef(false);
  const { getCurrentPageData } = useProjectStore();

  useEffect(() => {
    if (!canvas || hasInitialized.current) return;

    const loadState = async () => {
      try {
        let stateToLoad = initialState.current;

        // Se temos projectId e pageId, carrega do store
        if (projectId && pageId) {
          const pageData = getCurrentPageData(projectId, pageId);
          if (pageData?.json) {
            stateToLoad = pageData.json;
          }
        }

        if (stateToLoad) {
          const data = JSON.parse(stateToLoad);
          
          canvas.loadFromJSON(data, () => {
            const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
            
            if (workspace) {
              const { width, height, fill } = workspace as fabric.Rect;
              
              workspace.set({
                selectable: false,
                hasControls: false,
              });

              canvas.setWidth(width || 900);
              canvas.setHeight(height || 1200);
              
              // Centra o workspace
              canvas.centerObject(workspace);
              canvas.clipPath = workspace;
            }

            autoZoom();
            canvas.renderAll();
            hasInitialized.current = true;
          });
        } else {
          autoZoom();
          hasInitialized.current = true;
        }
      } catch (error) {
        console.error("Erro ao carregar estado:", error);
        autoZoom();
        hasInitialized.current = true;
      }
    };

    const timeoutId = setTimeout(loadState, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [canvas, autoZoom, projectId, pageId]);

  // Reset quando mudar de página
  useEffect(() => {
    if (pageId) {
      hasInitialized.current = false;
    }
  }, [pageId]);
};