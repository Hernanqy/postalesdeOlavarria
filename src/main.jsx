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
    background: "/assets/fondos/megafauna-fondo.jpg",
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
    background: "/assets/fondos/emiliozzi-fondo.jpg",
  },
];

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraBoxRef = useRef(null);
  const draggingGuideRef = useRef(null);
  const segmenterRef = useRef(null);

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
      x: 62,
      y: 54,
      w: 34,
      h: 74,
    },
    {
      id: "person-2",
      label: "Persona 2",
      x: 72,
      y: 54,
      w: 30,
      h: 70,
    },
  ]);

  const isCameraScreen = status === "starting" || status === "camera";

  useEffect(() => {
    detectLocation();
    initializeSegmenter();
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

  function initializeSegmenter() {
    if (window.SelfieSegmentation) {
      createSegmenterFromWindow();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-mediapipe="selfie-segmentation"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", createSegmenterFromWindow);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.async = true;
    script.dataset.mediapipe = "selfie-segmentation";

    script.onload = () => {
      createSegmenterFromWindow();
    };

    script.onerror = () => {
      setError("No se pudo cargar el recorte automático.");
    };

    document.body.appendChild(script);
  }

  function createSegmenterFromWindow() {
    if (!window.SelfieSegmentation) {
      setError("El recorte automático no está disponible en este navegador.");
      return;
    }

    const segmenter = new window.SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    segmenter.setOptions({
      modelSelection: 1,
    });

    segmenterRef.current = segmenter;
  }

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
          x: 62,
          y: 54,
          w: 34,
          h: 74,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 72,
          y: 54,
          w: 30,
          h: 70,
        },
      ]);
    }

    if (amount === 2) {
      setGuides([
        {
          id: "person-1",
          label: "Persona 1",
          x: 46,
          y: 54,
          w: 30,
          h: 70,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 72,
          y: 54,
          w: 30,
          h: 70,
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
        createPostal(capturedImage, sourceWidth, sourceHeight);
      }, 250);
    }, 160);
  }

  async function createPostal(capturedImage, sourceWidth, sourceHeight) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    try {
      const scene = currentScene;

      await drawThemeBackground(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, scene);

      const cutoutCanvas = await segmentPeopleFromImage(
        capturedImage,
        sourceWidth,
        sourceHeight
      );

      drawSelectedPeopleCutouts(
        ctx,
        cutoutCanvas,
        sourceWidth,
        sourceHeight,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      drawGroundShadows(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawVignette(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
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

  async function segmentPeopleFromImage(imageSrc, sourceWidth, sourceHeight) {
    if (!segmenterRef.current) {
      throw new Error("La segmentación todavía no está lista.");
    }

    const sourceImage = await loadImage(imageSrc);
    const segmenter = segmenterRef.current;

    return new Promise((resolve, reject) => {
      const cutoutCanvas = document.createElement("canvas");
      const cutoutCtx = cutoutCanvas.getContext("2d");

      cutoutCanvas.width = sourceWidth;
      cutoutCanvas.height = sourceHeight;

      segmenter.onResults((results) => {
        try {
          cutoutCtx.clearRect(0, 0, sourceWidth, sourceHeight);

          const maskCanvas = document.createElement("canvas");
          const maskCtx = maskCanvas.getContext("2d");

          maskCanvas.width = sourceWidth;
          maskCanvas.height = sourceHeight;

          maskCtx.drawImage(
            results.segmentationMask,
            0,
            0,
            sourceWidth,
            sourceHeight
          );

          const maskData = maskCtx.getImageData(
            0,
            0,
            sourceWidth,
            sourceHeight
          );

          const data = maskData.data;

          for (let i = 0; i < data.length; i += 4) {
            const value = data[i];

            if (value > 120) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
              data[i + 3] = 255;
            } else {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
              data[i + 3] = 0;
            }
          }

          maskCtx.putImageData(maskData, 0, 0);

          cutoutCtx.drawImage(maskCanvas, 0, 0, sourceWidth, sourceHeight);
          cutoutCtx.globalCompositeOperation = "source-in";
          cutoutCtx.drawImage(results.image, 0, 0, sourceWidth, sourceHeight);
          cutoutCtx.globalCompositeOperation = "source-over";

          resolve(cutoutCanvas);
        } catch (error) {
          reject(error);
        }
      });

      segmenter.send({ image: sourceImage }).catch(reject);
    });
  }

  async function drawThemeBackground(ctx, width, height, scene) {
    try {
      const background = await loadImage(scene.background);
      drawCoverImage(ctx, background, width, height);
    } catch (err) {
      console.error("No se pudo cargar el fondo:", err);

      if (scene.theme === "emiliozzi") {
        drawFallbackEmiliozziBackground(ctx, width, height);
        return;
      }

      drawFallbackMegafaunaBackground(ctx, width, height);
    }
  }

  function drawSelectedPeopleCutouts(
    ctx,
    cutoutCanvas,
    sourceWidth,
    sourceHeight,
    outputWidth,
    outputHeight
  ) {
    const activeGuides = guides.slice(0, peopleCount);

    activeGuides.forEach((guide) => {
      const sourceRect = guideToSourceRect(guide, sourceWidth, sourceHeight);
      const outputRect = guideToOutputRect(guide, outputWidth, outputHeight);

      ctx.save();

      ctx.shadowColor = "rgba(0,0,0,0.42)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 14;

      ctx.drawImage(
        cutoutCanvas,
        sourceRect.x,
        sourceRect.y,
        sourceRect.w,
        sourceRect.h,
        outputRect.x,
        outputRect.y,
        outputRect.w,
        outputRect.h
      );

      ctx.restore();
    });
  }

  function guideToSourceRect(guide, sourceWidth, sourceHeight) {
    const padding = 1.18;

    const w = sourceWidth * (guide.w / 100) * padding;
    const h = sourceHeight * (guide.h / 100) * padding;

    const centerX = sourceWidth * (guide.x / 100);
    const centerY = sourceHeight * (guide.y / 100);

    return {
      x: clamp(centerX - w / 2, 0, sourceWidth - w),
      y: clamp(centerY - h / 2, 0, sourceHeight - h),
      w: clamp(w, 10, sourceWidth),
      h: clamp(h, 10, sourceHeight),
    };
  }

  function guideToOutputRect(guide, outputWidth, outputHeight) {
    const scale = peopleCount === 1 ? 0.86 : 0.76;

    const h = outputHeight * scale;
    const w = h * 0.45;

    const x = outputWidth * (guide.x / 100) - w / 2;
    const y = outputHeight * 0.18;

    return {
      x,
      y,
      w,
      h,
    };
  }

  function drawGroundShadows(ctx, width, height) {
    const activeGuides = guides.slice(0, peopleCount);

    ctx.save();

    activeGuides.forEach((guide) => {
      const x = width * (guide.x / 100);
      const y = height * 0.82;

      const gradient = ctx.createRadialGradient(
        x,
        y,
        width * 0.02,
        x,
        y,
        width * 0.14
      );

      gradient.addColorStop(0, "rgba(0,0,0,0.22)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });

    ctx.restore();
  }

  function drawVignette(ctx, width, height) {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.12,
      width / 2,
      height / 2,
      height * 0.8
    );

    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.24)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawFallbackMegafaunaBackground(ctx, width, height) {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#f9efe6");
    bg.addColorStop(0.55, "#e7d5a8");
    bg.addColorStop(1, "#b7d39e");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }

  function drawFallbackEmiliozziBackground(ctx, width, height) {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#fbfbfb");
    bg.addColorStop(0.5, "#dbeffd");
    bg.addColorStop(1, "#efe1cb");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
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
    ctx.shadowColor = "rgba(0,0,0,0.72)";
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
                  <span>Arrastrá cada guía con el dedo.</span>
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
              <p>Recortando personas y armando la escena.</p>
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

            <h2>Recorte automático V22</h2>

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
              Esta versión recorta automáticamente lo humano de la foto y lo
              monta sobre el fondo del espacio.
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
