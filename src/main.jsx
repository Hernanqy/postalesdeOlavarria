import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 1600;

const SCENES = [
  {
    id: "museo-damaso-arce",
    name: "Museo Dámaso Arce",
    postalTitle: "Yo visité el Museo Dámaso Arce",
    postalSubtitle: "Arte · Historia · Cultura",
    lat: -36.8927,
    lng: -60.3225,
    radiusMeters: 500,
    theme: "damaso",
    frame: "/assets/marcos/damaso-arce-photocall.png",
    instruction:
      "Ubicate dentro del centro libre, entre Belgrano y el pintor.",
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
      y: 55,
      w: 42,
      h: 58,
    },
    {
      id: "person-2",
      label: "Persona 2",
      x: 62,
      y: 55,
      w: 32,
      h: 56,
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
          y: 55,
          w: 42,
          h: 58,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 62,
          y: 55,
          w: 32,
          h: 56,
        },
      ]);
    }

    if (amount === 2) {
      setGuides([
        {
          id: "person-1",
          label: "Persona 1",
          x: 42,
          y: 55,
          w: 30,
          h: 56,
        },
        {
          id: "person-2",
          label: "Persona 2",
          x: 60,
          y: 55,
          w: 30,
          h: 56,
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
              x: clamp(x, 28, 72),
              y: clamp(y, 32, 76),
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
      const photo = await loadImage(capturedImage);
      const frame = await loadImage(scene.frame);

      drawPhotoInsideCenter(ctx, photo, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawCenterLightWash(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      ctx.drawImage(frame, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      drawSubtleFloorShadow(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawSoftVignette(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const result = canvas.toDataURL("image/png");
      setFinalImage(result);
      setStatus("result");
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo crear la postal. Revisá que exista public/assets/marcos/damaso-arce-photocall.png"
      );
      setStatus("camera");
    }
  }

  function drawPhotoInsideCenter(ctx, img, width, height) {
    /*
      Zona aproximada del centro libre del PNG.
      La foto se dibuja detrás de todo, pero encajada
      para que la persona quede en el hueco central.
    */

    const target = {
      x: width * 0.18,
      y: height * 0.23,
      w: width * 0.64,
      h: height * 0.67,
    };

    drawCoverImageIntoRect(ctx, img, target.x, target.y, target.w, target.h);
  }

  function drawCenterLightWash(ctx, width, height) {
    ctx.save();

    const x = width * 0.18;
    const y = height * 0.23;
    const w = width * 0.64;
    const h = height * 0.67;

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x, y, w, h);

    ctx.restore();
  }

  function drawSubtleFloorShadow(ctx, width, height) {
    ctx.save();

    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.88,
      width * 0.05,
      width * 0.5,
      height * 0.88,
      width * 0.36
    );

    gradient.addColorStop(0, "rgba(0,0,0,0.14)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  function drawSoftVignette(ctx, width, height) {
    ctx.save();

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.18,
      width / 2,
      height / 2,
      height * 0.9
    );

    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.10)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
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

  function drawCoverImageIntoRect(ctx, img, x, y, w, h) {
    const imageRatio = img.width / img.height;
    const rectRatio = w / h;

    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;

    if (imageRatio > rectRatio) {
      drawHeight = h;
      drawWidth = h * imageRatio;
      drawX = x + (w - drawWidth) / 2;
      drawY = y;
    } else {
      drawWidth = w;
      drawHeight = w / imageRatio;
      drawX = x;
      drawY = y + (h - drawHeight) / 2;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  }

  function downloadPostal() {
    if (!finalImage) return;

    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "postal-damaso-arce.png";
    link.click();
  }

  async function sharePostal() {
    if (!finalImage) return;

    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();

      const file = new File([blob], "postal-damaso-arce.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Museo Dámaso Arce",
          text: "Yo visité el Museo Dámaso Arce",
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
                    Usar demo Museo Dámaso Arce
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
                    Usar demo Museo Dámaso Arce
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
                <div className="centerPhotoArea"></div>

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
                  <strong>Ubicate en el centro libre del marco</strong>
                  <span>Ese espacio será el centro de la postal.</span>
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
              <p>Combinando tu foto con el marco del museo.</p>
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
            <p className="tag">Postal temática</p>

            <h2>Photocall Museo Dámaso Arce V1</h2>

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
              Esta versión usa un marco PNG transparente. La foto real queda por
              detrás y el visitante se ubica dentro del centro libre.
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