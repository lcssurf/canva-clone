// import { fabric } from "fabric";
// import { useEffect, useRef } from "react";

// import { JSON_KEYS } from "@/features/editor/types";

// interface UseLoadStateProps {
//   autoZoom: () => void;
//   canvas: fabric.Canvas | null;
//   initialState: React.MutableRefObject<string | undefined>;
//   canvasHistory: React.MutableRefObject<string[]>;
//   setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
// };

// export const useLoadState = ({
//   canvas,
//   autoZoom,
//   initialState,
//   canvasHistory,
//   setHistoryIndex,
// }: UseLoadStateProps) => {
//   const initialized = useRef(false);

//   useEffect(() => {
    
//     if (!initialized.current && initialState?.current && canvas) {
//       const data = JSON.parse(initialState.current);

//       canvas.loadFromJSON(data, () => {
//         const currentState = JSON.stringify(
//           canvas.toJSON(JSON_KEYS),
//         );

//         canvasHistory.current = [currentState];
//         setHistoryIndex(0);
//         autoZoom();
//       });
//       initialized.current = true;
//     }
//   }, 
//   [
//     canvas,
//     autoZoom,
//     initialState, // no need, this is a ref
//     canvasHistory, // no need, this is a ref
//     setHistoryIndex, // no need, this is a dispatch
//   ]);
// };

// src/features/editor/hooks/use-load-state.ts
// Substitua o conteúdo deste hook por:

import { useEffect } from "react";
import { fabric } from "fabric";
import { JSON_KEYS } from "@/features/editor/types";

interface UseLoadStateProps {
  canvas: fabric.Canvas | null;
  autoZoom: () => void;
  initialState: React.MutableRefObject<string | undefined>;
  canvasHistory: React.MutableRefObject<string[]>;
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
    if (!canvas) return;

    // Verificar se há estado inicial para carregar
    if (initialState.current) {
      try {
        const data = JSON.parse(initialState.current);
        
        canvas.loadFromJSON(data, () => {
          canvas.renderAll();
          autoZoom();
          
          // Atualizar histórico
          const currentState = JSON.stringify(canvas.toJSON(JSON_KEYS));
          canvasHistory.current = [currentState];
          setHistoryIndex(0);
        });
      } catch (error) {
        console.error("Error loading initial state:", error);
        
        // Se falhar, criar estado inicial padrão
        const currentState = JSON.stringify(canvas.toJSON(JSON_KEYS));
        canvasHistory.current = [currentState];
        setHistoryIndex(0);
      }
    } else {
      // Sem estado inicial, criar estado padrão
      const currentState = JSON.stringify(canvas.toJSON(JSON_KEYS));
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
    }
  }, [canvas, autoZoom, initialState, canvasHistory, setHistoryIndex]);
};
