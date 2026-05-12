import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const SCENES = [
  {
    id: "museo-ciencias",
    name: "Museo de Ciencias",
    postalTitle: "Museo de Ciencias",
    postalSubtitle: "Megafauna · Gliptodonte",
    lat: -36.8927,
    lng: -60.3225,
    radiusMeters: 400,
    character: "/assets/personajes/gliptodonte.png",
    characterBox: {
      x: 0.01,
      y: 0.42,
      w: 0.46,
      h: 0.42,
    },
  },
  {
    id: "museo-emiliozzi",
    name: "Museo Emiliozzi",
    postalTitle: "Museo Emiliozzi",
    postalSubtitle: "Hermanos Emiliozzi",
    lat: -36.8935,
    lng: -60.3215,
    radiusMeters: 400,
    character: "/assets/personajes/gliptodonte.png",
    characterBox: {
      x: 0.58,
      y: 0.35,
      w: 0.34,
      h: 0.48,
    },
  },
];

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraBoxRef = useRef(null);
  const draggingGuideRef = useRef(false);

  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState("idle");
  const [finalImage, setFinalImage] = useState(null);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const [currentScene, setCurrentScene] = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending");

  const [guideX, setGuideX] = useState(50);
  const [guideY, setGuideY] = useState(50);
  const [guideW] = useState(34);
  const [guideH] = useState(70);

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

  function startDraggingGuide(event) {
    event.preventDefault();
    draggingGuideRef.current = true;
    moveGuideToPointer(event);
  }

  function stopDraggingGuide() {
    draggingGuideRef.current = false;
  }

  function handlePointerMove(event) {
    if (!draggingGuideRef.current) return;
    moveGuideToPointer(event);
  }

  function moveGuideToPointer(event) {
    const cameraBox = cameraBoxRef.current;

    if (!cameraBox) return;

    const rect = cameraBox.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setGuideX(clamp(x, 15, 85));
    setGuideY(clamp(y, 22, 78));
  }

  function capturePhoto() {
    if (isCapturing || !currentScene) return;

    setIsCapturing(true);

    setTimeout(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      const capturedImage = canvas.toDataURL("image/jpeg", 0.92);

      setStatus("processing");
      setIsCapturing(false);

      setTimeout(() => {
        createPostal(capturedImage, width, height);
      }, 450);
    }, 180);
  }

  async function createPostal(capturedImage, width, height) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    try {
      const scene = currentScene;
      const base = await loadImage(capturedImage);

      ctx.drawImage(base, 0, 0, width, height);

      ctx.fillStyle = "rgba(255, 196, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);

      const character = await loadImageWithoutLightBackground(scene.character);

      drawPng(
        ctx,
        character,
        width * scene.characterBox.x,
        height * scene.characterBox.y,
        width * scene.characterBox.w,
        height * scene.characterBox.h
      );

      drawSoftColorWaves(ctx, width, height);
      drawVignette(ctx, width, height);
      drawPostalFrame(ctx, width, height);
      drawSceneText(ctx, width, height, scene.postalTitle, scene.postalSubtitle);

      const result = canvas.toDataURL("image/png");

      setFinalImage(result);
      setStatus("result");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la postal. Revisá que existan los PNG.");
      setStatus("camera");
    }
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

  function loadImageWithoutLightBackground(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        tempCanvas.width = img.width;
        tempCanvas.height = img.height;

        tempCtx.drawImage(img, 0, 0);

        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );

        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          const isVeryLight = r > 210 && g > 210 && b > 210;
          const colorDifference = Math.max(r, g, b) - Math.min(r, g, b);
          const isNeutralLight = isVeryLight && colorDifference < 35;

          if (isNeutralLight) {
            data[i + 3] = 0;
          }
        }

        tempCtx.putImageData(imageData, 0, 0);

        const cleanedImg = new Image();

        cleanedImg.onload = () => resolve(cleanedImg);
        cleanedImg.onerror = reject;
        cleanedImg.src = tempCanvas.toDataURL("image/png");
      };

      img.onerror = () =>
        reject(new Error("No se pudo cargar la imagen: " + src));

      img.src = src;
    });
  }

  function drawPng(ctx, img, x, y, w, h) {
    ctx.save();

    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 10;

    ctx.drawImage(img, x, y, w, h);

    ctx.restore();
  }

  function drawSoftColorWaves(ctx, width, height) {
    ctx.save();
    ctx.globalAlpha = 0.18;

    ctx.fillStyle = "#FFD21F";
    ctx.beginPath();
    ctx.ellipse(
      width * 0.18,
      height * 0.92,
      width * 0.35,
      height * 0.18,
      -0.2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#27A844";
    ctx.beginPath();
    ctx.ellipse(
      width * 0.85,
      height * 0.86,
      width * 0.34,
      height * 0.18,
      0.2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#129BE3";
    ctx.beginPath();
    ctx.ellipse(
      width * 0.55,
      height * 0.95,
      width * 0.42,
      height * 0.15,
      0.05,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  function drawVignette(ctx, width, height) {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.12,
      width / 2,
      height / 2,
      height * 0.78
    );

    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.34)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPostalFrame(ctx, width, height) {
    const border = Math.max(20, width * 0.026);

    ctx.save();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, width - border, height - border);

    ctx.strokeStyle = "rgba(255, 210, 31, 0.85)";
    ctx.lineWidth = 6;
    ctx.strokeRect(border, border, width - border * 2, height - border * 2);

    ctx.restore();
  }

  function drawSceneText(ctx, width, height, title, subtitle) {
    ctx.save();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 8;

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

  const safePersonStyle = {
    left: `${guideX}%`,
    top: `${guideY}%`,
    width: `${guideW}%`,
    height: `${guideH}%`,
  };

  return (
    <main className="app">
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
                  <p>Permití la ubicación para cargar la postal correspondiente.</p>
                </>
              )}

              {locationStatus === "detected" && currentScene && (
                <>
                  <h2>{currentScene.name}</h2>
                  <p>
                    Postal detectada:{" "}
                    <strong>{currentScene.postalSubtitle}</strong>
                  </p>

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
                <div
                  className="safePerson"
                  style={safePersonStyle}
                  onPointerDown={startDraggingGuide}
                >
                  <span className="dragHint">Arrastrar</span>
                </div>

                <div className="leftZone">
                  <span>Personaje</span>
                </div>

                <div className="instructions">
                  <strong>Ubicá a la persona dentro de la guía</strong>
                  <span>Arrastrá el encuadre con el dedo.</span>
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
              <p>Agregando la escena de este lugar.</p>
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

            <h2>La app detecta tu lugar</h2>

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
                  <small>No se muestran lugares manuales.</small>
                </div>
              </div>
            )}

            <p>
              La postal se define por ubicación. Más adelante cargamos las
              coordenadas reales de cada museo o punto fotográfico.
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