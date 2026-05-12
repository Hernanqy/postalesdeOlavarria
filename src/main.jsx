import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

const SCENES = [
  {
    id: "museo-ciencias",
    name: "Museo de Ciencias",
    postalTitle: "Explorador de Megafauna",
    postalSubtitle: "Olavarría · Descubrimiento prehistórico",
    lat: -36.8927,
    lng: -60.3225,
    radiusMeters: 400,
    theme: "megafauna",
    instruction:
      "Señalá hacia el gliptodonte como si lo hubieras descubierto.",
    poseHint: "Persona mirando o señalando hacia un costado",
    mainObject: "/assets/personajes/gliptodonte.png",
  },
  {
    id: "museo-emiliozzi",
    name: "Museo Emiliozzi",
    postalTitle: "Jefe de Taller",
    postalSubtitle: "Automovilismo histórico · Olavarría",
    lat: -36.8935,
    lng: -60.3215,
    radiusMeters: 400,
    theme: "emiliozzi",
    instruction:
      "Posá como jefe de taller, mirando hacia el auto de carrera.",
    poseHint: "Persona de frente o mirando hacia un costado",
    mainObject: null,
  },
];

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraBoxRef = useRef(null);
  const draggingGuideRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState("idle");
  const [finalImage, setFinalImage] = useState(null);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const [currentScene, setCurrentScene] = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending");

  const [peopleCount, setPeopleCount] = useState(1);

  const [guides, setGuides] = useState([
    {
      id: "person-1",
      label: "Persona 1",
      x: 56,
      y: 52,
      w: 34,
      h: 72,
    },
    {
      id: "person-2",
      label: "Persona 2",
      x: 72,
      y: 52,
      w: 30,
      h: 68,
    },
  ]);

  const isCameraScreen = status === "starting" || status === "camera";

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDraggingGuide);
    window.addEventListener("pointercancel", stopDraggingGuide);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDraggingGuide);
      window.removeEventListener("pointercancel", stopDraggingGuide);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  function detectLocation() {
    setError("");
    setLocationStatus("detecting");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setError("Este navegador no permite detectar ubicación.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const nearestScene = findNearestScene(userLat, userLng);

        if (nearestScene) {
          setCurrentScene(nearestScene);
          setLocationStatus("detected");
        } else {
          setLocationStatus("not-found");
          setError("No encontramos una postal activa cerca de tu ubicación.");
        }
      },
      (err) => {
        console.error(err);
        setLocationStatus("error");
        setError(
          "No se pudo detectar la ubicación. Activá el permiso de ubicación."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function findNearestScene(userLat, userLng) {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const scene of SCENES) {
      const distance = getDistanceInMeters(
        userLat,
        userLng,
        scene.lat,
        scene.lng
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = scene;
      }
    }

    if (nearest && nearestDistance <= nearest.radiusMeters) {
      return {
        ...nearest,
        distance: Math.round(nearestDistance),
      };
    }

    return null;
  }

  function getDistanceInMeters(lat1, lng1, lat2, lng2) {
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function useDemoScene() {
    setCurrentScene(SCENES[0]);
    setLocationStatus("detected");
    setError("");
  }

  async function startCamera() {
    if (!currentScene) {
      setError("Primero hay que detectar una postal activa cerca.");
      return;
    }

    setError("");
    setStatus("starting");

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStatus("camera");
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo acceder a la cámara. Revisá permisos y usá HTTPS o localhost."
      );
      setStatus("idle");
    }
  }

  function selectPeople(amount) {
    setPeopleCount(amount);

    if (amount === 1) {
      setGuides([
        {
          id: "person-1",
          label: "Persona 1",
          x: 56,
          y: 52,
          w: 34,
          h: 72,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 72,
          y: 52,
          w: 30,
          h: 68,
        },
      ]);
    }

    if (amount === 2) {
      setGuides([
        {
          id: "person-1",
          label: "Persona 1",
          x: 38,
          y: 52,
          w: 30,
          h: 68,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 64,
          y: 52,
          w: 30,
          h: 68,
        },
      ]);
    }
  }

  function startDraggingGuide(event, guideId) {
    event.preventDefault();
    draggingGuideRef.current = guideId;
    moveGuideToPointer(event, guideId);
  }

  function stopDraggingGuide() {
    draggingGuideRef.current = null;
  }

  function handlePointerMove(event) {
    if (!draggingGuideRef.current) return;
    moveGuideToPointer(event, draggingGuideRef.current);
  }

  function moveGuideToPointer(event, guideId) {
    const cameraBox = cameraBoxRef.current;
    if (!cameraBox) return;

    const rect = cameraBox.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setGuides((prev) =>
      prev.map((guide) =>
        guide.id === guideId
          ? {
              ...guide,
              x: clamp(x, 14, 86),
              y: clamp(y, 24, 78),
            }
          : guide
      )
    );
  }

  function capturePhoto() {
    if (isCapturing || !currentScene) return;

    setIsCapturing(true);

    setTimeout(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const sourceWidth = video.videoWidth || 1280;
      const sourceHeight = video.videoHeight || 720;

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, sourceWidth, sourceHeight);

      const capturedImage = canvas.toDataURL("image/jpeg", 0.95);

      setStatus("processing");
      setIsCapturing(false);

      setTimeout(() => {
        createPostal(capturedImage);
      }, 250);
    }, 160);
  }

  async function createPostal(capturedImage) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    try {
      const scene = currentScene;
      const base = await loadImage(capturedImage);

      drawPhotoBase(ctx, base, OUTPUT_WIDTH, OUTPUT_HEIGHT, scene.theme);

      const layout = calculateSceneLayout(OUTPUT_WIDTH, OUTPUT_HEIGHT);

      if (scene.theme === "emiliozzi") {
        await drawEmiliozziScene(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, layout);
      } else {
        await drawMegafaunaScene(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, layout);
      }

      drawInstructionBadge(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, scene);
      drawColorGrade(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, scene.theme);
      drawPostalFrame(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawSceneText(
        ctx,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
        scene.postalTitle,
        scene.postalSubtitle
      );

      const result = canvas.toDataURL("image/png");
      setFinalImage(result);
      setStatus("result");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la postal.");
      setStatus("camera");
    }
  }

  function drawPhotoBase(ctx, img, width, height, theme) {
    ctx.save();

    drawCoverImage(ctx, img, width, height);

    if (theme === "emiliozzi") {
      ctx.filter = "grayscale(0.75) contrast(1.05)";
      drawCoverImage(ctx, img, width, height);
      ctx.filter = "none";
      ctx.fillStyle = "rgba(70, 55, 42, 0.18)";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = "rgba(255, 235, 190, 0.10)";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  function calculateSceneLayout(width, height) {
    const activeGuides = guides.slice(0, peopleCount);

    const occupied = activeGuides.map((guide) => {
      const left = width * ((guide.x - guide.w / 2) / 100);
      const right = width * ((guide.x + guide.w / 2) / 100);
      const top = height * ((guide.y - guide.h / 2) / 100);
      const bottom = height * ((guide.y + guide.h / 2) / 100);

      return {
        left,
        right,
        top,
        bottom,
        centerX: width * (guide.x / 100),
        centerY: height * (guide.y / 100),
      };
    });

    const minLeft = Math.min(...occupied.map((item) => item.left));
    const maxRight = Math.max(...occupied.map((item) => item.right));

    const leftSpace = minLeft;
    const rightSpace = width - maxRight;

    const objectSide = leftSpace > rightSpace ? "left" : "right";

    const mainAnimal = {
      side: objectSide,
      x: objectSide === "left" ? width * 0.03 : width * 0.68,
      y: height * 0.50,
      w: width * 0.30,
      h: height * 0.30,
    };

    const footprints = {
      side: objectSide === "left" ? "right" : "left",
      startX: objectSide === "left" ? width * 0.62 : width * 0.16,
      startY: height * 0.70,
    };

    const foreground = {
      x: objectSide === "left" ? width * 0.58 : width * 0.08,
      y: height * 0.76,
      w: width * 0.24,
      h: height * 0.14,
    };

    const arrowTarget = {
      x: mainAnimal.x + mainAnimal.w * 0.5,
      y: mainAnimal.y + mainAnimal.h * 0.35,
    };

    const arrowStart = {
      x: objectSide === "left" ? width * 0.52 : width * 0.48,
      y: height * 0.38,
    };

    return {
      activeGuides,
      occupied,
      objectSide,
      mainAnimal,
      footprints,
      foreground,
      arrowStart,
      arrowTarget,
    };
  }

  async function drawMegafaunaScene(ctx, width, height, layout) {
    drawExpeditionNotebookOverlay(ctx, width, height);
    drawFootprints(ctx, layout.footprints);
    drawDiscoveryArrow(ctx, layout.arrowStart, layout.arrowTarget);

    try {
      const gliptodonte = await loadImageWithoutLightBackground(
        "/assets/personajes/gliptodonte.png"
      );

      drawObjectShadow(ctx, layout.mainAnimal);
      ctx.drawImage(
        gliptodonte,
        layout.mainAnimal.x,
        layout.mainAnimal.y,
        layout.mainAnimal.w,
        layout.mainAnimal.h
      );
    } catch (err) {
      drawFallbackGliptodonte(ctx, layout.mainAnimal);
    }

    drawFossilForeground(ctx, layout.foreground);
    drawStamp(ctx, width, height, "HALLAZGO");
  }

  async function drawEmiliozziScene(ctx, width, height, layout) {
    drawVintagePhotoTexture(ctx, width, height);
    drawVintageCar(ctx, layout.mainAnimal);
    drawWorkshopTools(ctx, layout.foreground);
    drawStamp(ctx, width, height, "BOXES");
  }

  function drawExpeditionNotebookOverlay(ctx, width, height) {
    ctx.save();

    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
      const y = height * (0.18 + i * 0.07);
      ctx.beginPath();
      ctx.moveTo(width * 0.06, y);
      ctx.lineTo(width * 0.94, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(width * 0.04, height * 0.08, width * 0.92, height * 0.78);

    ctx.restore();
  }

  function drawFootprints(ctx, footprints) {
    ctx.save();

    ctx.fillStyle = "rgba(70, 48, 30, 0.34)";

    for (let i = 0; i < 5; i++) {
      const x = footprints.startX + i * 52 * (footprints.side === "left" ? -1 : 1);
      const y = footprints.startY + i * 26;
      const rot = footprints.side === "left" ? -0.45 : 0.45;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);

      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 34, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-15, -24, 6, 0, Math.PI * 2);
      ctx.arc(0, -29, 7, 0, Math.PI * 2);
      ctx.arc(15, -24, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  function drawDiscoveryArrow(ctx, from, to) {
    ctx.save();

    ctx.strokeStyle = "rgba(255, 210, 31, 0.88)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo((from.x + to.x) / 2, from.y - 80, to.x, to.y);
    ctx.stroke();

    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    ctx.fillStyle = "rgba(255, 210, 31, 0.92)";
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - 26 * Math.cos(angle - 0.5), to.y - 26 * Math.sin(angle - 0.5));
    ctx.lineTo(to.x - 26 * Math.cos(angle + 0.5), to.y - 26 * Math.sin(angle + 0.5));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawObjectShadow(ctx, rect) {
    ctx.save();

    const shadowX = rect.x + rect.w * 0.5;
    const shadowY = rect.y + rect.h * 0.94;

    const gradient = ctx.createRadialGradient(
      shadowX,
      shadowY,
      rect.w * 0.08,
      shadowX,
      shadowY,
      rect.w * 0.60
    );

    gradient.addColorStop(0, "rgba(0,0,0,0.28)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
      shadowX,
      shadowY,
      rect.w * 0.62,
      rect.h * 0.10,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  function drawFallbackGliptodonte(ctx, rect) {
    ctx.save();

    drawObjectShadow(ctx, rect);

    ctx.fillStyle = "rgba(125, 92, 55, 0.95)";
    ctx.beginPath();
    ctx.ellipse(
      rect.x + rect.w * 0.48,
      rect.y + rect.h * 0.54,
      rect.w * 0.45,
      rect.h * 0.34,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "rgba(90, 65, 42, 0.95)";
    ctx.beginPath();
    ctx.ellipse(
      rect.x + rect.w * 0.82,
      rect.y + rect.h * 0.48,
      rect.w * 0.16,
      rect.h * 0.14,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  function drawFossilForeground(ctx, rect) {
    ctx.save();

    ctx.strokeStyle = "rgba(255,255,255,0.84)";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.1, rect.y + rect.h * 0.5);
    ctx.lineTo(rect.x + rect.w * 0.9, rect.y + rect.h * 0.3);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.08, rect.y + rect.h * 0.5, rect.w * 0.08, 0, Math.PI * 2);
    ctx.arc(rect.x + rect.w * 0.92, rect.y + rect.h * 0.3, rect.w * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawStamp(ctx, width, height, text) {
    ctx.save();

    const x = width * 0.76;
    const y = height * 0.16;
    const w = width * 0.18;
    const h = height * 0.10;

    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-0.12);

    ctx.strokeStyle = "rgba(245, 70, 120, 0.82)";
    ctx.lineWidth = 6;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    ctx.fillStyle = "rgba(245, 70, 120, 0.88)";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(width * 0.026)}px Arial`;
    ctx.fillText(text, 0, 10);

    ctx.restore();
  }

  function drawInstructionBadge(ctx, width, height, scene) {
    ctx.save();

    const x = width * 0.06;
    const y = height * 0.08;
    const w = width * 0.42;
    const h = height * 0.12;

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    roundedRect(ctx, x, y, w, h, 26);
    ctx.fill();

    ctx.fillStyle = "#129be3";
    ctx.font = `bold ${Math.round(width * 0.018)}px Arial`;
    ctx.fillText("CONSIGNA", x + 28, y + 34);

    ctx.fillStyle = "#3f3038";
    ctx.font = `bold ${Math.round(width * 0.022)}px Arial`;
    wrapText(ctx, scene.instruction, x + 28, y + 66, w - 56, 26);

    ctx.restore();
  }

  function drawVintagePhotoTexture(ctx, width, height) {
    ctx.save();

    ctx.fillStyle = "rgba(40,34,30,0.18)";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 80; i++) {
      const x = randomFrom(i, 0, width);
      const y = randomFrom(i + 12, 0, height);
      const r = randomFrom(i + 5, 1, 3);

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawVintageCar(ctx, rect) {
    ctx.save();

    drawObjectShadow(ctx, rect);

    ctx.fillStyle = "rgba(245,245,240,0.96)";
    roundedRect(ctx, rect.x, rect.y + rect.h * 0.28, rect.w, rect.h * 0.34, 26);
    ctx.fill();

    ctx.fillStyle = "rgba(230,230,225,0.96)";
    roundedRect(
      ctx,
      rect.x + rect.w * 0.22,
      rect.y + rect.h * 0.08,
      rect.w * 0.42,
      rect.h * 0.28,
      22
    );
    ctx.fill();

    ctx.fillStyle = "rgba(40,40,40,0.95)";
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.26, rect.y + rect.h * 0.64, rect.w * 0.11, 0, Math.PI * 2);
    ctx.arc(rect.x + rect.w * 0.76, rect.y + rect.h * 0.64, rect.w * 0.11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(20,20,20,0.85)";
    ctx.font = `bold ${Math.round(rect.w * 0.18)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("1", rect.x + rect.w * 0.5, rect.y + rect.h * 0.55);

    ctx.restore();
  }

  function drawWorkshopTools(ctx, rect) {
    ctx.save();

    ctx.fillStyle = "rgba(63,48,56,0.70)";
    roundedRect(ctx, rect.x, rect.y + rect.h * 0.42, rect.w, rect.h * 0.18, 18);
    ctx.fill();

    ctx.strokeStyle = "rgba(63,48,56,0.70)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.12, rect.y + rect.h * 0.2);
    ctx.lineTo(rect.x + rect.w * 0.86, rect.y + rect.h * 0.78);
    ctx.stroke();

    ctx.restore();
  }

  function drawColorGrade(ctx, width, height, theme) {
    ctx.save();

    if (theme === "emiliozzi") {
      ctx.fillStyle = "rgba(80,70,65,0.10)";
    } else {
      ctx.fillStyle = "rgba(255,210,90,0.08)";
    }

    ctx.fillRect(0, 0, width, height);

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.18,
      width / 2,
      height / 2,
      height * 0.85
    );

    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.22)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  async function loadImageWithoutLightBackground(src) {
    const img = await loadImage(src);

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = img.width;
    tempCanvas.height = img.height;

    tempCtx.drawImage(img, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue;

      const isVeryLight = r > 210 && g > 210 && b > 210;
      const colorDifference = Math.max(r, g, b) - Math.min(r, g, b);
      const isNeutralLight = isVeryLight && colorDifference < 40;

      if (isNeutralLight) {
        data[i + 3] = 0;
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    return loadImage(tempCanvas.toDataURL("image/png"));
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, currentY);
  }

  function randomFrom(seed, min, max) {
    const x = Math.sin(seed * 999) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);

      img.onerror = () =>
        reject(new Error("No se pudo cargar la imagen: " + src));

      img.src = src;
    });
  }

  function drawCoverImage(ctx, img, canvasWidth, canvasHeight) {
    const imageRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;

    if (imageRatio > canvasRatio) {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imageRatio;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imageRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  function drawPostalFrame(ctx, width, height) {
    const border = Math.max(20, width * 0.026);

    ctx.save();

    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, width - border, height - border);

    ctx.strokeStyle = "rgba(255,210,31,0.92)";
    ctx.lineWidth = 6;
    ctx.strokeRect(border, border, width - border * 2, height - border * 2);

    ctx.restore();
  }

  function drawSceneText(ctx, width, height, title, subtitle) {
    ctx.save();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.74)";
    ctx.shadowBlur = 10;

    ctx.font = `bold ${Math.round(width * 0.043)}px Arial, sans-serif`;
    ctx.fillText(title.toUpperCase(), width / 2, height * 0.88);

    ctx.fillStyle = "#FFD21F";
    ctx.font = `bold ${Math.round(width * 0.023)}px Arial, sans-serif`;
    ctx.fillText(subtitle, width / 2, height * 0.925);

    ctx.restore();
  }

  function downloadPostal() {
    if (!finalImage) return;

    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "postal-viva.png";
    link.click();
  }

  async function sharePostal() {
    if (!finalImage) return;

    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();

      const file = new File([blob], "postal-viva.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Postal Viva",
          text: "Mi postal generada",
          files: [file],
        });
      } else {
        downloadPostal();
      }
    } catch (err) {
      console.error(err);
      downloadPostal();
    }
  }

  function reset() {
    setFinalImage(null);
    setError("");
    setStatus(stream ? "camera" : "idle");
  }

  const activeGuides = guides.slice(0, peopleCount);

  return (
    <main className={`app ${isCameraScreen ? "cameraMode" : ""}`}>
      <section className="layout">
        <div className="preview">
          {status === "idle" && (
            <div className="intro">
              <div className="brandIcons">
                <span className="iconGhost"></span>
                <span className="iconRoad"></span>
                <span className="iconCrown"></span>
                <span className="iconTree"></span>
                <span className="iconDotBig"></span>
              </div>

              <h1>Postal Viva</h1>

              {locationStatus === "detecting" && (
                <>
                  <h2>Buscando tu lugar…</h2>
                  <p>
                    Permití la ubicación para cargar la postal correspondiente.
                  </p>
                </>
              )}

              {locationStatus === "detected" && currentScene && (
                <>
                  <h2>{currentScene.name}</h2>
                  <p>
                    Escena: <strong>{currentScene.postalTitle}</strong>
                  </p>

                  <div className="sceneInstruction">
                    {currentScene.instruction}
                  </div>

                  <div className="peopleSelector">
                    <button
                      className={peopleCount === 1 ? "selected" : ""}
                      onClick={() => selectPeople(1)}
                    >
                      1 persona
                    </button>

                    <button
                      className={peopleCount === 2 ? "selected" : ""}
                      onClick={() => selectPeople(2)}
                    >
                      2 personas
                    </button>
                  </div>

                  <button className="startButton" onClick={startCamera}>
                    <span>📷</span>
                    Activar cámara
                  </button>
                </>
              )}

              {locationStatus === "not-found" && (
                <>
                  <h2>Sin postal cercana</h2>
                  <p>No encontramos una experiencia activa en esta ubicación.</p>

                  <button className="startButton" onClick={detectLocation}>
                    Reintentar ubicación
                  </button>

                  <button className="demoButton" onClick={useDemoScene}>
                    Usar demo Museo de Ciencias
                  </button>
                </>
              )}

              {locationStatus === "error" && (
                <>
                  <h2>Ubicación desactivada</h2>
                  <p>Activá el permiso de ubicación para detectar el museo.</p>

                  <button className="startButton" onClick={detectLocation}>
                    Reintentar ubicación
                  </button>

                  <button className="demoButton" onClick={useDemoScene}>
                    Usar demo Museo de Ciencias
                  </button>
                </>
              )}

              {error && <p className="error">{error}</p>}
            </div>
          )}

          {(status === "starting" || status === "camera") && currentScene && (
            <div className="cameraBox" ref={cameraBoxRef}>
              <video ref={videoRef} autoPlay playsInline muted />

              <div className="cameraTopBar">
                <div>
                  <span className="placeLabel">{currentScene.name}</span>
                  <strong>{currentScene.instruction}</strong>
                </div>
              </div>

              <div className="overlay">
                {activeGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="safePerson"
                    style={{
                      left: `${guide.x}%`,
                      top: `${guide.y}%`,
                      width: `${guide.w}%`,
                      height: `${guide.h}%`,
                    }}
                    onPointerDown={(event) =>
                      startDraggingGuide(event, guide.id)
                    }
                  >
                    <span className="dragHint">{guide.label}</span>
                  </div>
                ))}

                <div className="instructions">
                  <strong>{currentScene.instruction}</strong>
                  <span>Arrastrá la guía para ubicar la escena.</span>
                </div>
              </div>

              <button
                className={`captureButton ${isCapturing ? "capturing" : ""}`}
                onClick={capturePhoto}
                aria-label="Sacar foto"
              >
                <span></span>
              </button>
            </div>
          )}

          {status === "processing" && (
            <div className="processing">
              <div className="spinner"></div>
              <h2>Creando postal…</h2>
              <p>Armando la escena dirigida.</p>
            </div>
          )}

          {status === "result" && finalImage && (
            <div className="result">
              <img src={finalImage} alt="Postal generada" />
            </div>
          )}
        </div>

        <div className="panel">
          <div>
            <p className="tag">Postal dirigida</p>

            <h2>Escena con consigna V25</h2>

            {currentScene ? (
              <div className="detectedCard">
                <span className="pin yellow"></span>
                <div>
                  <strong>{currentScene.name}</strong>
                  <small>{currentScene.postalTitle}</small>
                  <small>{currentScene.instruction}</small>
                </div>
              </div>
            ) : (
              <div className="detectedCard">
                <span className="pin blue"></span>
                <div>
                  <strong>Detectando ubicación</strong>
                  <small>Esperando una postal activa.</small>
                </div>
              </div>
            )}

            <p>
              Esta prueba no busca pegar stickers: dirige una pose y agrega
              objetos que completan la escena.
            </p>
          </div>

          <div className="actions">
            {status === "result" && (
              <>
                <button className="primary full" onClick={downloadPostal}>
                  Descargar postal
                </button>

                <button className="secondary full" onClick={sharePostal}>
                  Compartir
                </button>

                <button className="secondary full" onClick={reset}>
                  Tomar otra foto
                </button>
              </>
            )}

            {status !== "idle" && status !== "result" && (
              <button className="secondary full" onClick={reset}>
                Reiniciar
              </button>
            )}
          </div>

          {error && <p className="error">{error}</p>}
        </div>
      </section>

      <canvas ref={canvasRef} hidden />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);