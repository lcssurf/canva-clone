import { fabric } from "fabric";
import { useEffect, MutableRefObject } from "react";
import { JSON_KEYS } from "@/features/editor/types";

interface UseLoadStateProps {
  canvas: fabric.Canvas | null;
  autoZoom: () => void;
  initialState: MutableRefObject<string | undefined>;
  canvasHistory: MutableRefObject<string[]>;
  setHistoryIndex: (index: number) => void;
}

export const useLoadState = ({
  canvas,
  autoZoom,
  initialState,
  canvasHistory,
  setHistoryIndex,
}: UseLoadStateProps) => {
  useEffect(() => {
    if (!canvas || !initialState.current) {
      return;
    }

    try {
      const data = JSON.parse(initialState.current);
      
      canvas.loadFromJSON(data, () => {
        const currentState = JSON.stringify(canvas.toJSON(JSON_KEYS));
        canvasHistory.current = [currentState];
        setHistoryIndex(0);
        autoZoom();
      });
    } catch (error) {
      console.error("Error loading initial state:", error);
      // Se der erro, criar um estado inicial vazio
      const currentState = JSON.stringify(canvas.toJSON(JSON_KEYS));
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
      autoZoom();
    }
  }, [canvas]); // Removido initialState.current das dependencies para evitar loops

  // Reset initial state after first load to prevent conflicts with page switching
  useEffect(() => {
    if (canvas && initialState.current) {
      // Limpar o estado inicial após o primeiro carregamento
      initialState.current = undefined;
    }
  }, [canvas, initialState]);
};