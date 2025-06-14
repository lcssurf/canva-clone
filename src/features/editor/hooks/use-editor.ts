// // import { fabric } from "fabric";
// // import { useCallback, useState, useMemo, useRef } from "react";

// // import { 
// //   Editor, 
// //   FILL_COLOR,
// //   STROKE_WIDTH,
// //   STROKE_COLOR,
// //   CIRCLE_OPTIONS,
// //   DIAMOND_OPTIONS,
// //   TRIANGLE_OPTIONS,
// //   BuildEditorProps, 
// //   RECTANGLE_OPTIONS,
// //   EditorHookProps,
// //   STROKE_DASH_ARRAY,
// //   TEXT_OPTIONS,
// //   FONT_FAMILY,
// //   FONT_WEIGHT,
// //   FONT_SIZE,
// //   JSON_KEYS,
// // } from "@/features/editor/types";
// // import { useHistory } from "@/features/editor/hooks/use-history";
// // import { 
// //   createFilter, 
// //   downloadFile, 
// //   isTextType,
// //   transformText
// // } from "@/features/editor/utils";
// // import { useHotkeys } from "@/features/editor/hooks/use-hotkeys";
// // import { useClipboard } from "@/features/editor/hooks//use-clipboard";
// // import { useAutoResize } from "@/features/editor/hooks/use-auto-resize";
// // import { useCanvasEvents } from "@/features/editor/hooks/use-canvas-events";
// // import { useWindowEvents } from "@/features/editor/hooks/use-window-events";
// // import { useLoadState } from "@/features/editor/hooks/use-load-state";

// // const buildEditor = ({
// //   save,
// //   undo,
// //   redo,
// //   canRedo,
// //   canUndo,
// //   autoZoom,
// //   copy,
// //   paste,
// //   canvas,
// //   fillColor,
// //   fontFamily,
// //   setFontFamily,
// //   setFillColor,
// //   strokeColor,
// //   setStrokeColor,
// //   strokeWidth,
// //   setStrokeWidth,
// //   selectedObjects,
// //   strokeDashArray,
// //   setStrokeDashArray,
// // }: BuildEditorProps): Editor => {
// //   const generateSaveOptions = () => {
// //     const { width, height, left, top } = getWorkspace() as fabric.Rect;

// //     return {
// //       name: "Image",
// //       format: "png",
// //       quality: 1,
// //       width,
// //       height,
// //       left,
// //       top,
// //     };
// //   };

// //   const savePng = () => {
// //     const options = generateSaveOptions();

// //     canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
// //     const dataUrl = canvas.toDataURL(options);

// //     downloadFile(dataUrl, "png");
// //     autoZoom();
// //   };

// //   const saveSvg = () => {
// //     const options = generateSaveOptions();

// //     canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
// //     const dataUrl = canvas.toDataURL(options);

// //     downloadFile(dataUrl, "svg");
// //     autoZoom();
// //   };

// //   const saveJpg = () => {
// //     const options = generateSaveOptions();

// //     canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
// //     const dataUrl = canvas.toDataURL(options);

// //     downloadFile(dataUrl, "jpg");
// //     autoZoom();
// //   };

// //   const saveJson = async () => {
// //     const dataUrl = canvas.toJSON(JSON_KEYS);

// //     await transformText(dataUrl.objects);
// //     const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
// //       JSON.stringify(dataUrl, null, "\t"),
// //     )}`;
// //     downloadFile(fileString, "json");
// //   };

// //   const loadJson = (json: string) => {
// //     const data = JSON.parse(json);

// //     canvas.loadFromJSON(data, () => {
// //       autoZoom();
// //     });
// //   };

// //   const getWorkspace = () => {
// //     return canvas
// //     .getObjects()
// //     .find((object) => object.name === "clip");
// //   };

// //   const center = (object: fabric.Object) => {
// //     const workspace = getWorkspace();
// //     const center = workspace?.getCenterPoint();

// //     if (!center) return;

// //     // @ts-ignore
// //     canvas._centerObject(object, center);
// //   };

// //   const addToCanvas = (object: fabric.Object) => {
// //     center(object);
// //     canvas.add(object);
// //     canvas.setActiveObject(object);
// //   };

// //   return {
// //     savePng,
// //     saveJpg,
// //     saveSvg,
// //     saveJson,
// //     loadJson,
// //     canUndo,
// //     canRedo,
// //     autoZoom,
// //     getWorkspace,
// //     zoomIn: () => {
// //       let zoomRatio = canvas.getZoom();
// //       zoomRatio += 0.05;
// //       const center = canvas.getCenter();
// //       canvas.zoomToPoint(
// //         new fabric.Point(center.left, center.top),
// //         zoomRatio > 1 ? 1 : zoomRatio
// //       );
// //     },
// //     zoomOut: () => {
// //       let zoomRatio = canvas.getZoom();
// //       zoomRatio -= 0.05;
// //       const center = canvas.getCenter();
// //       canvas.zoomToPoint(
// //         new fabric.Point(center.left, center.top),
// //         zoomRatio < 0.2 ? 0.2 : zoomRatio,
// //       );
// //     },
// //     changeSize: (value: { width: number; height: number }) => {
// //       const workspace = getWorkspace();

// //       workspace?.set(value);
// //       autoZoom();
// //       save();
// //     },
// //     changeBackground: (value: string) => {
// //       const workspace = getWorkspace();
// //       workspace?.set({ fill: value });
// //       canvas.renderAll();
// //       save();
// //     },
// //     enableDrawingMode: () => {
// //       canvas.discardActiveObject();
// //       canvas.renderAll();
// //       canvas.isDrawingMode = true;
// //       canvas.freeDrawingBrush.width = strokeWidth;
// //       canvas.freeDrawingBrush.color = strokeColor;
// //     },
// //     disableDrawingMode: () => {
// //       canvas.isDrawingMode = false;
// //     },
// //     onUndo: () => undo(),
// //     onRedo: () => redo(),
// //     onCopy: () => copy(),
// //     onPaste: () => paste(),
// //     changeImageFilter: (value: string) => {
// //       const objects = canvas.getActiveObjects();
// //       objects.forEach((object) => {
// //         if (object.type === "image") {
// //           const imageObject = object as fabric.Image;

// //           const effect = createFilter(value);

// //           imageObject.filters = effect ? [effect] : [];
// //           imageObject.applyFilters();
// //           canvas.renderAll();
// //         }
// //       });
// //     },
// //     addImage: (value: string) => {
// //       fabric.Image.fromURL(
// //         value,
// //         (image) => {
// //           const workspace = getWorkspace();

// //           image.scaleToWidth(workspace?.width || 0);
// //           image.scaleToHeight(workspace?.height || 0);

// //           addToCanvas(image);
// //         },
// //         {
// //           crossOrigin: "anonymous",
// //         },
// //       );
// //     },
// //     delete: () => {
// //       canvas.getActiveObjects().forEach((object) => canvas.remove(object));
// //       canvas.discardActiveObject();
// //       canvas.renderAll();
// //     },
// //     addText: (value, options) => {
// //       const object = new fabric.Textbox(value, {
// //         ...TEXT_OPTIONS,
// //         fill: fillColor,
// //         ...options,
// //       });

// //       addToCanvas(object);
// //     },
// //     getActiveOpacity: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return 1;
// //       }

// //       const value = selectedObject.get("opacity") || 1;

// //       return value;
// //     },
// //     changeFontSize: (value: number) => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         if (isTextType(object.type)) {
// //           // @ts-ignore
// //           // Faulty TS library, fontSize exists.
// //           object.set({ fontSize: value });
// //         }
// //       });
// //       canvas.renderAll();
// //     },
// //     getActiveFontSize: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return FONT_SIZE;
// //       }

// //       // @ts-ignore
// //       // Faulty TS library, fontSize exists.
// //       const value = selectedObject.get("fontSize") || FONT_SIZE;

// //       return value;
// //     },
// //     changeTextAlign: (value: string) => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         if (isTextType(object.type)) {
// //           // @ts-ignore
// //           // Faulty TS library, textAlign exists.
// //           object.set({ textAlign: value });
// //         }
// //       });
// //       canvas.renderAll();
// //     },
// //     getActiveTextAlign: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return "left";
// //       }

// //       // @ts-ignore
// //       // Faulty TS library, textAlign exists.
// //       const value = selectedObject.get("textAlign") || "left";

// //       return value;
// //     },
// //     changeFontUnderline: (value: boolean) => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         if (isTextType(object.type)) {
// //           // @ts-ignore
// //           // Faulty TS library, underline exists.
// //           object.set({ underline: value });
// //         }
// //       });
// //       canvas.renderAll();
// //     },
// //     getActiveFontUnderline: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return false;
// //       }

// //       // @ts-ignore
// //       // Faulty TS library, underline exists.
// //       const value = selectedObject.get("underline") || false;

// //       return value;
// //     },
// //     changeFontLinethrough: (value: boolean) => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         if (isTextType(object.type)) {
// //           // @ts-ignore
// //           // Faulty TS library, linethrough exists.
// //           object.set({ linethrough: value });
// //         }
// //       });
// //       canvas.renderAll();
// //     },
// //     getActiveFontLinethrough: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return false;
// //       }

// //       // @ts-ignore
// //       // Faulty TS library, linethrough exists.
// //       const value = selectedObject.get("linethrough") || false;

// //       return value;
// //     },
// //     changeFontStyle: (value: string) => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         if (isTextType(object.type)) {
// //           // @ts-ignore
// //           // Faulty TS library, fontStyle exists.
// //           object.set({ fontStyle: value });
// //         }
// //       });
// //       canvas.renderAll();
// //     },
// //     getActiveFontStyle: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return "normal";
// //       }

// //       // @ts-ignore
// //       // Faulty TS library, fontStyle exists.
// //       const value = selectedObject.get("fontStyle") || "normal";

// //       return value;
// //     },
// //     changeFontWeight: (value: number) => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         if (isTextType(object.type)) {
// //           // @ts-ignore
// //           // Faulty TS library, fontWeight exists.
// //           object.set({ fontWeight: value });
// //         }
// //       });
// //       canvas.renderAll();
// //     },
// //     changeOpacity: (value: number) => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         object.set({ opacity: value });
// //       });
// //       canvas.renderAll();
// //     },
// //     bringForward: () => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         canvas.bringForward(object);
// //       });

// //       canvas.renderAll();
      
// //       const workspace = getWorkspace();
// //       workspace?.sendToBack();
// //     },
// //     sendBackwards: () => {
// //       canvas.getActiveObjects().forEach((object) => {
// //         canvas.sendBackwards(object);
// //       });

// //       canvas.renderAll();
// //       const workspace = getWorkspace();
// //       workspace?.sendToBack();
// //     },
// //     changeFontFamily: (value: string) => {
// //       setFontFamily(value);
// //       canvas.getActiveObjects().forEach((object) => {
// //         if (isTextType(object.type)) {
// //           // @ts-ignore
// //           // Faulty TS library, fontFamily exists.
// //           object.set({ fontFamily: value });
// //         }
// //       });
// //       canvas.renderAll();
// //     },
// //     changeFillColor: (value: string) => {
// //       setFillColor(value);
// //       canvas.getActiveObjects().forEach((object) => {
// //         object.set({ fill: value });
// //       });
// //       canvas.renderAll();
// //     },
// //     changeStrokeColor: (value: string) => {
// //       setStrokeColor(value);
// //       canvas.getActiveObjects().forEach((object) => {
// //         // Text types don't have stroke
// //         if (isTextType(object.type)) {
// //           object.set({ fill: value });
// //           return;
// //         }

// //         object.set({ stroke: value });
// //       });
// //       canvas.freeDrawingBrush.color = value;
// //       canvas.renderAll();
// //     },
// //     changeStrokeWidth: (value: number) => {
// //       setStrokeWidth(value);
// //       canvas.getActiveObjects().forEach((object) => {
// //         object.set({ strokeWidth: value });
// //       });
// //       canvas.freeDrawingBrush.width = value;
// //       canvas.renderAll();
// //     },
// //     changeStrokeDashArray: (value: number[]) => {
// //       setStrokeDashArray(value);
// //       canvas.getActiveObjects().forEach((object) => {
// //         object.set({ strokeDashArray: value });
// //       });
// //       canvas.renderAll();
// //     },
// //     addCircle: () => {
// //       const object = new fabric.Circle({
// //         ...CIRCLE_OPTIONS,
// //         fill: fillColor,
// //         stroke: strokeColor,
// //         strokeWidth: strokeWidth,
// //         strokeDashArray: strokeDashArray,
// //       });

// //       addToCanvas(object);
// //     },
// //     addSoftRectangle: () => {
// //       const object = new fabric.Rect({
// //         ...RECTANGLE_OPTIONS,
// //         rx: 50,
// //         ry: 50,
// //         fill: fillColor,
// //         stroke: strokeColor,
// //         strokeWidth: strokeWidth,
// //         strokeDashArray: strokeDashArray,
// //       });

// //       addToCanvas(object);
// //     },
// //     addRectangle: () => {
// //       const object = new fabric.Rect({
// //         ...RECTANGLE_OPTIONS,
// //         fill: fillColor,
// //         stroke: strokeColor,
// //         strokeWidth: strokeWidth,
// //         strokeDashArray: strokeDashArray,
// //       });

// //       addToCanvas(object);
// //     },
// //     addTriangle: () => {
// //       const object = new fabric.Triangle({
// //         ...TRIANGLE_OPTIONS,
// //         fill: fillColor,
// //         stroke: strokeColor,
// //         strokeWidth: strokeWidth,
// //         strokeDashArray: strokeDashArray,
// //       });

// //       addToCanvas(object);
// //     },
// //     addInverseTriangle: () => {
// //       const HEIGHT = TRIANGLE_OPTIONS.height;
// //       const WIDTH = TRIANGLE_OPTIONS.width;

// //       const object = new fabric.Polygon(
// //         [
// //           { x: 0, y: 0 },
// //           { x: WIDTH, y: 0 },
// //           { x: WIDTH / 2, y: HEIGHT },
// //         ],
// //         {
// //           ...TRIANGLE_OPTIONS,
// //           fill: fillColor,
// //           stroke: strokeColor,
// //           strokeWidth: strokeWidth,
// //           strokeDashArray: strokeDashArray,
// //         }
// //       );

// //       addToCanvas(object);
// //     },
// //     addDiamond: () => {
// //       const HEIGHT = DIAMOND_OPTIONS.height;
// //       const WIDTH = DIAMOND_OPTIONS.width;

// //       const object = new fabric.Polygon(
// //         [
// //           { x: WIDTH / 2, y: 0 },
// //           { x: WIDTH, y: HEIGHT / 2 },
// //           { x: WIDTH / 2, y: HEIGHT },
// //           { x: 0, y: HEIGHT / 2 },
// //         ],
// //         {
// //           ...DIAMOND_OPTIONS,
// //           fill: fillColor,
// //           stroke: strokeColor,
// //           strokeWidth: strokeWidth,
// //           strokeDashArray: strokeDashArray,
// //         }
// //       );
// //       addToCanvas(object);
// //     },
// //     canvas,
// //     getActiveFontWeight: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return FONT_WEIGHT;
// //       }

// //       // @ts-ignore
// //       // Faulty TS library, fontWeight exists.
// //       const value = selectedObject.get("fontWeight") || FONT_WEIGHT;

// //       return value;
// //     },
// //     getActiveFontFamily: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return fontFamily;
// //       }

// //       // @ts-ignore
// //       // Faulty TS library, fontFamily exists.
// //       const value = selectedObject.get("fontFamily") || fontFamily;

// //       return value;
// //     },
// //     getActiveFillColor: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return fillColor;
// //       }

// //       const value = selectedObject.get("fill") || fillColor;

// //       // Currently, gradients & patterns are not supported
// //       return value as string;
// //     },
// //     getActiveStrokeColor: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return strokeColor;
// //       }

// //       const value = selectedObject.get("stroke") || strokeColor;

// //       return value;
// //     },
// //     getActiveStrokeWidth: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return strokeWidth;
// //       }

// //       const value = selectedObject.get("strokeWidth") || strokeWidth;

// //       return value;
// //     },
// //     getActiveStrokeDashArray: () => {
// //       const selectedObject = selectedObjects[0];

// //       if (!selectedObject) {
// //         return strokeDashArray;
// //       }

// //       const value = selectedObject.get("strokeDashArray") || strokeDashArray;

// //       return value;
// //     },
// //     selectedObjects,
// //   };
// // };

// // export const useEditor = ({
// //   defaultState,
// //   defaultHeight,
// //   defaultWidth,
// //   clearSelectionCallback,
// //   saveCallback,
// // }: EditorHookProps) => {
// //   const initialState = useRef(defaultState);
// //   const initialWidth = useRef(defaultWidth);
// //   const initialHeight = useRef(defaultHeight);

// //   const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
// //   const [container, setContainer] = useState<HTMLDivElement | null>(null);
// //   const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

// //   const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
// //   const [fillColor, setFillColor] = useState(FILL_COLOR);
// //   const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
// //   const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
// //   const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

// //   useWindowEvents();

// //   const { 
// //     save, 
// //     canRedo, 
// //     canUndo, 
// //     undo, 
// //     redo,
// //     canvasHistory,
// //     setHistoryIndex,
// //   } = useHistory({ 
// //     canvas,
// //     saveCallback
// //   });

// //   const { copy, paste } = useClipboard({ canvas });

// //   const { autoZoom } = useAutoResize({
// //     canvas,
// //     container,
// //   });

// //   useCanvasEvents({
// //     save,
// //     canvas,
// //     setSelectedObjects,
// //     clearSelectionCallback,
// //   });

// //   useHotkeys({
// //     undo,
// //     redo,
// //     copy,
// //     paste,
// //     save,
// //     canvas,
// //   });

// //   useLoadState({
// //     canvas,
// //     autoZoom,
// //     initialState,
// //     canvasHistory,
// //     setHistoryIndex,
// //   });

// //   const editor = useMemo(() => {
// //     if (canvas) {
// //       return buildEditor({
// //         save,
// //         undo,
// //         redo,
// //         canUndo,
// //         canRedo,
// //         autoZoom,
// //         copy,
// //         paste,
// //         canvas,
// //         fillColor,
// //         strokeWidth,
// //         strokeColor,
// //         setFillColor,
// //         setStrokeColor,
// //         setStrokeWidth,
// //         strokeDashArray,
// //         selectedObjects,
// //         setStrokeDashArray,
// //         fontFamily,
// //         setFontFamily,
// //       });
// //     }

// //     return undefined;
// //   }, 
// //   [
// //     canRedo,
// //     canUndo,
// //     undo,
// //     redo,
// //     save,
// //     autoZoom,
// //     copy,
// //     paste,
// //     canvas,
// //     fillColor,
// //     strokeWidth,
// //     strokeColor,
// //     selectedObjects,
// //     strokeDashArray,
// //     fontFamily,
// //   ]);

// //   const init = useCallback(
// //     ({
// //       initialCanvas,
// //       initialContainer,
// //     }: {
// //       initialCanvas: fabric.Canvas;
// //       initialContainer: HTMLDivElement;
// //     }) => {
// //       fabric.Object.prototype.set({
// //         cornerColor: "#FFF",
// //         cornerStyle: "circle",
// //         borderColor: "#3b82f6",
// //         borderScaleFactor: 1.5,
// //         transparentCorners: false,
// //         borderOpacityWhenMoving: 1,
// //         cornerStrokeColor: "#3b82f6",
// //       });

// //       const initialWorkspace = new fabric.Rect({
// //         width: initialWidth.current,
// //         height: initialHeight.current,
// //         name: "clip",
// //         fill: "white",
// //         selectable: false,
// //         hasControls: false,
// //         shadow: new fabric.Shadow({
// //           color: "rgba(0,0,0,0.8)",
// //           blur: 5,
// //         }),
// //       });

// //       initialCanvas.setWidth(initialContainer.offsetWidth);
// //       initialCanvas.setHeight(initialContainer.offsetHeight);

// //       initialCanvas.add(initialWorkspace);
// //       initialCanvas.centerObject(initialWorkspace);
// //       initialCanvas.clipPath = initialWorkspace;

// //       setCanvas(initialCanvas);
// //       setContainer(initialContainer);

// //       const currentState = JSON.stringify(
// //         initialCanvas.toJSON(JSON_KEYS)
// //       );
// //       canvasHistory.current = [currentState];
// //       setHistoryIndex(0);
// //     },
// //     [
// //       canvasHistory, // No need, this is from useRef
// //       setHistoryIndex, // No need, this is from useState
// //     ]
// //   );

// //   return { init, editor };
// // };

// // ##############################################################################################################################

// import { fabric } from "fabric";
// import { useCallback, useState, useMemo, useRef } from "react";

// import { 
//   Editor, 
//   FILL_COLOR,
//   STROKE_WIDTH,
//   STROKE_COLOR,
//   CIRCLE_OPTIONS,
//   DIAMOND_OPTIONS,
//   TRIANGLE_OPTIONS,
//   BuildEditorProps, 
//   RECTANGLE_OPTIONS,
//   EditorHookProps,
//   STROKE_DASH_ARRAY,
//   TEXT_OPTIONS,
//   FONT_FAMILY,
//   FONT_WEIGHT,
//   FONT_SIZE,
//   JSON_KEYS,
// } from "@/features/editor/types";
// import { useHistory } from "@/features/editor/hooks/use-history";
// import { 
//   createFilter, 
//   downloadFile, 
//   isTextType,
//   transformText
// } from "@/features/editor/utils";
// import { useHotkeys } from "@/features/editor/hooks/use-hotkeys";
// import { useClipboard } from "@/features/editor/hooks//use-clipboard";
// import { useAutoResize } from "@/features/editor/hooks/use-auto-resize";
// import { useCanvasEvents } from "@/features/editor/hooks/use-canvas-events";
// import { useWindowEvents } from "@/features/editor/hooks/use-window-events";
// import { useLoadState } from "@/features/editor/hooks/use-load-state";

// const buildEditor = ({
//   save,
//   undo,
//   redo,
//   canRedo,
//   canUndo,
//   autoZoom,
//   copy,
//   paste,
//   canvas,
//   fillColor,
//   fontFamily,
//   setFontFamily,
//   setFillColor,
//   strokeColor,
//   setStrokeColor,
//   strokeWidth,
//   setStrokeWidth,
//   selectedObjects,
//   strokeDashArray,
//   setStrokeDashArray,
// }: BuildEditorProps): Editor => {
//   const generateSaveOptions = () => {
//     const { width, height, left, top } = getWorkspace() as fabric.Rect;

//     return {
//       name: "Image",
//       format: "png",
//       quality: 1,
//       width,
//       height,
//       left,
//       top,
//     };
//   };

//   const savePng = () => {
//     const options = generateSaveOptions();

//     canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
//     const dataUrl = canvas.toDataURL(options);

//     downloadFile(dataUrl, "png");
//     autoZoom();
//   };

//   const saveSvg = () => {
//     const options = generateSaveOptions();

//     canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
//     const dataUrl = canvas.toDataURL(options);

//     downloadFile(dataUrl, "svg");
//     autoZoom();
//   };

//   const saveJpg = () => {
//     const options = generateSaveOptions();

//     canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
//     const dataUrl = canvas.toDataURL(options);

//     downloadFile(dataUrl, "jpg");
//     autoZoom();
//   };

//   const saveJson = async () => {
//     const dataUrl = canvas.toJSON(JSON_KEYS);

//     await transformText(dataUrl.objects);
//     const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
//       JSON.stringify(dataUrl, null, "\t"),
//     )}`;
//     downloadFile(fileString, "json");
//   };

//   const loadJson = (json: string) => {
//     const data = JSON.parse(json);

//     canvas.loadFromJSON(data, () => {
//       autoZoom();
//     });
//   };

//   // ##### NOVOS MÉTODOS PARA MULTI-PÁGINAS ##### 
  
//   // Método para carregar estado do canvas de uma página específica
//   const loadFromJSON = (jsonState: string | object) => {
//     if (!canvas) return;

//     try {
//       const state = typeof jsonState === 'string' ? JSON.parse(jsonState) : jsonState;
      
//       canvas.loadFromJSON(state, () => {
//         canvas.renderAll();
//         autoZoom();
//       });
//     } catch (error) {
//       console.error("Error loading canvas state:", error);
//     }
//   };

//   // Método para alterar dimensões do canvas
//   const changeSize = (options: { width: number; height: number }) => {
//     if (!canvas) return;

//     const workspace = getWorkspace();
    
//     if (workspace) {
//       workspace.set({
//         width: options.width,
//         height: options.height,
//       });
//     }

//     canvas.renderAll();
//     autoZoom();
//     save();
//   };

//   const getWorkspace = () => {
//     return canvas
//     .getObjects()
//     .find((object) => object.name === "clip");
//   };

//   const center = (object: fabric.Object) => {
//     const workspace = getWorkspace();
//     const center = workspace?.getCenterPoint();

//     if (!center) return;

//     // @ts-ignore
//     canvas._centerObject(object, center);
//   };

//   const addToCanvas = (object: fabric.Object) => {
//     center(object);
//     canvas.add(object);
//     canvas.setActiveObject(object);
//   };

//   return {
//     savePng,
//     saveJpg,
//     saveSvg,
//     saveJson,
//     loadJson,
//     loadFromJSON, // ← NOVO
//     changeSize,   // ← MODIFICADO para incluir save()
//     canUndo,
//     canRedo,
//     autoZoom,
//     getWorkspace,
//     zoomIn: () => {
//       let zoomRatio = canvas.getZoom();
//       zoomRatio += 0.05;
//       const center = canvas.getCenter();
//       canvas.zoomToPoint(
//         new fabric.Point(center.left, center.top),
//         zoomRatio > 1 ? 1 : zoomRatio
//       );
//     },
//     zoomOut: () => {
//       let zoomRatio = canvas.getZoom();
//       zoomRatio -= 0.05;
//       const center = canvas.getCenter();
//       canvas.zoomToPoint(
//         new fabric.Point(center.left, center.top),
//         zoomRatio < 0.2 ? 0.2 : zoomRatio,
//       );
//     },
//     changeBackground: (value: string) => {
//       const workspace = getWorkspace();
//       workspace?.set({ fill: value });
//       canvas.renderAll();
//       save();
//     },
//     enableDrawingMode: () => {
//       canvas.discardActiveObject();
//       canvas.renderAll();
//       canvas.isDrawingMode = true;
//       canvas.freeDrawingBrush.width = strokeWidth;
//       canvas.freeDrawingBrush.color = strokeColor;
//     },
//     disableDrawingMode: () => {
//       canvas.isDrawingMode = false;
//     },
//     onUndo: () => undo(),
//     onRedo: () => redo(),
//     onCopy: () => copy(),
//     onPaste: () => paste(),
//     changeImageFilter: (value: string) => {
//       const objects = canvas.getActiveObjects();
//       objects.forEach((object) => {
//         if (object.type === "image") {
//           const imageObject = object as fabric.Image;

//           const effect = createFilter(value);

//           imageObject.filters = effect ? [effect] : [];
//           imageObject.applyFilters();
//           canvas.renderAll();
//         }
//       });
//     },
//     addImage: (value: string) => {
//       fabric.Image.fromURL(
//         value,
//         (image) => {
//           const workspace = getWorkspace();

//           image.scaleToWidth(workspace?.width || 0);
//           image.scaleToHeight(workspace?.height || 0);

//           addToCanvas(image);
//         },
//         {
//           crossOrigin: "anonymous",
//         },
//       );
//     },
//     delete: () => {
//       canvas.getActiveObjects().forEach((object) => canvas.remove(object));
//       canvas.discardActiveObject();
//       canvas.renderAll();
//     },
//     addText: (value, options) => {
//       const object = new fabric.Textbox(value, {
//         ...TEXT_OPTIONS,
//         fill: fillColor,
//         ...options,
//       });

//       addToCanvas(object);
//     },
//     getActiveOpacity: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return 1;
//       }

//       const value = selectedObject.get("opacity") || 1;

//       return value;
//     },
//     changeFontSize: (value: number) => {
//       canvas.getActiveObjects().forEach((object) => {
//         if (isTextType(object.type)) {
//           // @ts-ignore
//           // Faulty TS library, fontSize exists.
//           object.set({ fontSize: value });
//         }
//       });
//       canvas.renderAll();
//     },
//     getActiveFontSize: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return FONT_SIZE;
//       }

//       // @ts-ignore
//       // Faulty TS library, fontSize exists.
//       const value = selectedObject.get("fontSize") || FONT_SIZE;

//       return value;
//     },
//     changeTextAlign: (value: string) => {
//       canvas.getActiveObjects().forEach((object) => {
//         if (isTextType(object.type)) {
//           // @ts-ignore
//           // Faulty TS library, textAlign exists.
//           object.set({ textAlign: value });
//         }
//       });
//       canvas.renderAll();
//     },
//     getActiveTextAlign: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return "left";
//       }

//       // @ts-ignore
//       // Faulty TS library, textAlign exists.
//       const value = selectedObject.get("textAlign") || "left";

//       return value;
//     },
//     changeFontUnderline: (value: boolean) => {
//       canvas.getActiveObjects().forEach((object) => {
//         if (isTextType(object.type)) {
//           // @ts-ignore
//           // Faulty TS library, underline exists.
//           object.set({ underline: value });
//         }
//       });
//       canvas.renderAll();
//     },
//     getActiveFontUnderline: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return false;
//       }

//       // @ts-ignore
//       // Faulty TS library, underline exists.
//       const value = selectedObject.get("underline") || false;

//       return value;
//     },
//     changeFontLinethrough: (value: boolean) => {
//       canvas.getActiveObjects().forEach((object) => {
//         if (isTextType(object.type)) {
//           // @ts-ignore
//           // Faulty TS library, linethrough exists.
//           object.set({ linethrough: value });
//         }
//       });
//       canvas.renderAll();
//     },
//     getActiveFontLinethrough: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return false;
//       }

//       // @ts-ignore
//       // Faulty TS library, linethrough exists.
//       const value = selectedObject.get("linethrough") || false;

//       return value;
//     },
//     changeFontStyle: (value: string) => {
//       canvas.getActiveObjects().forEach((object) => {
//         if (isTextType(object.type)) {
//           // @ts-ignore
//           // Faulty TS library, fontStyle exists.
//           object.set({ fontStyle: value });
//         }
//       });
//       canvas.renderAll();
//     },
//     getActiveFontStyle: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return "normal";
//       }

//       // @ts-ignore
//       // Faulty TS library, fontStyle exists.
//       const value = selectedObject.get("fontStyle") || "normal";

//       return value;
//     },
//     changeFontWeight: (value: number) => {
//       canvas.getActiveObjects().forEach((object) => {
//         if (isTextType(object.type)) {
//           // @ts-ignore
//           // Faulty TS library, fontWeight exists.
//           object.set({ fontWeight: value });
//         }
//       });
//       canvas.renderAll();
//     },
//     changeOpacity: (value: number) => {
//       canvas.getActiveObjects().forEach((object) => {
//         object.set({ opacity: value });
//       });
//       canvas.renderAll();
//     },
//     bringForward: () => {
//       canvas.getActiveObjects().forEach((object) => {
//         canvas.bringForward(object);
//       });

//       canvas.renderAll();
      
//       const workspace = getWorkspace();
//       workspace?.sendToBack();
//     },
//     sendBackwards: () => {
//       canvas.getActiveObjects().forEach((object) => {
//         canvas.sendBackwards(object);
//       });

//       canvas.renderAll();
//       const workspace = getWorkspace();
//       workspace?.sendToBack();
//     },
//     changeFontFamily: (value: string) => {
//       setFontFamily(value);
//       canvas.getActiveObjects().forEach((object) => {
//         if (isTextType(object.type)) {
//           // @ts-ignore
//           // Faulty TS library, fontFamily exists.
//           object.set({ fontFamily: value });
//         }
//       });
//       canvas.renderAll();
//     },
//     changeFillColor: (value: string) => {
//       setFillColor(value);
//       canvas.getActiveObjects().forEach((object) => {
//         object.set({ fill: value });
//       });
//       canvas.renderAll();
//     },
//     changeStrokeColor: (value: string) => {
//       setStrokeColor(value);
//       canvas.getActiveObjects().forEach((object) => {
//         // Text types don't have stroke
//         if (isTextType(object.type)) {
//           object.set({ fill: value });
//           return;
//         }

//         object.set({ stroke: value });
//       });
//       canvas.freeDrawingBrush.color = value;
//       canvas.renderAll();
//     },
//     changeStrokeWidth: (value: number) => {
//       setStrokeWidth(value);
//       canvas.getActiveObjects().forEach((object) => {
//         object.set({ strokeWidth: value });
//       });
//       canvas.freeDrawingBrush.width = value;
//       canvas.renderAll();
//     },
//     changeStrokeDashArray: (value: number[]) => {
//       setStrokeDashArray(value);
//       canvas.getActiveObjects().forEach((object) => {
//         object.set({ strokeDashArray: value });
//       });
//       canvas.renderAll();
//     },
//     addCircle: () => {
//       const object = new fabric.Circle({
//         ...CIRCLE_OPTIONS,
//         fill: fillColor,
//         stroke: strokeColor,
//         strokeWidth: strokeWidth,
//         strokeDashArray: strokeDashArray,
//       });

//       addToCanvas(object);
//     },
//     addSoftRectangle: () => {
//       const object = new fabric.Rect({
//         ...RECTANGLE_OPTIONS,
//         rx: 50,
//         ry: 50,
//         fill: fillColor,
//         stroke: strokeColor,
//         strokeWidth: strokeWidth,
//         strokeDashArray: strokeDashArray,
//       });

//       addToCanvas(object);
//     },
//     addRectangle: () => {
//       const object = new fabric.Rect({
//         ...RECTANGLE_OPTIONS,
//         fill: fillColor,
//         stroke: strokeColor,
//         strokeWidth: strokeWidth,
//         strokeDashArray: strokeDashArray,
//       });

//       addToCanvas(object);
//     },
//     addTriangle: () => {
//       const object = new fabric.Triangle({
//         ...TRIANGLE_OPTIONS,
//         fill: fillColor,
//         stroke: strokeColor,
//         strokeWidth: strokeWidth,
//         strokeDashArray: strokeDashArray,
//       });

//       addToCanvas(object);
//     },
//     addInverseTriangle: () => {
//       const HEIGHT = TRIANGLE_OPTIONS.height;
//       const WIDTH = TRIANGLE_OPTIONS.width;

//       const object = new fabric.Polygon(
//         [
//           { x: 0, y: 0 },
//           { x: WIDTH, y: 0 },
//           { x: WIDTH / 2, y: HEIGHT },
//         ],
//         {
//           ...TRIANGLE_OPTIONS,
//           fill: fillColor,
//           stroke: strokeColor,
//           strokeWidth: strokeWidth,
//           strokeDashArray: strokeDashArray,
//         }
//       );

//       addToCanvas(object);
//     },
//     addDiamond: () => {
//       const HEIGHT = DIAMOND_OPTIONS.height;
//       const WIDTH = DIAMOND_OPTIONS.width;

//       const object = new fabric.Polygon(
//         [
//           { x: WIDTH / 2, y: 0 },
//           { x: WIDTH, y: HEIGHT / 2 },
//           { x: WIDTH / 2, y: HEIGHT },
//           { x: 0, y: HEIGHT / 2 },
//         ],
//         {
//           ...DIAMOND_OPTIONS,
//           fill: fillColor,
//           stroke: strokeColor,
//           strokeWidth: strokeWidth,
//           strokeDashArray: strokeDashArray,
//         }
//       );
//       addToCanvas(object);
//     },
//     canvas,
//     getActiveFontWeight: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return FONT_WEIGHT;
//       }

//       // @ts-ignore
//       // Faulty TS library, fontWeight exists.
//       const value = selectedObject.get("fontWeight") || FONT_WEIGHT;

//       return value;
//     },
//     getActiveFontFamily: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return fontFamily;
//       }

//       // @ts-ignore
//       // Faulty TS library, fontFamily exists.
//       const value = selectedObject.get("fontFamily") || fontFamily;

//       return value;
//     },
//     getActiveFillColor: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return fillColor;
//       }

//       const value = selectedObject.get("fill") || fillColor;

//       // Currently, gradients & patterns are not supported
//       return value as string;
//     },
//     getActiveStrokeColor: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return strokeColor;
//       }

//       const value = selectedObject.get("stroke") || strokeColor;

//       return value;
//     },
//     getActiveStrokeWidth: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return strokeWidth;
//       }

//       const value = selectedObject.get("strokeWidth") || strokeWidth;

//       return value;
//     },
//     getActiveStrokeDashArray: () => {
//       const selectedObject = selectedObjects[0];

//       if (!selectedObject) {
//         return strokeDashArray;
//       }

//       const value = selectedObject.get("strokeDashArray") || strokeDashArray;

//       return value;
//     },
//     selectedObjects,
//   };
// };

// export const useEditor = ({
//   defaultState,
//   defaultHeight,
//   defaultWidth,
//   clearSelectionCallback,
//   saveCallback, // ← MODIFICADO: agora aceita fabricState diretamente
// }: EditorHookProps) => {
//   const initialState = useRef(defaultState);
//   const initialWidth = useRef(defaultWidth);
//   const initialHeight = useRef(defaultHeight);

//   const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
//   const [container, setContainer] = useState<HTMLDivElement | null>(null);
//   const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

//   const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
//   const [fillColor, setFillColor] = useState(FILL_COLOR);
//   const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
//   const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
//   const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

//   useWindowEvents();

//   // ##### SAVE MODIFICADO PARA PAGES ##### 
//   const save = useCallback((skip = false) => {
//     if (!canvas || !saveCallback) return;

//     const fabricState = canvas.toJSON(JSON_KEYS);
//     const workspace = canvas.getObjects().find(obj => obj.name === "clip") as fabric.Rect | undefined;
//     const width = workspace?.width ?? canvas.getWidth();
//     const height = workspace?.height ?? canvas.getHeight();
//     const savePayload = {
//       json: JSON.stringify(fabricState),
//       width,
//       height,
//     };

//     if (skip) {
//       saveCallback(savePayload);
//       return;
//     }

//     // Debounced save será tratado pelo componente pai
//     saveCallback(savePayload);
//   }, [canvas, saveCallback]);

//   const { 
//     canRedo, 
//     canUndo, 
//     undo, 
//     redo,
//     canvasHistory,
//     setHistoryIndex,
//   } = useHistory({ 
//     canvas,
//     saveCallback: (values) => {
//       if (saveCallback) saveCallback(values);
//     }
//   });

//   const { copy, paste } = useClipboard({ canvas });

//   const { autoZoom } = useAutoResize({
//     canvas,
//     container,
//   });

//   useCanvasEvents({
//     save,
//     canvas,
//     setSelectedObjects,
//     clearSelectionCallback,
//   });

//   useHotkeys({
//     undo,
//     redo,
//     copy,
//     paste,
//     save,
//     canvas,
//   });

//   // useLoadState({
//   //   canvas,
//   //   autoZoom,
//   //   initialState,
//   //   canvasHistory,
//   //   setHistoryIndex,
//   // });

//   const editor = useMemo(() => {
//     if (canvas) {
//       return buildEditor({
//         save,
//         undo,
//         redo,
//         canUndo,
//         canRedo,
//         autoZoom,
//         copy,
//         paste,
//         canvas,
//         fillColor,
//         strokeWidth,
//         strokeColor,
//         setFillColor,
//         setStrokeColor,
//         setStrokeWidth,
//         strokeDashArray,
//         selectedObjects,
//         setStrokeDashArray,
//         fontFamily,
//         setFontFamily,
//       });
//     }

//     return undefined;
//   }, 
//   [
//     canRedo,
//     canUndo,
//     undo,
//     redo,
//     save,
//     autoZoom,
//     copy,
//     paste,
//     canvas,
//     fillColor,
//     strokeWidth,
//     strokeColor,
//     selectedObjects,
//     strokeDashArray,
//     fontFamily,
//   ]);

//   const init = useCallback(
//     ({
//       initialCanvas,
//       initialContainer,
//     }: {
//       initialCanvas: fabric.Canvas;
//       initialContainer: HTMLDivElement;
//     }) => {
//       fabric.Object.prototype.set({
//         cornerColor: "#FFF",
//         cornerStyle: "circle",
//         borderColor: "#3b82f6",
//         borderScaleFactor: 1.5,
//         transparentCorners: false,
//         borderOpacityWhenMoving: 1,
//         cornerStrokeColor: "#3b82f6",
//       });

//       const initialWorkspace = new fabric.Rect({
//         width: initialWidth.current,
//         height: initialHeight.current,
//         name: "clip",
//         fill: "white",
//         selectable: false,
//         hasControls: false,
//         shadow: new fabric.Shadow({
//           color: "rgba(0,0,0,0.8)",
//           blur: 5,
//         }),
//       });

//       // Verificar se o container tem dimensões válidas
//     const containerWidth = initialContainer?.offsetWidth || 800; // fallback
//     const containerHeight = initialContainer?.offsetHeight || 600; // fallback

//       initialCanvas.setWidth(containerWidth);
//       initialCanvas.setHeight(containerHeight);

//       initialCanvas.add(initialWorkspace);
//       initialCanvas.centerObject(initialWorkspace);
//       initialCanvas.clipPath = initialWorkspace;

//       // ##### AUTO-SAVE SETUP ##### 
//       const autoSave = () => save(true);

//       initialCanvas.on("object:added", autoSave);
//       initialCanvas.on("object:removed", autoSave);
//       initialCanvas.on("object:modified", autoSave);
//       initialCanvas.on("path:created", autoSave);

//       setCanvas(initialCanvas);
//       setContainer(initialContainer);

//       // ##### ESTADO INICIAL SERÁ CARREGADO PELO useLoadState ##### 
//       // ##### LOAD INITIAL STATE ##### 
//       // if (initialState.current) {
//       //   try {
//       //     const state = typeof initialState.current === 'string' 
//       //       ? JSON.parse(initialState.current) 
//       //       : initialState.current;
          
//       //     initialCanvas.loadFromJSON(state, () => {
//       //       initialCanvas.renderAll();
//       //       // Não chamamos autoZoom aqui para evitar conflitos
//       //     });
//       //   } catch (error) {
//       //     console.error("Error loading initial state:", error);
//       //     // Se falhar, cria estado inicial padrão
//       //     const currentState = JSON.stringify(initialCanvas.toJSON(JSON_KEYS));
//       //     canvasHistory.current = [currentState];
//       //     setHistoryIndex(0);
//       //   }
//       // } else {
//       //   // Estado inicial padrão se não houver estado carregado
//       //   const currentState = JSON.stringify(initialCanvas.toJSON(JSON_KEYS));
//       //   canvasHistory.current = [currentState];
//       //   setHistoryIndex(0);
//       // }
//     },
//     // [save, canvasHistory, setHistoryIndex]
//     [save]
//   );

//   return { init, editor };
// };


// SUBSTITUA TODO O CONTEÚDO DO useEditor por este código:

import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef, useEffect } from "react";

import { 
  Editor, 
  FILL_COLOR,
  STROKE_WIDTH,
  STROKE_COLOR,
  CIRCLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  BuildEditorProps, 
  RECTANGLE_OPTIONS,
  EditorHookProps,
  STROKE_DASH_ARRAY,
  TEXT_OPTIONS,
  FONT_FAMILY,
  FONT_WEIGHT,
  FONT_SIZE,
  JSON_KEYS,
} from "@/features/editor/types";
import { 
  createFilter, 
  downloadFile, 
  isTextType,
  transformText
} from "@/features/editor/utils";

const buildEditor = ({
  save,
  undo,
  redo,
  canRedo,
  canUndo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  fontFamily,
  setFontFamily,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  selectedObjects,
  strokeDashArray,
  setStrokeDashArray,
}: BuildEditorProps): Editor => {
  const generateSaveOptions = () => {
    const { width, height, left, top } = getWorkspace() as fabric.Rect;

    return {
      name: "Image",
      format: "png",
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const savePng = () => {
    const options = generateSaveOptions();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);
    downloadFile(dataUrl, "png");
    autoZoom();
  };

  const saveSvg = () => {
    const options = generateSaveOptions();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);
    downloadFile(dataUrl, "svg");
    autoZoom();
  };

  const saveJpg = () => {
    const options = generateSaveOptions();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);
    downloadFile(dataUrl, "jpg");
    autoZoom();
  };

  const saveJson = async () => {
    const dataUrl = canvas.toJSON(JSON_KEYS);
    await transformText(dataUrl.objects);
    const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataUrl, null, "\t"),
    )}`;
    downloadFile(fileString, "json");
  };

  const loadJson = (json: string) => {
    const data = JSON.parse(json);
    canvas.loadFromJSON(data, () => {
      autoZoom();
    });
  };

  // ##### NOVOS MÉTODOS PARA MULTI-PÁGINAS ##### 
  const loadFromJSON = (jsonState: string | object) => {
    if (!canvas) return;
    try {
      const state = typeof jsonState === 'string' ? JSON.parse(jsonState) : jsonState;
      canvas.loadFromJSON(state, () => {
        canvas.renderAll();
        autoZoom();
      });
    } catch (error) {
      console.error("Error loading canvas state:", error);
    }
  };

  const changeSize = (options: { width: number; height: number }) => {
    if (!canvas) return;
    const workspace = getWorkspace();
    if (workspace) {
      workspace.set({
        width: options.width,
        height: options.height,
      });
    }
    canvas.renderAll();
    autoZoom();
    save();
  };

  const getWorkspace = () => {
    return canvas.getObjects().find((object) => object.name === "clip");
  };

  const center = (object: fabric.Object) => {
    const workspace = getWorkspace();
    const center = workspace?.getCenterPoint();
    if (!center) return;
    // @ts-ignore
    canvas._centerObject(object, center);
  };

  const addToCanvas = (object: fabric.Object) => {
    center(object);
    canvas.add(object);
    canvas.setActiveObject(object);
  };

  return {
    savePng,
    saveJpg,
    saveSvg,
    saveJson,
    loadJson,
    loadFromJSON,
    changeSize,
    canUndo,
    canRedo,
    autoZoom,
    getWorkspace,
    zoomIn: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio += 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio > 1 ? 1 : zoomRatio
      );
    },
    zoomOut: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio -= 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio < 0.2 ? 0.2 : zoomRatio,
      );
    },
    changeBackground: (value: string) => {
      const workspace = getWorkspace();
      workspace?.set({ fill: value });
      canvas.renderAll();
      save();
    },
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },
    onUndo: () => undo(),
    onRedo: () => redo(),
    onCopy: () => copy(),
    onPaste: () => paste(),
    changeImageFilter: (value: string) => {
      const objects = canvas.getActiveObjects();
      objects.forEach((object) => {
        if (object.type === "image") {
          const imageObject = object as fabric.Image;
          const effect = createFilter(value);
          imageObject.filters = effect ? [effect] : [];
          imageObject.applyFilters();
          canvas.renderAll();
        }
      });
    },
    addImage: (value: string) => {
      fabric.Image.fromURL(
        value,
        (image) => {
          const workspace = getWorkspace();
          image.scaleToWidth(workspace?.width || 0);
          image.scaleToHeight(workspace?.height || 0);
          addToCanvas(image);
        },
        {
          crossOrigin: "anonymous",
        },
      );
    },
    delete: () => {
      canvas.getActiveObjects().forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    addText: (value, options) => {
      const object = new fabric.Textbox(value, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        ...options,
      });
      addToCanvas(object);
    },
    getActiveOpacity: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return 1;
      return selectedObject.get("opacity") || 1;
    },
    changeFontSize: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontSize: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontSize: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return FONT_SIZE;
      // @ts-ignore
      return selectedObject.get("fontSize") || FONT_SIZE;
    },
    changeTextAlign: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ textAlign: value });
        }
      });
      canvas.renderAll();
    },
    getActiveTextAlign: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return "left";
      // @ts-ignore
      return selectedObject.get("textAlign") || "left";
    },
    changeFontUnderline: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ underline: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontUnderline: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return false;
      // @ts-ignore
      return selectedObject.get("underline") || false;
    },
    changeFontLinethrough: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ linethrough: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontLinethrough: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return false;
      // @ts-ignore
      return selectedObject.get("linethrough") || false;
    },
    changeFontStyle: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontStyle: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontStyle: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return "normal";
      // @ts-ignore
      return selectedObject.get("fontStyle") || "normal";
    },
    changeFontWeight: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontWeight: value });
        }
      });
      canvas.renderAll();
    },
    changeOpacity: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ opacity: value });
      });
      canvas.renderAll();
    },
    bringForward: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.bringForward(object);
      });
      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });
      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    changeFontFamily: (value: string) => {
      setFontFamily(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontFamily: value });
        }
      });
      canvas.renderAll();
    },
    changeFillColor: (value: string) => {
      setFillColor(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ fill: value });
      });
      canvas.renderAll();
    },
    changeStrokeColor: (value: string) => {
      setStrokeColor(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          object.set({ fill: value });
          return;
        }
        object.set({ stroke: value });
      });
      canvas.freeDrawingBrush.color = value;
      canvas.renderAll();
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeWidth: value });
      });
      canvas.freeDrawingBrush.width = value;
      canvas.renderAll();
    },
    changeStrokeDashArray: (value: number[]) => {
      setStrokeDashArray(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeDashArray: value });
      });
      canvas.renderAll();
    },
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });
      addToCanvas(object);
    },
    addInverseTriangle: () => {
      const HEIGHT = TRIANGLE_OPTIONS.height;
      const WIDTH = TRIANGLE_OPTIONS.width;
      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH / 2, y: HEIGHT },
        ],
        {
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      addToCanvas(object);
    },
    addDiamond: () => {
      const HEIGHT = DIAMOND_OPTIONS.height;
      const WIDTH = DIAMOND_OPTIONS.width;
      const object = new fabric.Polygon(
        [
          { x: WIDTH / 2, y: 0 },
          { x: WIDTH, y: HEIGHT / 2 },
          { x: WIDTH / 2, y: HEIGHT },
          { x: 0, y: HEIGHT / 2 },
        ],
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      addToCanvas(object);
    },
    canvas,
    getActiveFontWeight: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return FONT_WEIGHT;
      // @ts-ignore
      return selectedObject.get("fontWeight") || FONT_WEIGHT;
    },
    getActiveFontFamily: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return fontFamily;
      // @ts-ignore
      return selectedObject.get("fontFamily") || fontFamily;
    },
    getActiveFillColor: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return fillColor;
      return selectedObject.get("fill") || fillColor;
    },
    getActiveStrokeColor: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return strokeColor;
      return selectedObject.get("stroke") || strokeColor;
    },
    getActiveStrokeWidth: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return strokeWidth;
      return selectedObject.get("strokeWidth") || strokeWidth;
    },
    getActiveStrokeDashArray: () => {
      const selectedObject = selectedObjects[0];
      if (!selectedObject) return strokeDashArray;
      return selectedObject.get("strokeDashArray") || strokeDashArray;
    },
    selectedObjects,
  };
};

export const useEditor = ({
  defaultState,
  defaultHeight,
  defaultWidth,
  clearSelectionCallback,
  saveCallback,
}: EditorHookProps) => {
  const initialState = useRef(defaultState);
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

  // Função save básica
  const save = useCallback((skip = false) => {
    if (!canvas || !saveCallback) return;
    const fabricState = canvas.toJSON(JSON_KEYS);
    const workspace = canvas.getObjects().find(obj => obj.name === "clip") as fabric.Rect | undefined;
    const width = workspace?.width ?? canvas.getWidth();
    const height = workspace?.height ?? canvas.getHeight();
    const savePayload = {
      json: JSON.stringify(fabricState),
      width,
      height,
    };
    saveCallback(savePayload);
  }, [canvas, saveCallback]);

  // História básica (sem loops)
  const canvasHistory = useRef<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const undo = useCallback(() => {
    if (historyIndex > 0 && canvas) {
      const previousState = canvasHistory.current[historyIndex - 1];
      try {
        canvas.loadFromJSON(JSON.parse(previousState), () => {
          canvas.renderAll();
          setHistoryIndex(prev => prev - 1);
        });
      } catch (error) {
        console.error("Error undoing:", error);
      }
    }
  }, [canvas, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < canvasHistory.current.length - 1 && canvas) {
      const nextState = canvasHistory.current[historyIndex + 1];
      try {
        canvas.loadFromJSON(JSON.parse(nextState), () => {
          canvas.renderAll();
          setHistoryIndex(prev => prev + 1);
        });
      } catch (error) {
        console.error("Error redoing:", error);
      }
    }
  }, [canvas, historyIndex]);

  // Clipboard básico
  const [clipboard, setClipboard] = useState<string | null>(null);

  const copy = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      const serialized = JSON.stringify(activeObjects);
      setClipboard(serialized);
    }
  }, [canvas]);

  const paste = useCallback(() => {
    if (!canvas || !clipboard) return;
    try {
      const objects = JSON.parse(clipboard);
      console.log("Paste:", objects);
    } catch (error) {
      console.error("Error pasting:", error);
    }
  }, [canvas, clipboard]);

  // Auto-zoom básico
  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;
    const workspace = canvas.getObjects().find(obj => obj.name === "clip");
    if (!workspace) return;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const workspaceWidth = workspace.width || 900;
    const workspaceHeight = workspace.height || 1200;
    const scaleX = containerWidth / workspaceWidth;
    const scaleY = containerHeight / workspaceHeight;
    const scale = Math.min(scaleX, scaleY) * 0.85;
    canvas.setZoom(scale);
    canvas.centerObject(workspace);
    canvas.renderAll();
  }, [canvas, container]);

  // Canvas events básicos
  useEffect(() => {
    if (!canvas) return;
    const handleSelection = () => {
      const activeObjects = canvas.getActiveObjects();
      setSelectedObjects(activeObjects);
    };
    const handleSelectionCleared = () => {
      setSelectedObjects([]);
      if (clearSelectionCallback) {
        clearSelectionCallback();
      }
    };
    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleSelectionCleared);
    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleSelectionCleared);
    };
  }, [canvas, clearSelectionCallback]);

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({
        save,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < canvasHistory.current.length - 1,
        autoZoom,
        copy,
        paste,
        canvas,
        fillColor,
        strokeWidth,
        strokeColor,
        setFillColor,
        setStrokeColor,
        setStrokeWidth,
        strokeDashArray,
        selectedObjects,
        setStrokeDashArray,
        fontFamily,
        setFontFamily,
      });
    }
    return undefined;
  }, [
    canvas,
    save,
    undo,
    redo,
    historyIndex,
    autoZoom,
    copy,
    paste,
    fillColor,
    strokeWidth,
    strokeColor,
    selectedObjects,
    strokeDashArray,
    fontFamily,
  ]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: initialWidth.current || 900,
        height: initialHeight.current || 1200,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.8)",
          blur: 5,
        }),
      });

      const containerWidth = initialContainer?.offsetWidth || 800;
      const containerHeight = initialContainer?.offsetHeight || 600;

      initialCanvas.setWidth(containerWidth);
      initialCanvas.setHeight(containerHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      // História inicial
      const currentState = JSON.stringify(initialCanvas.toJSON(JSON_KEYS));
      canvasHistory.current = [currentState];
      setHistoryIndex(0);

      // Carregar estado inicial se existir
      if (initialState.current) {
        setTimeout(() => {
          try {
            const state = typeof initialState.current === 'string' 
              ? JSON.parse(initialState.current) 
              : initialState.current;
            initialCanvas.loadFromJSON(state, () => {
              initialCanvas.renderAll();
            });
          } catch (error) {
            console.error("Error loading initial state:", error);
          }
        }, 100);
      }
    },
    []
  );

  return { init, editor };
};