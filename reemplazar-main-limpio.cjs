const fs = require("fs");

const path = "src/main.jsx";

const clean = String.raw`import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 1600;

const SPACES = {
  ciencias: {
    id: "ciencias",
    name: "Museo de las Ciencias",
    postalTitle: "Yo visit\u00e9 el Museo de las Ciencias",
    postalSubtitle: "Ciencia \u00b7 Megafauna \u00b7 Descubrimiento",
    frame: "/assets/marcos/ciencias-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Viv\u00ed una postal imposible entre ciencia, megafauna, f\u00f3siles y descubrimientos.",
  },
  "damaso-arce": {
    id: "damaso-arce",
    name: "Museo D\u00e1maso Arce",
    postalTitle: "Yo visit\u00e9 el Museo D\u00e1maso Arce",
    postalSubtitle: "Arte \u00b7 Historia \u00b7 Cultura",
    frame: "/assets/marcos/damaso-arce-photocall.png",
    instruction: "Ubicate entre los personajes del marco.",
    description:
      "Convert\u00ed tu visita en una postal art\u00edstica junto a la historia cultural de Olavarr\u00eda.",
  },
  "centro-cultural": {
    id: "centro-cultural",
    name: "Centro Cultural",
    postalTitle: "Yo visit\u00e9 el Centro Cultural",
    postalSubtitle: "Arte \u00b7 M\u00fasica \u00b7 Comunidad",
    frame: "/assets/marcos/centro-cultural-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Sacate una postal creativa rodeada de arte, m\u00fasica, encuentro y cultura local.",
  },
  emiliozzi: {
    id: "emiliozzi",
    name: "Museo Hermanos Emiliozzi",
    postalTitle: "Yo visit\u00e9 el Museo Hermanos Emiliozzi",
    postalSubtitle: "Automovilismo \u00b7 Historia \u00b7 Olavarr\u00eda",
    frame: "/assets/marcos/emiliozzi-photocall.png",
    instruction: "Ubicate en el centro como protagonista de boxes.",
    description:
      "Llevate una postal junto a La Galera y el legado de los Hermanos Emiliozzi.",
  },
  "loma-negra": {
    id: "loma-negra",
    name: "Museo de Loma Negra",
    postalTitle: "Yo visit\u00e9 el Museo de Loma Negra",
    postalSubtitle: "Industria \u00b7 Inmigraci\u00f3n \u00b7 Comunidad",
    frame: "/assets/marcos/loma-negra-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar la historia industrial, inmigrante y comunitaria de Loma Negra.",
  },
  bioparque: {
    id: "bioparque",
    name: "Bioparque La M\u00e1xima",
    postalTitle: "Yo visit\u00e9 el Bioparque La M\u00e1xima",
    postalSubtitle: "Naturaleza \u00b7 Fauna aut\u00f3ctona \u00b7 Comunidad",
    frame: "/assets/marcos/bioparque-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar tu visita al Bioparque La M\u00e1xima, entre naturaleza, animales aut\u00f3ctonos y patrimonio vivo de Olavarr\u00eda.",
  },
};

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState("idle");
  const [currentSpace, setCurrentSpace] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showResultActions, setShowResultActions] = useState(false);

  const isCameraScreen = status === "starting" || status === "camera";

  useEffect(() => {
    loadSpaceFromUrl();
  }, []);

  useEffect(() => {
    if (
      (status === "camera" || status === "starting") &&
      videoRef.current &&
      stream
    ) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [status, stream]);

  useEffect(() => {
    let timer;

    if (status === "result" && finalImage) {
      setShowResultActions(false);

      timer = setTimeout(() => {
        setShowResultActions(true);
      }, 1600);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, finalImage]);

  useEffect(() => {
    return () => {
      stopCameraTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function startCamera() {
    if (!currentSpace) {
      setError("Escane\u00e1 el QR del espacio para cargar una postal.");
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
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo acceder a la c\u00e1mara. Revis\u00e1 permisos y us\u00e1 HTTPS o localhost."
      );
      setStatus("idle");
    }
  }

  function stopCameraTracks() {
    const activeStream = videoRef.current?.srcObject || stream;

    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
  }

  function stopCamera() {
    stopCameraTracks();
    setStatus("idle");
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
        setError("No se pudo capturar la c\u00e1mara.");
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

      setShowResultActions(false);
      setFinalImage(result);
      setError("");
      setStatus("result");
    } catch (err) {
      console.error(err);

      setError(
        \`No se pudo crear la postal. Falta o falla este marco: \${
          currentSpace?.frame || "sin marco"
        }\`
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
    link.download = \`postal-\${currentSpace.id}.png\`;
    link.click();
  }

  async function sharePostal() {
    if (!finalImage || !currentSpace) return;

    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();

      const file = new File([blob], \`postal-\${currentSpace.id}.png\`, {
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
    setShowResultActions(false);
    setError("");

    if (stream) {
      setStatus("camera");

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } else {
      setStatus("idle");
    }
  }

  return (
    <main className={\`app \${isCameraScreen ? "cameraMode" : ""}\`}>
      <section className="layout">
        <div className="preview">
          {status === "idle" && (
            <div className="intro">
              <img
                src="/assets/logos/olavarria-municipio.png"
                alt="Olavarr\u00eda Municipio"
                className="municipioLogo"
              />

              <div className="brandIcons">
                <span className="iconGhost"></span>
                <span className="iconRoad"></span>
                <span className="iconCrown"></span>
                <span className="iconTree"></span>
                <span className="iconDotBig"></span>
              </div>

              {!currentSpace && (
                <>
                  <h1>Postales culturales</h1>
                  <h2>Escane\u00e1 el QR del espacio</h2>

                  <p>
                    Acercate al punto de foto, escane\u00e1 el QR del museo o espacio
                    cultural y cre\u00e1 tu postal de recuerdo.
                  </p>

                  <div className="sceneInstruction">
                    El QR de cada lugar abre autom\u00e1ticamente su marco tem\u00e1tico.
                  </div>
                </>
              )}

              {currentSpace && (
                <>
                  <h1>Postales culturales</h1>
                  <h2>{currentSpace.name}</h2>

                  <p className="motivationalText">
                    Sacate una foto, convert\u00ed tu visita en una postal cultural y
                    compartila.
                  </p>

                  <div className="sceneInstruction">
                    {currentSpace.instruction}
                  </div>

                  <button className="startButton" onClick={startCamera}>
                    <span></span>
                    Activar c\u00e1mara
                  </button>
                </>
              )}

              {error && <p className="error">{error}</p>}
            </div>
          )}

          {(status === "starting" || status === "camera") && currentSpace && (
            <div className="cameraBox">
              <video ref={videoRef} autoPlay playsInline muted />

              <div className="cameraTopBar">
                <div>
                  <span className="placeLabel">{currentSpace.name}</span>
                  <strong>{currentSpace.instruction}</strong>
                </div>
              </div>

              <div className="overlay">
                <div className="centerPhotoArea"></div>

                <div className="instructions">
                  <strong>Ubicate en el centro libre del marco</strong>
                  <span>Ese espacio ser\u00e1 el centro de tu postal.</span>
                </div>
              </div>

              <button
                className={\`captureButton \${isCapturing ? "capturing" : ""}\`}
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
              <h2>Creando postal...</h2>
              <p>Combinando tu foto con el marco del espacio.</p>
            </div>
          )}

          {status === "result" && finalImage && (
            <div className="result">
              <div className="resultCard">
                <img src={finalImage} alt="Postal generada" />

                <div className="thanksMessage">
                  <span>Gracias por tu visita</span>
                  <strong>{currentSpace?.name}</strong>
                  <p>
                    Tu postal cultural ya est\u00e1 lista para guardar o compartir.
                  </p>
                </div>

                {showResultActions && (
                  <div className="resultActions">
                    <button className="primary full" onClick={sharePostal}>
                      Compartir postal
                    </button>

                    <button className="secondary full" onClick={downloadPostal}>
                      Guardar imagen
                    </button>

                    <button className="secondary full" onClick={reset}>
                      Tomar otra foto
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <div>
            <img
              src="/assets/logos/olavarria-municipio.png"
              alt="Olavarr\u00eda Municipio"
              className="panelLogo"
            />

            <p className="tag">Postales culturales</p>

            <h2>
              {currentSpace
                ? currentSpace.name
                : "Escane\u00e1 el QR del espacio"}
            </h2>

            {currentSpace ? (
              <div className="detectedCard">
                <span className="pin yellow"></span>
                <div>
                  <strong>{currentSpace.postalTitle}</strong>
                  <small>{currentSpace.postalSubtitle}</small>
                  <small>{currentSpace.description}</small>
                </div>
              </div>
            ) : (
              <div className="detectedCard">
                <span className="pin blue"></span>
                <div>
                  <strong>Sin espacio seleccionado</strong>
                  <small>
                    Escane\u00e1 el QR del museo o espacio cultural para comenzar.
                  </small>
                </div>
              </div>
            )}

            <p>
              Cada espacio cultural tiene un marco propio. Sac\u00e1 tu foto en el
              centro, descarg\u00e1 tu postal y compart\u00ed tu visita.
            </p>
          </div>

          <div className="actions">
            {status === "result" && showResultActions && (
              <>
                <button className="primary full" onClick={sharePostal}>
                  Compartir postal
                </button>

                <button className="secondary full" onClick={downloadPostal}>
                  Guardar imagen
                </button>

                <button className="secondary full" onClick={reset}>
                  Tomar otra foto
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
`;

fs.copyFileSync(path, path + ".bak-reemplazo-completo");
fs.writeFileSync(path, clean, "utf8");

console.log("Listo: src/main.jsx fue reemplazado por una versión limpia sin caracteres raros.");
console.log("Backup creado en src/main.jsx.bak-reemplazo-completo");
