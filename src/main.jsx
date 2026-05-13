import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 1600;

const SPACES = {
  ciencias: {
    id: "ciencias",
    name: "Museo de las Ciencias",
    postalTitle: "Yo visité el Museo de las Ciencias",
    postalSubtitle: "Ciencia · Megafauna · Descubrimiento",
    frame: "/assets/marcos/ciencias-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
  },
  "damaso-arce": {
    id: "damaso-arce",
    name: "Museo Dámaso Arce",
    postalTitle: "Yo visité el Museo Dámaso Arce",
    postalSubtitle: "Arte · Historia · Cultura",
    frame: "/assets/marcos/damaso-arce-photocall.png",
    instruction: "Ubicate entre los personajes del marco.",
  },
  "centro-cultural": {
    id: "centro-cultural",
    name: "Centro Cultural",
    postalTitle: "Yo visité el Centro Cultural",
    postalSubtitle: "Arte · Música · Comunidad",
    frame: "/assets/marcos/centro-cultural-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
  },
  emiliozzi: {
    id: "emiliozzi",
    name: "Museo Hermanos Emiliozzi",
    postalTitle: "Yo visité el Museo Hermanos Emiliozzi",
    postalSubtitle: "Automovilismo · Historia · Olavarría",
    frame: "/assets/marcos/emiliozzi-photocall.png",
    instruction: "Ubicate en el centro como protagonista de boxes.",
  },
  "loma-negra": {
    id: "loma-negra",
    name: "Museo de Loma Negra",
    postalTitle: "Yo visité el Museo de Loma Negra",
    postalSubtitle: "Industria · Inmigración · Comunidad",
    frame: "/assets/marcos/loma-negra-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
  },
};

function App() {
  const videoRef = useRef(null);
  const scannerVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraBoxRef = useRef(null);
  const draggingGuideRef = useRef(null);
  const scannerLoopRef = useRef(null);
  const scannerDetectorRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [scannerStream, setScannerStream] = useState(null);

  const [status, setStatus] = useState("idle");
  const [finalImage, setFinalImage] = useState(null);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const [currentSpace, setCurrentSpace] = useState(null);
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
  const isScannerScreen = status === "scanner";

  useEffect(() => {
    loadSpaceFromUrl();
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
    if (
      (status === "camera" || status === "starting") &&
      videoRef.current &&
      stream
    ) {
      videoRef.current.srcObject = stream;
    }
  }, [status, stream]);

  useEffect(() => {
    return () => {
      stopCameraTracks();
      stopScannerTracks();
    };
  }, []);

  function loadSpaceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const spaceId = params.get("space");

    if (spaceId && SPACES[spaceId]) {
      setCurrentSpace(SPACES[spaceId]);
      setError("");
      return;
    }

    setCurrentSpace(null);
  }

  function selectSpace(spaceId) {
    if (!SPACES[spaceId]) {
      setError("QR no reconocido. Este espacio todavía no está cargado.");
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("space", spaceId);
    window.history.replaceState({}, "", url.toString());

    setCurrentSpace(SPACES[spaceId]);
    setFinalImage(null);
    setStatus("idle");
    setError("");
  }

  function parseSpaceFromQr(rawValue) {
    if (!rawValue) return null;

    const value = rawValue.trim();

    if (SPACES[value]) return value;

    if (value.startsWith("space=")) {
      const id = value.replace("space=", "").trim();
      return SPACES[id] ? id : null;
    }

    try {
      const url = new URL(value);
      const id = url.searchParams.get("space");
      return id && SPACES[id] ? id : null;
    } catch {
      return null;
    }
  }

  async function startQrScanner() {
    setError("");
    setFinalImage(null);
    setStatus("scanner");

    if (!("BarcodeDetector" in window)) {
      setError(
        "Este navegador no permite escanear QR desde la web. Probá con Chrome en Android o usá los botones de prueba."
      );
      return;
    }

    try {
      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      scannerDetectorRef.current = detector;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setScannerStream(mediaStream);

      setTimeout(() => {
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = mediaStream;
          scanQrLoop();
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setError("No se pudo abrir la cámara para escanear el QR.");
      setStatus("idle");
    }
  }

  async function scanQrLoop() {
    const video = scannerVideoRef.current;
    const detector = scannerDetectorRef.current;

    if (!video || !detector || status !== "scanner") {
      scannerLoopRef.current = requestAnimationFrame(scanQrLoop);
      return;
    }

    try {
      if (video.readyState >= 2) {
        const codes = await detector.detect(video);

        if (codes && codes.length > 0) {
          const rawValue = codes[0].rawValue;
          const spaceId = parseSpaceFromQr(rawValue);

          if (spaceId) {
            stopScannerTracks();
            selectSpace(spaceId);
            return;
          }

          setError("QR leído, pero no corresponde a un espacio cultural.");
        }
      }
    } catch (err) {
      console.error(err);
    }

    scannerLoopRef.current = requestAnimationFrame(scanQrLoop);
  }

  function stopScannerTracks() {
    if (scannerLoopRef.current) {
      cancelAnimationFrame(scannerLoopRef.current);
      scannerLoopRef.current = null;
    }

    if (scannerStream) {
      scannerStream.getTracks().forEach((track) => track.stop());
      setScannerStream(null);
    }

    if (scannerVideoRef.current) {
      scannerVideoRef.current.srcObject = null;
    }
  }

  function closeScanner() {
    stopScannerTracks();
    setStatus("idle");
  }

  async function startCamera() {
    if (!currentSpace) {
      setError("Primero escaneá el QR del espacio.");
      return;
    }

    setError("");
    setStatus("starting");

    try {
      let mediaStream = stream;

      if (!mediaStream) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        setStream(mediaStream);
      }

      setStatus("camera");

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo acceder a la cámara. Revisá permisos y usá HTTPS o localhost."
      );
      setStatus("idle");
    }
  }

  function stopCameraTracks() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function stopCamera() {
    stopCameraTracks();
    setStatus("idle");
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
    if (isCapturing || !currentSpace) return;

    setIsCapturing(true);
    setError("");

    setTimeout(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        setIsCapturing(false);
        setError("No se pudo capturar la cámara.");
        setStatus("idle");
        return;
      }

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

    if (!canvas) {
      setError("No se pudo acceder al canvas.");
      setStatus("idle");
      return;
    }

    const ctx = canvas.getContext("2d");

    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    try {
      if (!currentSpace) {
        throw new Error("No hay espacio seleccionado.");
      }

      const photo = await loadImage(capturedImage);
      const frame = await loadImage(currentSpace.frame);

      ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      drawPhotoInsideCenter(ctx, photo, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawCenterLightWash(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      ctx.drawImage(frame, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawSoftVignette(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const result = canvas.toDataURL("image/png");

      setFinalImage(result);
      setError("");
      setStatus("result");
    } catch (err) {
      console.error(err);

      setError(
        `No se pudo crear la postal. Falta o falla este marco: ${
          currentSpace?.frame || "sin marco"
        }`
      );

      setFinalImage(null);
      setStatus("idle");
    }
  }

  function drawPhotoInsideCenter(ctx, img, width, height) {
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

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x, y, w, h);

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
    gradient.addColorStop(1, "rgba(0,0,0,0.08)");

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
    if (!finalImage || !currentSpace) return;

    const link = document.createElement("a");
    link.href = finalImage;
    link.download = `postal-${currentSpace.id}.png`;
    link.click();
  }

  async function sharePostal() {
    if (!finalImage || !currentSpace) return;

    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();

      const file = new File([blob], `postal-${currentSpace.id}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: currentSpace.name,
          text: currentSpace.postalTitle,
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

    if (stream) {
      setStatus("camera");

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } else {
      setStatus("idle");
    }
  }

  const activeGuides = guides.slice(0, peopleCount);

  return (
    <main
      className={`app ${
        isCameraScreen || isScannerScreen ? "cameraMode" : ""
      }`}
    >
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

              {!currentSpace && (
                <>
                  <h2>Escaneá el QR del espacio</h2>
                  <p>
                    Primero activá la app. Después escaneá el QR del museo o
                    espacio cultural para cargar su marco.
                  </p>

                  <button className="startButton" onClick={startQrScanner}>
                    <span>▣</span>
                    Escanear QR del espacio
                  </button>

                  <div className="spaceGrid">
                    {Object.values(SPACES).map((space) => (
                      <button
                        key={space.id}
                        className="spaceButton"
                        onClick={() => selectSpace(space.id)}
                      >
                        <strong>{space.name}</strong>
                        <span>{space.postalSubtitle}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {currentSpace && (
                <>
                  <h2>{currentSpace.name}</h2>
                  <p>
                    Escena: <strong>{currentSpace.postalTitle}</strong>
                  </p>

                  <div className="sceneInstruction">
                    {currentSpace.instruction}
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

                  <button
                    className="demoButton"
                    onClick={() => {
                      setCurrentSpace(null);
                      setFinalImage(null);
                      setStatus("idle");
                      setError("");
                    }}
                  >
                    Escanear otro QR
                  </button>
                </>
              )}

              {error && <p className="error">{error}</p>}
            </div>
          )}

          {status === "scanner" && (
            <div className="cameraBox">
              <video ref={scannerVideoRef} autoPlay playsInline muted />

              <div className="scannerOverlay">
                <div className="scannerBox"></div>

                <div className="instructions">
                  <strong>Escaneá el QR del espacio</strong>
                  <span>El QR cargará automáticamente el marco correcto.</span>
                </div>
              </div>

              <button className="closeCameraButton" onClick={closeScanner}>
                Salir
              </button>
            </div>
          )}

          {(status === "starting" || status === "camera") && currentSpace && (
            <div className="cameraBox" ref={cameraBoxRef}>
              <video ref={videoRef} autoPlay playsInline muted />

              <div className="cameraTopBar">
                <div>
                  <span className="placeLabel">{currentSpace.name}</span>
                  <strong>{currentSpace.instruction}</strong>
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

              <button className="closeCameraButton" onClick={stopCamera}>
                Salir
              </button>
            </div>
          )}

          {status === "processing" && (
            <div className="processing">
              <div className="spinner"></div>
              <h2>Creando postal…</h2>
              <p>Combinando tu foto con el marco del espacio.</p>
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
            <p className="tag">Postales culturales</p>

            <h2>{currentSpace ? currentSpace.name : "Escaneá un QR"}</h2>

            {currentSpace ? (
              <div className="detectedCard">
                <span className="pin yellow"></span>
                <div>
                  <strong>{currentSpace.name}</strong>
                  <small>{currentSpace.postalTitle}</small>
                  <small>{currentSpace.instruction}</small>
                </div>
              </div>
            ) : (
              <div className="detectedCard">
                <span className="pin blue"></span>
                <div>
                  <strong>Sin espacio seleccionado</strong>
                  <small>Escaneá el QR del museo o espacio cultural.</small>
                </div>
              </div>
            )}

            <p>
              Cada QR carga un marco PNG transparente diferente y ubica la foto
              real en el centro del photocall.
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

                <button
                  className="secondary full"
                  onClick={() => {
                    setCurrentSpace(null);
                    setFinalImage(null);
                    setStatus("idle");
                    setError("");
                  }}
                >
                  Escanear otro QR
                </button>
              </>
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