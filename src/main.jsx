import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

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
      y: 50,
      w: 34,
      h: 70,
    },
    {
      id: "person-2",
      label: "Persona 2",
      x: 68,
      y: 50,
      w: 30,
      h: 68,
    },
  ]);

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

  function setPeople(amount) {
    setPeopleCount(amount);

    if (amount === 1) {
      setGuides([
        {
          id: "person-1",
          label: "Persona 1",
          x: 50,
          y: 50,
          w: 36,
          h: 72,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 68,
          y: 50,
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
          y: 50,
          w: 30,
          h: 68,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 64,
          y: 50,
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
      }, 650);
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

      await drawThemeBackground(ctx, width, height, scene);
      drawCapturedPeople(ctx, base, width, height);
      drawForegroundTheme(ctx, width, height, scene);
      drawVignette(ctx, width, height);
      drawPostalFrame(ctx, width, height);
      drawSceneText(ctx, width, height, scene.postalTitle, scene.postalSubtitle);

      const result = canvas.toDataURL("image/png");

      setFinalImage(result);
      setStatus("result");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la postal.");
      setStatus("camera");
    }
  }

  function drawCapturedPeople(ctx, base, width, height) {
    // En esta prueba sin IA usamos la foto real completa,
    // pero la fusionamos con el fondo temático.
    // Más adelante podemos recortar la persona si sumamos segmentación local.
    ctx.save();

    ctx.globalAlpha = 0.92;
    ctx.drawImage(base, 0, 0, width, height);

    // Mezcla de color para que parezca postal.
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(255, 210, 31, 0.22)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

 async function drawThemeBackground(ctx, width, height, scene) {
  try {
    if (scene.theme === "emiliozzi") {
      const fondo = await loadImage("/assets/fondos/emiliozzi-fondo.jpg");
      drawCoverImage(ctx, fondo, width, height);
      return;
    }

    const fondo = await loadImage("/assets/fondos/megafauna-fondo.jpg");
    drawCoverImage(ctx, fondo, width, height);
  } catch (err) {
    console.error("No se pudo cargar el fondo:", err);

    if (scene.theme === "emiliozzi") {
      drawEmiliozziBackground(ctx, width, height);
      return;
    }

    drawMegafaunaBackground(ctx, width, height);
  }
}

  function drawMegafaunaBackground(ctx, width, height) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#f9efe6");
    sky.addColorStop(0.5, "#f7e4c8");
    sky.addColorStop(1, "#d8efc5");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    ctx.fillStyle = "rgba(18, 155, 227, 0.18)";
    ctx.beginPath();
    ctx.ellipse(width * 0.32, height * 0.62, width * 0.42, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(39, 168, 68, 0.22)";
    ctx.beginPath();
    ctx.ellipse(width * 0.75, height * 0.70, width * 0.48, height * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 210, 31, 0.28)";
    ctx.beginPath();
    ctx.ellipse(width * 0.48, height * 0.82, width * 0.55, height * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sol
    ctx.fillStyle = "rgba(255, 210, 31, 0.65)";
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.18, width * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawEmiliozziBackground(ctx, width, height) {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#f8f8f8");
    bg.addColorStop(0.55, "#dceef8");
    bg.addColorStop(1, "#f7e8d2");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // pista
    ctx.fillStyle = "rgba(63, 48, 56, 0.28)";
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    ctx.lineTo(width, height * 0.58);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // líneas
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = width * 0.012;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.84);
    ctx.lineTo(width * 0.9, height * 0.68);
    ctx.stroke();

    ctx.restore();
  }

  function drawForegroundTheme(ctx, width, height, scene) {
    if (scene.theme === "emiliozzi") {
      drawEmiliozziForeground(ctx, width, height);
      return;
    }

    drawMegafaunaForeground(ctx, width, height);
  }

  function drawMegafaunaForeground(ctx, width, height) {
    ctx.save();

    // pasto inferior
    ctx.fillStyle = "rgba(39, 168, 68, 0.30)";
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 1.02, width * 0.62, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // silueta de hueso / fósil
    ctx.strokeStyle = "rgba(255, 255, 255, 0.68)";
    ctx.lineWidth = width * 0.018;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(width * 0.08, height * 0.76);
    ctx.lineTo(width * 0.24, height * 0.72);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.beginPath();
    ctx.arc(width * 0.07, height * 0.76, width * 0.03, 0, Math.PI * 2);
    ctx.arc(width * 0.25, height * 0.72, width * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // polvo / atmósfera
    for (let i = 0; i < 26; i++) {
      const x = width * randomFrom(i, 0.05, 0.95);
      const y = height * randomFrom(i + 9, 0.20, 0.72);
      const r = width * randomFrom(i + 3, 0.004, 0.012);

      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawEmiliozziForeground(ctx, width, height) {
    ctx.save();

    // ruedas / auto simplificado en primer plano
    ctx.fillStyle = "rgba(63, 48, 56, 0.86)";
    ctx.beginPath();
    ctx.roundRect(width * 0.12, height * 0.66, width * 0.36, height * 0.11, width * 0.04);
    ctx.fill();

    ctx.fillStyle = "rgba(18, 155, 227, 0.90)";
    ctx.beginPath();
    ctx.roundRect(width * 0.18, height * 0.58, width * 0.20, height * 0.10, width * 0.04);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(width * 0.20, height * 0.78, width * 0.045, 0, Math.PI * 2);
    ctx.arc(width * 0.42, height * 0.78, width * 0.045, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(63, 48, 56, 0.9)";
    ctx.beginPath();
    ctx.arc(width * 0.20, height * 0.78, width * 0.025, 0, Math.PI * 2);
    ctx.arc(width * 0.42, height * 0.78, width * 0.025, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
    gradient.addColorStop(1, "rgba(0,0,0,0.32)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPostalFrame(ctx, width, height) {
    const border = Math.max(20, width * 0.026);

    ctx.save();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.94)";
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, width - border, height - border);

    ctx.strokeStyle = "rgba(255, 210, 31, 0.86)";
    ctx.lineWidth = 6;
    ctx.strokeRect(border, border, width - border * 2, height - border * 2);

    ctx.restore();
  }

  function drawSceneText(ctx, width, height, title, subtitle) {
    ctx.save();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.68)";
    ctx.shadowBlur = 9;

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

                  <div className="peopleSelector">
                    <button
                      className={peopleCount === 1 ? "selected" : ""}
                      onClick={() => setPeople(1)}
                    >
                      1 persona
                    </button>

                    <button
                      className={peopleCount === 2 ? "selected" : ""}
                      onClick={() => setPeople(2)}
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
                    onPointerDown={(event) => startDraggingGuide(event, guide.id)}
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
              <p>Fusionando la foto con la escena temática.</p>
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

            <h2>Postal temática sin costo por foto</h2>

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
              La app carga una escena por ubicación, permite ubicar una o dos
              personas y genera una postal con composición local.
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