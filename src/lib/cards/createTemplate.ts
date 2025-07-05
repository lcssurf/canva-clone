import Pica from "pica";

export async function generateEditorialBoldTemplate(
  baseTemplate: any,
  text: string,
  profile: { username: string; image: string },
  isFirstCard: boolean,
  pageNumber: number,
  totalPages: number
): Promise<string> {
  // Clona o baseTemplate para não modificar o objeto original
  //   const fabricTemplate = JSON.parse(JSON.stringify(baseTemplate));

  // Define a largura padrão para os objetos dentro deste template
  const objectWidth = 1080;
  const objectHeight = 1080; // Altura fixa para todos os objetos
  const padding = 60;

  const fabricTemplate = {
    version: "5.3.0",
    objects: [],
    clipPath: {
      type: "rect",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 752.5,
      top: -215.5,
      width: 1080,
      height: 1080,
      fill: "white",
      stroke: null,
      strokeWidth: 1,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: {
        color: "rgba(0,0,0,0.8)",
        blur: 5,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        nonScaling: false,
      },
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      skewX: 0,
      skewY: 0,
      rx: 0,
      ry: 0,
      selectable: true,
      hasControls: true,
    },
  };

  //   // 1. 🔳 Retângulo de fundo com gradiente
  let gradientFill;
  if (isFirstCard) {
    // Primeira página: gradiente preto para branco
    gradientFill = {
      type: "linear",
      coords: {
        x1: 0,
        y1: 0,
        x2: objectWidth,
        y2: objectHeight, // Coordenadas do gradiente baseadas no tamanho do objeto
      },
      colorStops: [
        { offset: 0, color: "#000000" },
        { offset: 0.9, color: "#ffffff" },
      ],
    };
  } else {
    // Páginas de conteúdo: gradiente azul para preto
    gradientFill = {
      type: "linear",
      coords: {
        x1: 0,
        y1: 0,
        x2: objectWidth,
        y2: objectHeight,
      },
      colorStops: [
        { offset: 0, color: "#1e40af" },
        { offset: 0.9, color: "#000000" },
      ],
    };
  }

  const fundoBranco = {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5,
    top: -215.5,
    width: 1080,
    height: 1080,
    fill: "white",
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: "butt",
    strokeDashOffset: 0,
    strokeLineJoin: "miter",
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: {
      color: "rgba(0,0,0,0.8)",
      blur: 5,
      offsetX: 0,
      offsetY: 0,
      affectStroke: false,
      nonScaling: false,
    },
    visible: true,
    backgroundColor: "",
    fillRule: "nonzero",
    paintFirst: "fill",
    globalCompositeOperation: "source-over",
    skewX: 0,
    skewY: 0,
    rx: 0,
    ry: 0,
    name: "clip",
    selectable: false,
    hasControls: false,
  };

  fabricTemplate.objects.push(fundoBranco);

  const backgroundRect = {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5,
    top: -215.5,
    width: 1080,
    height: 1080,
    fill: gradientFill,
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: "butt",
    strokeDashOffset: 0,
    strokeLineJoin: "miter",
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: {
      color: "rgba(0,0,0,0.8)",
      blur: 5,
      offsetX: 0,
      offsetY: 0,
      affectStroke: false,
      nonScaling: false,
    },
    visible: true,
    backgroundColor: "",
    fillRule: "nonzero",
    paintFirst: "fill",
    globalCompositeOperation: "source-over",
    skewX: 0,
    skewY: 0,
    rx: 0,
    ry: 0,
    name: "clip",
    selectable: true,
    hasControls: true,
  };

  fabricTemplate.objects.push(backgroundRect);

  // 2. 👤 Profile Image (maior, no canto superior esquerdo) - apenas se NÃO for a primeira carta
  if (
    !isFirstCard &&
    profile.image &&
    profile.username &&
    profile.image.startsWith("data:image/")
  ) {
    // Foto de perfil, preenchendo todo o círculo
    const processedBase64 = await preprocessWithPica(profile.image, 150);
    // console.log("Processed Base64:", processedBase64);

    const img = new Image();
    img.src = processedBase64;
    await img.decode();
    console.log(
      "Processed image size:",
      img.naturalWidth,
      "x",
      img.naturalHeight
    );

    const targetWidth = 150;
    const scale = targetWidth / img.naturalWidth;
    const targetHeight = img.naturalHeight * scale;

    console.log("Target dimensions:", scale, "x", targetHeight);
    


    const profileImage = {
      type: "image",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 804.29,
      top: -155.6,
      width: img.naturalWidth,
      height: img.naturalHeight,
      fill: "rgb(0,0,0)",
      stroke: null,
      strokeWidth: 0,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: null,
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      skewX: 0,
      skewY: 0,
      cropX: 0,
      cropY: 0,
      selectable: true,
      hasControls: true,
      src: processedBase64, // A imagem já deve ser base64 aqui
      crossOrigin: "anonymous",
      filters: [],
    };
    fabricTemplate.objects.push(profileImage);

    // Username (ao lado da imagem, maior)
    const usernameText = {
      type: "textbox",
      version: "5.3.0",
      originX: "left",
      originY: "top",
      left: 804.29 + 120 + padding, // 20 pixels de espaçamento
      top: -155.6 + img.naturalHeight - 50,
      width: 149.44,
      height: 36.16,
      fill: "white",
      stroke: null,
      strokeWidth: 1,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: null,
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      skewX: 0,
      skewY: 0,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontSize: 32,
      text: `@${profile.username}`,
      underline: false,
      overline: false,
      linethrough: false,
      textAlign: "left",
      fontStyle: "normal",
      lineHeight: 1.16,
      textBackgroundColor: "",
      charSpacing: 0,
      styles: [],
      direction: "ltr",
      path: null,
      pathStartOffset: 0,
      pathSide: "left",
      pathAlign: "baseline",
      minWidth: 20,
      splitByGrapheme: false,
      selectable: true,
      hasControls: true,
      editable: true,
    };
    fabricTemplate.objects.push(usernameText);
  }

  const calculateFontSize = (text: string, isFirstCard: boolean) => {
  const length = text.length;
  if (isFirstCard) {
    if (length > 150) return 32;
    if (length > 100) return 38;
    if (length > 50) return 45;
    return 52;  // Max 52 em vez de 75
  } else {
    if (length > 200) return 28;
    if (length > 100) return 35;
    return 42;  // Max 42 em vez de 60
  }
};
  const fontSize = calculateFontSize(text, isFirstCard);
  const fontWeight = isFirstCard ? 800 : 600;  // Menos pesado
  // Username (ao lado da imagem, maior)
  const textbox = {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 804.29 , // 20 pixels de espaçamento
    top: isFirstCard ? 360 : 360, 
    width: 1080 - (padding * 2),
    height: 600,
    fill: "rgba(255, 255, 255, 1)",
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: "butt",
    strokeDashOffset: 0,
    strokeLineJoin: "miter",
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: "",
    fillRule: "nonzero",
    paintFirst: "fill",
    globalCompositeOperation: "source-over",
    skewX: 0,
    skewY: 0,
    fontFamily: "Arial Black",
    fontWeight: isFirstCard ? 900 : 700,
    fontSize: fontSize,
    text: text.trim(),
    underline: false,
    overline: false,
    linethrough: false,
    textAlign: "left",
    fontStyle: "normal",
    lineHeight: 1.16,
    textBackgroundColor: "",
    charSpacing: 0,
    styles: [],
    direction: "ltr",
    path: null,
    pathStartOffset: 0,
    pathSide: "left",
    pathAlign: "baseline",
    minWidth: 20,
    splitByGrapheme: false,
    selectable: true,
    hasControls: true,
    editable: true,
  };
  fabricTemplate.objects.push(textbox);

  console.log("Fabric Template:", fabricTemplate);

  return fabricTemplate;
}

/**
 * Central crop + resize para um square de `size` px.
 * @param {string} base64 — sua imagem original
 * @param {number} size — ex: 120
 * @returns {Promise<string>} — novo base64 já 120×120
 */
async function preprocessWithPica(base64, size = 120) {
  // 1) Carrega a imagem
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = base64;
  await img.decode();

  // 2) Crop central num offscreen canvas
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  const cropCanvas = new OffscreenCanvas(side, side);
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(img, sx, sy, side, side, 0, 0, side, side);

  // 3) Redimensiona primeiro com Pica
  const resizedCanvas = new OffscreenCanvas(size, size);
  await Pica().resize(cropCanvas, resizedCanvas);

  // 4) Cria o canvas final com máscara circular
  const finalCanvas = new OffscreenCanvas(size, size);
  const finalCtx = finalCanvas.getContext("2d");
  
  // Aplica a máscara circular
  finalCtx.save();
  finalCtx.beginPath();
  finalCtx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  finalCtx.clip();
  
  // Desenha a imagem redimensionada dentro da máscara
  finalCtx.drawImage(resizedCanvas, 0, 0);
  finalCtx.restore();

  // 5) Converte para base64
  const blob = await finalCanvas.convertToBlob({ type: 'image/png' });
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}





// export const generateEditorialBoldTemplate = (
//   baseTemplate: any,
//   text: string,
//   profile: { username: string; image: string },
//   isFirstCard: boolean,
//   pageNumber: number,
//   totalPages: number
// ) => {

//   // Clona o baseTemplate para não modificar o objeto original
//   const fabricTemplate = JSON.parse(JSON.stringify(baseTemplate));

//   // Define a largura padrão para os objetos dentro deste template
//   const objectWidth = 1080;
//   const objectHeight = 1080; // Altura fixa para todos os objetos
//   const padding = 60;

//   // 1. 🔳 Retângulo de fundo com gradiente
//   let gradientFill;
//   if (isFirstCard) {
//     // Primeira página: gradiente preto para branco
//     gradientFill = {
//       type: 'linear',
//       coords: {
//         x1: 0, y1: 0,
//         x2: 0, y2: objectHeight // Coordenadas do gradiente baseadas no tamanho do objeto
//       },
//       colorStops: [
//         { offset: 0, color: '#000000' },
//         { offset: 1, color: '#ffffff' }
//       ]
//     };
//   } else {
//     // Páginas de conteúdo: gradiente azul para preto
//     gradientFill = {
//       type: 'linear',
//       coords: {
//         x1: 0, y1: 0,
//         x2: objectWidth, y2: 1200
//       },
//       colorStops: [
//         { offset: 0, color: '#1e40af' },
//         { offset: 1, color: '#000000' }
//       ]
//     };
//   }

//   const backgroundRect = {
//     type: "rect",
//     version: "5.3.0",
//     originX: "left",
//     originY: "top",
//     left: 0,
//     top: 0,
//     width: objectWidth, // Largura definida
//     height: objectHeight,
//     fill: gradientFill, // Usando o objeto de gradiente Fabric.js
//     stroke: null,
//     strokeWidth: 1,
//     scaleX: 1,
//     scaleY: 1,
//     angle: 0,
//     flipX: false,
//     flipY: false,
//     opacity: 1,
//     shadow: null,
//     visible: true,
//     selectable: false, // Fundo geralmente não é selecionável
//     hasControls: false
//   };

//   fabricTemplate.objects.push(backgroundRect);

//   // 2. 👤 Profile Image (maior, no canto superior esquerdo) - apenas se NÃO for a primeira carta
//   if (!isFirstCard && profile.image && profile.username && profile.image.startsWith('data:image/')) {
//     const profileImage = {
//       type: "image",
//       version: "5.3.0",
//       originX: "center",
//       originY: "center",
//       left: padding + 60,
//       top: 80,
//       width: 120,
//       height: 120,
//       fill: "rgb(0,0,0)",
//       stroke: "rgba(255,255,255,1)",
//       strokeWidth: 4,
//       scaleX: 1,
//       scaleY: 1,
//       angle: 0,
//       flipX: false,
//       flipY: false,
//       opacity: 1,
//       shadow: null,
//       visible: true,
//       src: profile.image, // A imagem já deve ser base64 aqui
//       // crossOrigin: "anonymous",
//       // filters: [],
//       selectable: true,
//       hasControls: true
//     };
//     fabricTemplate.objects.push(profileImage);

//     // Username (ao lado da imagem, maior)
//     const usernameText = {
//       type: "textbox",
//       version: "5.3.0",
//       originX: "left",
//       originY: "center",
//       left: 360,
//       top: -180,
//       width: 300,
//       height: 60,
//       fill: "rgba(255, 255, 255, 1)",
//       fontFamily: "Arial Black",
//       fontWeight: 700,
//       fontSize: 24,
//       text: `@${profile.username}`,
//       textAlign: "left",
//       lineHeight: 1.16,
//       selectable: true,
//       hasControls: true,
//       editable: true
//     };
//     fabricTemplate.objects.push(usernameText);
//   }

//   const calculateFontSize = (text: string, isFirstCard: boolean) => {
//   const length = text.length;
//   if (isFirstCard) {
//     if (length > 150) return 32;
//     if (length > 100) return 38;
//     if (length > 50) return 45;
//     return 52;  // Max 52 em vez de 75
//   } else {
//     if (length > 200) return 28;
//     if (length > 100) return 35;
//     return 42;  // Max 42 em vez de 60
//   }
// };

//   // 3. 📝 Texto principal (posicionado no centro-baixo)
//   const fontSize = calculateFontSize(text, isFirstCard);
//   const fontWeight = isFirstCard ? 800 : 600;  // Menos pesado

//   // Posição do texto ajustada
//   const textTop = isFirstCard ? 100 : 50; // Mais para baixo se for a primeira carta, senão um pouco mais acima

//   const mainText = {
//     type: "textbox",
//     version: "5.3.0",
//     originX: "left",
//     originY: "top",
//     left: padding,
//     top: isFirstCard ? 200 : 180,
//     width: 1080 - (padding * 2),
//     height: 600,
//     fill: "rgba(255, 255, 255, 1)",
//     fontFamily: "Arial Black",
//     fontWeight: isFirstCard ? 900 : 700, // Corrigido: valor para isFirstCard true
//     fontSize: fontSize,
//     text: text.trim(),
//     textAlign: isFirstCard ? "center" : "left",
//     lineHeight: 1.2,
//     selectable: true,
//     hasControls: true,
//     editable: true
//   };
//   fabricTemplate.objects.push(mainText);

//   // 4. 📄 Indicador de página (canto inferior direito)
//   const pageIndicator = {
//     type: "textbox",
//     version: "5.3.0",
//     originX: "right",
//     originY: "bottom",
//     left: 1050,
//     top: 880,
//     width: 100,
//     height: 30,
//     fill: "rgba(255, 255, 255, 0.8)",
//     fontFamily: "Arial",
//     fontWeight: 500,
//     fontSize: 16,
//     text: `${pageNumber}/${totalPages}`,
//     textAlign: "right",
//     lineHeight: 1.16,
//     selectable: true,
//     hasControls: true,
//     editable: true
//   };
//   fabricTemplate.objects.push(pageIndicator);

//   return fabricTemplate;
// };
