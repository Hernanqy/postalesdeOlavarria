import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

const SCENES = [
  {
    id: "museo-ciencias",
    name: "Museo de Ciencias",
    postalTitle: "Museo de Ciencias",
    postalSubtitle: "Megafauna · Exploradores del pasado",
    lat: -36.8927,
    lng: -60.3225,
    radiusMeters: 400,
    theme: "megafauna",
    mainObject: "/assets/personajes/gliptodonte.png",
  },
  {
    id: "museo-emiliozzi",
    name: "Museo Emiliozzi",
    postalTitle: "Museo Emiliozzi",
    postalSubtitle: "Automovilismo histórico",
    lat: -36.8935,
    lng: -60.3215,
    radiusMeters: 400,
    theme: "emiliozzi",
    mainObject: "/assets/personajes/gliptodonte.png",
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
      x: 50,
      y: 52,
      w: 34,
      h: 72,
    },
    {
      id: "person-2",
      label: "Persona 2",
      x: 70,
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
          x: 50,
          y: 52,
          w: 34,
          h: 72,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 70,
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

      drawWhiteStudioBase(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawPhotoCover(ctx, base, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawCleanFloor(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const layout = calculateObjectLayout(OUTPUT_WIDTH, OUTPUT_HEIGHT);

      if (scene.theme === "emiliozzi") {
        await drawEmiliozziObjects(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, layout);
      } else {
        await drawMegafaunaObjects(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, layout);
      }

      drawAtmosphere(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, scene.theme);
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

  function drawWhiteStudioBase(ctx, width, height) {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(0.58, "#ffffff");
    bg.addColorStop(0.59, "#f1eee8");
    bg.addColorStop(1, "#ded7cc");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPhotoCover(ctx, img, width, height) {
    ctx.save();

    drawCoverImage(ctx, img, width, height);

    // Suaviza la foto para que funcione como postal sobre fondo blanco.
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  function drawCleanFloor(ctx, width, height) {
    ctx.save();

    const floorY = height * 0.68;

    const floor = ctx.createLinearGradient(0, floorY, 0, height);
    floor.addColorStop(0, "rgba(255,255,255,0.05)");
    floor.addColorStop(1, "rgba(210,204,194,0.28)");

    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, width, height - floorY);

    ctx.strokeStyle = "rgba(80,70,60,0.16)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(width, floorY);
    ctx.stroke();

    ctx.restore();
  }

  function calculateObjectLayout(width, height) {
    const activeGuides = guides.slice(0, peopleCount);

    const occupied = activeGuides.map((guide) => {
      const left = width * ((guide.x - guide.w / 2) / 100);
      const right = width * ((guide.x + guide.w / 2) / 100);

      return {
        left,
        right,
        center: width * (guide.x / 100),
      };
    });

    const minLeft = Math.min(...occupied.map((item) => item.left));
    const maxRight = Math.max(...occupied.map((item) => item.right));
    const center = (minLeft + maxRight) / 2;

    const leftSpace = minLeft;
    const rightSpace = width - maxRight;

    const mainSide = leftSpace > rightSpace ? "left" : "right";

    const mainObject = {
      side: mainSide,
      x: mainSide === "left" ? width * 0.04 : width * 0.66,
      y: height * 0.47,
      w: width * 0.30,
      h: height * 0.32,
    };

    const secondaryObject = {
      side: mainSide === "left" ? "right" : "left",
      x: mainSide === "left" ? width * 0.72 : width * 0.08,
      y: height * 0.18,
      w: width * 0.18,
      h: height * 0.24,
    };

    const foregroundObject = {
      x: center < width / 2 ? width * 0.70 : width * 0.08,
      y: height * 0.76,
      w: width * 0.24,
      h: height * 0.16,
    };

    return {
      activeGuides,
      mainObject,
      secondaryObject,
      foregroundObject,
      occupied,
    };
  }

  async function drawMegafaunaObjects(ctx, width, height, layout) {
    ctx.save();

    // Objeto principal: gliptodonte, si existe PNG.
    try {
      const gliptodonte = await loadImageWithoutLightBackground(
        "/assets/personajes/gliptodonte.png"
      );

      drawObjectShadow(ctx, layout.mainObject);
      ctx.drawImage(
        gliptodonte,
        layout.mainObject.x,
        layout.mainObject.y,
        layout.mainObject.w,
        layout.mainObject.h
      );
    } catch (err) {
      drawFallbackGliptodonte(ctx, layout.mainObject);
    }

    // Objeto secundario: sol / ave / señal gráfica.
    drawSunBadge(ctx, layout.secondaryObject);

    // Objeto frontal: huesos / fósil en piso.
    drawFossilForeground(ctx, layout.foregroundObject);

    ctx.restore();
  }

  async function drawEmiliozziObjects(ctx, width, height, layout) {
    ctx.save();

    drawVintageCar(ctx, layout.mainObject);
    drawToolSign(ctx, layout.secondaryObject);
    drawToolsForeground(ctx, layout.foregroundObject);

    ctx.restore();
  }

  function drawObjectShadow(ctx, rect) {
    ctx.save();

    const shadowX = rect.x + rect.w * 0.5;
    const shadowY = rect.y + rect.h * 0.96;

    const gradient = ctx.createRadialGradient(
      shadowX,
      shadowY,
      rect.w * 0.12,
      shadowX,
      shadowY,
      rect.w * 0.58
    );

    gradient.addColorStop(0, "rgba(0,0,0,0.24)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, rect.w * 0.65, rect.h * 0.10, 0, 0, Math.PI * 2);
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

  function drawSunBadge(ctx, rect) {
    ctx.save();

    ctx.fillStyle = "rgba(255, 210, 31, 0.84)";
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.5, rect.y + rect.h * 0.5, rect.w * 0.34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.42, rect.y + rect.h * 0.44, rect.w * 0.07, 0, Math.PI * 2);
    ctx.arc(rect.x + rect.w * 0.58, rect.y + rect.h * 0.44, rect.w * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFossilForeground(ctx, rect) {
    ctx.save();

    ctx.strokeStyle = "rgba(255,255,255,0.86)";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.1, rect.y + rect.h * 0.5);
    ctx.lineTo(rect.x + rect.w * 0.9, rect.y + rect.h * 0.3);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.08, rect.y + rect.h * 0.5, rect.w * 0.08, 0, Math.PI * 2);
    ctx.arc(rect.x + rect.w * 0.92, rect.y + rect.h * 0.3, rect.w * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawVintageCar(ctx, rect) {
    ctx.save();

    drawObjectShadow(ctx, rect);

    ctx.fillStyle = "rgba(245,245,240,0.96)";
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y + rect.h * 0.28, rect.w, rect.h * 0.34, rect.w * 0.08);
    ctx.fill();

    ctx.fillStyle = "rgba(230,230,225,0.96)";
    ctx.beginPath();
    ctx.roundRect(
      rect.x + rect.w * 0.22,
      rect.y + rect.h * 0.08,
      rect.w * 0.42,
      rect.h * 0.28,
      rect.w * 0.09
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

  function drawToolSign(ctx, rect) {
    ctx.save();

    ctx.fillStyle = "rgba(63,48,56,0.86)";
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 24);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.25, rect.y + rect.h * 0.28);
    ctx.lineTo(rect.x + rect.w * 0.75, rect.y + rect.h * 0.72);
    ctx.moveTo(rect.x + rect.w * 0.75, rect.y + rect.h * 0.28);
    ctx.lineTo(rect.x + rect.w * 0.25, rect.y + rect.h * 0.72);
    ctx.stroke();

    ctx.restore();
  }

  function drawToolsForeground(ctx, rect) {
    ctx.save();

    ctx.fillStyle = "rgba(63,48,56,0.70)";
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y + rect.h * 0.42, rect.w, rect.h * 0.18, 18);
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

  function drawAtmosphere(ctx, width, height, theme) {
    ctx.save();

    if (theme === "emiliozzi") {
      ctx.fillStyle = "rgba(80,70,65,0.10)";
    } else {
      ctx.fillStyle = "rgba(255,210,90,0.08)";
    }

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
                    Postal detectada:{" "}
                    <strong>{currentScene.postalSubtitle}</strong>
                  </p>

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
                  <strong>{currentScene.postalSubtitle}</strong>
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
                  <strong>Acomodá a las personas en los encuadres</strong>
                  <span>Los objetos se ubican para no taparlas.</span>
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
              <p>Agregando objetos alrededor de la persona.</p>
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
            <p className="tag">Postal automática</p>

            <h2>Objetos sin solapar V24</h2>

            {currentScene ? (
              <div className="detectedCard">
                <span className="pin yellow"></span>
                <div>
                  <strong>{currentScene.name}</strong>
                  <small>{currentScene.postalSubtitle}</small>
                  {currentScene.distance !== undefined && (
                    <small>Aprox. {currentScene.distance} m de distancia</small>
                  )}
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
              Esta versión no cambia el fondo: usa una toma limpia con piso y
              agrega objetos según la ubicación de las personas.
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