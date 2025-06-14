// src/features/editor/hooks/use-history.ts
import { useCallback, useRef, useState } from "react";
import { fabric } from "fabric";
import { JSON_KEYS } from "../types";

interface UseHistoryProps {
  canvas: fabric.Canvas | null;
  saveCallback?: (values: {
    json: string;
    height: number;
    width: number;
  }) => void;
}

export const useHistory = ({ canvas, saveCallback }: UseHistoryProps) => {
  const [historyIndex, setHistoryIndex] = useState(0);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [canvasState, setCanvasState] = useState<{
    width: number;
    height: number;
    json: any;
  }>({
    width: 0,
    height: 0,
    json: null,
  });
  
  const skipSave = useRef(false);

  const save = useCallback(() => {
    if (!canvas || skipSave.current) return;

    const currentState = canvas.toJSON(JSON_KEYS);
    const json = JSON.stringify(currentState);

    const workspace = canvas
      .getObjects()
      .find((object) => object.name === "clip");

    const height = workspace?.height || 0;
    const width = workspace?.width || 0;

    saveCallback?.({ json, height, width });

    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(json);
    
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [canvas, canvasHistory, historyIndex, saveCallback]);

  const undo = useCallback(() => {
    if (historyIndex === 0) return;

    skipSave.current = true;
    const previousIndex = historyIndex - 1;
    const previousState = canvasHistory[previousIndex];

    canvas?.loadFromJSON(previousState, () => {
      canvas.renderAll();
      setHistoryIndex(previousIndex);
      skipSave.current = false;
    });
  }, [canvas, historyIndex, canvasHistory]);

  const redo = useCallback(() => {
    if (historyIndex === canvasHistory.length - 1) return;

    skipSave.current = true;
    const nextIndex = historyIndex + 1;
    const nextState = canvasHistory[nextIndex];

    canvas?.loadFromJSON(nextState, () => {
      canvas.renderAll();
      setHistoryIndex(nextIndex);
      skipSave.current = false;
    });
  }, [canvas, historyIndex, canvasHistory]);

  const canUndo = useCallback(() => {
    return historyIndex > 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex < canvasHistory.length - 1;
  }, [historyIndex, canvasHistory]);

  return {
    save,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    setHistoryIndex,
    setCanvasState,
  };
};