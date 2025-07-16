import Pica from "pica";
import { createSimpleFallback, processImageSmart } from "./processImage";

export async function generateEditorialBoldTemplate(
  baseTemplate: any,
  text: string,
  profile: { username: string; image: string },
  isFirstCard: boolean,
  pageNumber: number,
  totalPages: number
): Promise<any> {
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

    // const targetWidth = 150;
    // const scale = targetWidth / img.naturalWidth;
    // const targetHeight = img.naturalHeight * scale;

    // console.log("Target dimensions:", scale, "x", targetHeight);

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
      return 52; // Max 52 em vez de 75
    } else {
      if (length > 200) return 28;
      if (length > 100) return 35;
      return 42; // Max 42 em vez de 60
    }
  };
  const fontSize = calculateFontSize(text, isFirstCard);
  const fontWeight = isFirstCard ? 800 : 600; // Menos pesado
  // Username (ao lado da imagem, maior)
  const textbox = {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 804.29, // 20 pixels de espaçamento
    top: isFirstCard ? 360 : 360,
    width: 1080 - padding * 2,
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

export async function generateTwitterTemplate(
  baseTemplate: any,
  text: string,
  profile: { username: string; image: string },
  isFirstCard: boolean,
  pageNumber: number,
  totalPages: number,
  link: string
): Promise<any> {
  // Define a largura padrão para os objetos dentro deste template
  const objectWidth = 1080;
  const objectHeight = 1350; // Altura fixa para todos os objetos
  const padding = 100;

  console.log("Generating Twitter template with profile:", profile);

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
      width: objectWidth,
      height: objectHeight,
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

  const fundoBranco = {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5,
    top: -215.5,
    width: objectWidth,
    height: objectHeight,
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
    selectable: true,
    hasControls: true,
  };

  fabricTemplate.objects.push(fundoBranco);

  console.log("Fabric Template with white background:", fabricTemplate);

  // Foto de perfil, preenchendo todo o círculo
  const processedBase64 = await preprocessWithPica(profile.image, 200);
  const img = new Image();
  img.src = processedBase64;
  await img.decode();
  console.log(
    "Processed image size:",
    img.naturalWidth,
    "x",
    img.naturalHeight
  );

  console.log("Processed Base64:", processedBase64);

  const targetWidth = 200;
  const scale = targetWidth / img.naturalWidth;
  const targetHeight = img.naturalHeight * scale;

  const profileImage = {
    type: "image",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5 + padding,
    top: -215.5 + padding + 75,
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

  const verifiedIconUrl =
    "https://miro.medium.com/v2/resize:fit:1400/1*FB9KwfU1r-fhk45LxHbx1w.png";
  const processedVerifiedBase64 = await preprocessWithPica(verifiedIconUrl, 50);

  const verifiedIcon = new Image();
  verifiedIcon.src = processedVerifiedBase64;
  await verifiedIcon.decode();

  console.log("Processed Verified Icon Base64:", processedVerifiedBase64);

  const verifiedImage = {
    type: "image",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5 + padding + img.naturalWidth - verifiedIcon.naturalWidth / 2,
    top: -215.5 + padding + verifiedIcon.naturalHeight / 2 + 75,
    width: verifiedIcon.naturalWidth,
    height: verifiedIcon.naturalHeight,
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
    src: processedVerifiedBase64, // A imagem já deve ser base64 aqui
    crossOrigin: "anonymous",
    filters: [],
  };
  fabricTemplate.objects.push(verifiedImage);

  // Username (ao lado da imagem, maior)
  const usernameText = {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5 + padding + img.naturalWidth + 48,
    top: -215.5 + padding + img.naturalHeight / 3 + 60,
    width: 700,
    height: 80,
    fill: "rgba(0, 0, 0, 1)",
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
    fontFamily: "Poppins",
    fontWeight: 900,
    fontSize: 48,
    text: profile.username,
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

  // Username (ao lado da imagem, maior)
  const usernameText2 = {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5 + padding + img.naturalWidth + 48,
    top: -215.5 + padding + img.naturalHeight / 3 + 16 + 32 + 60,
    width: 200,
    height: 50,
    fill: "rgba(119, 119, 119, 1)",
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
    fontFamily: "Poppins",
    fontWeight: "normal",
    fontSize: 32,
    text: `@${profile.username.toLowerCase().replace(/\s+/g, "")}`,
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
  fabricTemplate.objects.push(usernameText2);

  //   const textbox = {
  //   type: "textbox",
  //   version: "5.3.0",
  //   originX: "left",
  //   originY: "top",
  //   left: 752.5 + padding,
  //   top: (-215.5 + (padding * 2) + img.naturalHeight + 75),
  //   width: (1080 - (padding * 2)),
  //   height: 600,
  //   fill: "rgba(0, 0, 0, 1)",
  //   stroke: null,
  //   strokeWidth: 1,
  //   strokeDashArray: null,
  //   strokeLineCap: "butt",
  //   strokeDashOffset: 0,
  //   strokeLineJoin: "miter",
  //   strokeUniform: false,
  //   strokeMiterLimit: 4,
  //   scaleX: 1,
  //   scaleY: 1,
  //   angle: 0,
  //   flipX: false,
  //   flipY: false,
  //   opacity: 1,
  //   shadow: null,
  //   visible: true,
  //   backgroundColor: "",
  //   fillRule: "nonzero",
  //   paintFirst: "fill",
  //   globalCompositeOperation: "source-over",
  //   skewX: 0,
  //   skewY: 0,
  //   fontFamily: "Poppins",
  //   fontWeight: 900,
  //   fontSize: 48,
  //   text: text.trim(),
  //   underline: false,
  //   overline: false,
  //   linethrough: false,
  //   textAlign: "center",
  //   fontStyle: "normal",
  //   lineHeight: 1.16,
  //   textBackgroundColor: "",
  //   charSpacing: 0,
  //   styles: [],
  //   direction: "ltr",
  //   path: null,
  //   pathStartOffset: 0,
  //   pathSide: "left",
  //   pathAlign: "baseline",
  //   minWidth: 20,
  //   splitByGrapheme: false,
  //   selectable: true,
  //   hasControls: true,
  //   editable: true,
  // };
  // fabricTemplate.objects.push(textbox);

  pushSmartText(fabricTemplate, text.trim());

  try {
    const image = String(link);
  console.log("Image link for Twitter template:", image);
  const processedImageBase64 = await processImageSmart(image, 880, 495, true);
  console.log("Processed Image Base64:", processedImageBase64);
  
  // console.log("Original 'link' passed to preprocessWithPica:", image.substring(0, 100) + "...", "Length:", image.length);
  // const processedImageBase64 = await preprocessWithPica(
  //   image,
  //   objectWidth - padding * 2,
  //   435
  // );

  // const imageIcon = new Image();
  // imageIcon.src = processedImageBase64;
  // await imageIcon.decode();

  // console.log("Processed Image Icon Base64:", imageIcon);

  const postImage = {
    type: "image",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5 + padding,
    top: -215.5 + 750,
    width: 880,//imageIcon.naturalWidth,
    height: 495,//imageIcon.naturalHeight,
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
    src: processedImageBase64, // A imagem já deve ser base64 aqui
    crossOrigin: "anonymous",
    filters: [],
  };
  fabricTemplate.objects.push(postImage);

  } catch (error) {

    const fallbackSrc = createSimpleFallback(880, 495);
    const postImage = {
    type: "image",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 752.5 + padding,
    top: -215.5 + 750,
    width: 880,//imageIcon.naturalWidth,
    height: 495,//imageIcon.naturalHeight,
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
    src: fallbackSrc, // A imagem já deve ser base64 aqui
    crossOrigin: "anonymous",
    filters: [],
  };
  fabricTemplate.objects.push(postImage);

  }
  

  return fabricTemplate;
}
/**
 * Realiza um crop central e redimensiona uma imagem, com opção de máscara circular.
 * A função é robusta e aceita Data URL, base64 puro, ou um link externo (https://...).
 * @param {string} imageSource - A imagem original (Data URL, base64 puro, ou URL externa).
 * @param {number} sizeOrW - A largura final (ou o lado, se for um quadrado). Ex: 120.
 * @param {number} [h] - A altura final. Se fornecida, a imagem será retangular.
 * @returns {Promise<string>} - A nova imagem como uma Data URL completa (ex: "data:image/png;base64,...").
 */
async function preprocessWithPica(
  imageSource: string,
  sizeOrW: number = 120,
  h?: number
): Promise<string> {
  let sourceForImageElement: string;

  // ✅ CORREÇÃO: Lida com os 3 tipos de entrada: Data URL, URL externa e Base64 puro.
  if (imageSource.startsWith('data:')) {
    // Caso 1: Já é uma Data URL completa.
    sourceForImageElement = imageSource;
  } else if (imageSource.startsWith('http')) {
    // Caso 2: É uma URL externa (http ou https).
    sourceForImageElement = imageSource;
  } else {
    // Caso 3: Assume que é uma string Base64 pura e adiciona o cabeçalho.
    const mimeType = imageSource.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    console.log("Assuming MIME type for large Base64:", mimeType); 
    sourceForImageElement = `data:${mimeType};base64,${imageSource}`;
  }

  console.log("Source for Image Element (inside preprocessWithPica):", sourceForImageElement); // Adicione esta linha
  // 1) Carrega a imagem usando a fonte correta
  const img = new Image();
  // 'crossOrigin' é essencial para carregar imagens de outras origens em um canvas.
  img.crossOrigin = "anonymous";
  img.src = sourceForImageElement;
  await img.decode();

  // 2) Crop central em um canvas fora da tela (OffscreenCanvas)
  const isSquare = typeof h !== "number";
  const cropWidth = isSquare ? Math.min(img.naturalWidth, img.naturalHeight) : sizeOrW;
  const cropHeight = isSquare ? cropWidth : h;

  const sx = (img.naturalWidth - cropWidth) / 2;
  const sy = (img.naturalHeight - cropHeight) / 2;

  const cropCanvas = new OffscreenCanvas(cropWidth, cropHeight);
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) {
    throw new Error("Falha ao obter o contexto 2D para o canvas de crop.");
  }
  cropCtx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // 3) Redimensiona a imagem recortada usando Pica para alta qualidade
  const targetW = sizeOrW;
  const targetH = isSquare ? sizeOrW : h;
  const resizedCanvas = new OffscreenCanvas(targetW, targetH);
  await Pica().resize(cropCanvas, resizedCanvas);

  // 4) Cria o canvas final, aplicando máscara circular se for um quadrado
  const finalCanvas = new OffscreenCanvas(targetW, targetH);
  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) {
    throw new Error("Falha ao obter o contexto 2D para o canvas final.");
  }

  if (isSquare) {
    // Aplica a máscara circular
    finalCtx.save();
    finalCtx.beginPath();
    finalCtx.arc(targetW / 2, targetH / 2, targetW / 2, 0, Math.PI * 2);
    finalCtx.clip();
    finalCtx.drawImage(resizedCanvas, 0, 0);
    finalCtx.restore();
  } else {
    // Desenha a imagem retangular sem máscara
    finalCtx.drawImage(resizedCanvas, 0, 0);
  }

  // 5) Converte o canvas final para uma Data URL completa e a retorna
  const blob = await finalCanvas.convertToBlob({ type: "image/png" });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
}

// =======================================================================
// NOVA FUNÇÃO AUXILIAR - SEM DEPENDÊNCIA DE CANVAS
// =======================================================================

/**
 * Estima a altura de um objeto Textbox do Fabric.js sem renderizá-lo.
 * Isso funciona calculando quantas linhas o texto ocuparia.
 * @param text O texto a ser medido.
 * @param fontSize O tamanho da fonte em pixels.
 * @param fontWeight A "grossura" da fonte (e.g., 400 para normal, 900 para bold).
 * @param width A largura da caixa de texto.
 * @param lineHeight O multiplicador da altura da linha.
 * @returns A altura estimada em pixels.
 */
function estimateTextboxHeight(
  text: string,
  fontSize: number,
  fontWeight: number,
  width: number,
  lineHeight: number
): number {
  if (!text) {
    return 0;
  }

  // Fator de ajuste para a largura média de um caractere em relação ao seu tamanho.
  // Fontes mais "bold" (pesadas) ocupam mais espaço horizontal.
  // Este "número mágico" (0.55-0.6) é uma heurística razoável para fontes como Poppins/Arial.
  const avgCharWidthFactor = fontWeight >= 700 ? 0.6 : 0.55;
  const charsPerLine = Math.floor(width / (fontSize * avgCharWidthFactor));

  const words = text.split(/\s+/);
  if (words.length === 0) {
    return 0;
  }

  let lineCount = 1;
  let currentLineLength = 0;

  for (const word of words) {
    // Se a palavra sozinha já estoura a linha, ela ocupará uma linha própria (ou mais)
    if (word.length > charsPerLine) {
      lineCount += Math.ceil(word.length / charsPerLine) - 1;
    }

    const space = currentLineLength > 0 ? 1 : 0; // Adiciona um espaço se não for o início da linha

    if (currentLineLength + word.length + space > charsPerLine) {
      lineCount++;
      currentLineLength = word.length;
    } else {
      currentLineLength += word.length + space;
    }
  }

  return lineCount * fontSize * lineHeight;
}

/**
 * Gera e adiciona ao fabricTemplate dois objetos "textbox" (título e subtítulo),
 * ajustando dinamicamente o fontSize para que o texto completo caiba em uma altura máxima.
 * A função agora também divide subtítulos muito longos ao meio, inserindo uma linha em branco.
 * Não requer uma instância de `fabric.Canvas`.
 *
 * @param fabricTemplate O objeto de template do Fabric.js ao qual as caixas de texto serão adicionadas.
 * @param fullText O texto completo a ser dividido e formatado.
 */
function pushSmartText(fabricTemplate: { objects: any[] }, fullText: string) {
    // --- Constantes de Layout ---
    const padding = 100;
    const left = 752.5 + padding;
    // 1) Primeiro, verifique se há subtexto
    const frases = fullText.split(/(?<=\.\s)/);
    const headlineText = (frases.shift() || "").trim();
    // ALTERAÇÃO: Mudou de 'const' para 'let' para permitir a modificação
    let subText = frases.join("").trim();

    // Ajusta topBase baseado na presença de subtexto
    const baseTop = -215.5 + (padding * 2) + 200 + 75; // 259.5
    const topBase = subText ? baseTop - 50 : baseTop; // -50px se houver subtexto
    const width = 1080 - padding * 2; // 880px
    const maxHeightPerText = 300;
    const maxTotalHeight = 600;
    const gap = 20; // Espaço entre título e subtítulo
    const minFontSize = 16;

    // --- Valores Iniciais ---
    let initialHeadSz = 48;
    let initialSubSz = 32;

    // --- NOVO: Lógica para dividir parágrafos longos ---
    if (subText) {
        // Estima a altura do subtítulo com a fonte inicial para decidir se é "longo"
        // Assumindo que a função `estimateTextboxHeight` está disponível no escopo
        const estimatedInitialHeight = estimateTextboxHeight(subText, initialSubSz, 400, width, 1.2);

        // Se a altura estimada ultrapassar o máximo, divida o parágrafo.
        // Adicionamos uma pequena margem (ex: > maxHeightPerText) para acionar a divisão.
        if (estimatedInitialHeight > maxHeightPerText) {
            console.log("Subtítulo longo detectado. Dividindo ao meio.");
            const middleIndex = Math.floor(subText.length / 2);
            // Procura o espaço mais próximo (e anterior) ao meio do texto para evitar quebrar palavras
            let splitIndex = subText.lastIndexOf(' ', middleIndex);

            // Se não houver espaço (texto muito estranho com uma única palavra longa), divide no meio
            if (splitIndex === -1) {
                splitIndex = middleIndex;
            }

            const part1 = subText.substring(0, splitIndex).trim();
            const part2 = subText.substring(splitIndex).trim();

            // Remonta o subtítulo com uma linha em branco entre as duas partes
            subText = `${part1}\n\n${part2}`;
        }
    }
    // --- FIM DA NOVA LÓGICA ---

    let headSz = initialHeadSz;
    let subSz = subText ? initialSubSz : 0;

    // 2) AJUSTE DE FONTES: Lógica original mantida
    // Ajusta o título para caber em 300px
    while (headSz > minFontSize) {
        const headH = estimateTextboxHeight(headlineText, headSz, 900, width, 1.16);
        if (headH <= maxHeightPerText) {
            break;
        }
        headSz--;
    }

    // Ajusta o subtítulo para caber em 300px (se existir)
    if (subText) {
        while (subSz > minFontSize) {
            const subH = estimateTextboxHeight(subText, subSz, 400, width, 1.2);
            if (subH <= maxHeightPerText) {
                break;
            }
            subSz--;
        }
    }

    // 3) Verifique se o total cabe em 600px e ajuste se necessário
    while (headSz > minFontSize || (subText && subSz > minFontSize)) {
        const headH = estimateTextboxHeight(headlineText, headSz, 900, width, 1.16);
        const subH = subText ? estimateTextboxHeight(subText, subSz, 400, width, 1.2) : 0;
        const totalHeight = headH + (subH > 0 ? gap + subH : 0);

        if (totalHeight <= maxTotalHeight) {
            break;
        }

        if (headSz >= subSz && headSz > minFontSize) {
            headSz--;
        } else if (subText && subSz > minFontSize) {
            subSz--;
        } else if (headSz > minFontSize) {
            headSz--;
        } else {
            break;
        }
    }

    // 4) Calcula as alturas finais
    const finalHeadH = estimateTextboxHeight(
        headlineText,
        headSz,
        900,
        width,
        1.16
    );
    const finalSubH = subText
        ? estimateTextboxHeight(subText, subSz, 400, width, 1.2)
        : 0;

    // 5) VERIFICAÇÃO FINAL: Log para depuração
    console.log(`Título: ${headSz}px, altura: ${finalHeadH.toFixed(2)}px`);
    if (subText) {
      console.log(`Subtítulo: ${subSz}px, altura: ${finalSubH.toFixed(2)}px`);
      console.log(`Altura Total (com gap): ${(finalHeadH + finalSubH + gap).toFixed(2)}px`);

    }

    // 6) Base de propriedades JSON para os textboxes
    const base = {
        type: "textbox",
        version: "5.3.0",
        originX: "left",
        originY: "top",
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
        underline: false,
        overline: false,
        linethrough: false,
        fontStyle: "normal",
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
        fontFamily: "Poppins",
        textAlign: "left",
        width,
        left,
    };

    // 7) Cria o objeto JSON para o título (headline)
    const headlineObj = {
        ...base,
        top: topBase,
        height: Math.min(finalHeadH, maxHeightPerText),
        fill: "rgba(0,0,0,1)",
        fontWeight: 900,
        fontSize: headSz,
        lineHeight: 1.16,
        text: headlineText,
    };
    fabricTemplate.objects.push(headlineObj);

    // 8) Cria o objeto JSON para o subtítulo (se existir)
    if (subText && finalSubH > 0) {
        const subObj = {
            ...base,
            top: topBase + Math.min(finalHeadH, maxHeightPerText) + gap,
            height: Math.min(finalSubH, maxHeightPerText),
            fill: "rgba(0,0,0,0.8)",
            fontWeight: 400,
            fontSize: subSz,
            lineHeight: 1.2,
            text: subText, // O subText agora contém o "\n\n" se foi dividido
        };
        fabricTemplate.objects.push(subObj);
    }
}