import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState("idle");
  const [finalImage, setFinalImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  async function startCamera() {
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

  function capturePhoto() {
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

    setTimeout(() => {
      createPostal(capturedImage, width, height);
    }, 500);
  }

  function createPostal(capturedImage, width, height) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    const base = new Image();

    base.onload = () => {
      ctx.drawImage(base, 0, 0, width, height);

      // Tono general
      ctx.fillStyle = "rgba(70, 43, 18, 0.18)";
      ctx.fillRect(0, 0, width, height);

      drawBackgroundElement(ctx, width, height);
      drawSimpleCharacter(ctx, width, height);
      drawVignette(ctx, width, height);
      drawPostalFrame(ctx, width, height);
      drawText(ctx, width, height);

      const result = canvas.toDataURL("image/png");
      setFinalImage(result);
      setStatus("result");
    };

    base.src = capturedImage;
  }

  function drawSimpleCharacter(ctx, width, height) {
    const x = width * 0.07;
    const y = height * 0.48;
    const w = width * 0.24;
    const h = height * 0.25;

    ctx.save();
    ctx.globalAlpha = 0.92;

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.beginPath();
    ctx.ellipse(
      x + w * 0.55,
      y + h * 1.05,
      w * 0.55,
      h * 0.12,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Cuerpo tipo personaje placeholder
    ctx.fillStyle = "rgba(116, 79, 50, 0.96)";
    ctx.beginPath();
    ctx.ellipse(
      x + w * 0.5,
      y + h * 0.55,
      w * 0.48,
      h * 0.38,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Cabeza
    ctx.fillStyle = "rgba(145, 100, 63, 0.96)";
    ctx.beginPath();
    ctx.ellipse(
      x + w * 0.8,
      y + h * 0.33,
      w * 0.22,
      h * 0.2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Patas
    ctx.fillStyle = "rgba(65, 45, 31, 0.96)";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(
        x + w * (0.23 + i * 0.14),
        y + h * 0.75,
        w * 0.07,
        h * 0.23
      );
    }

    ctx.restore();
  }

  function drawBackgroundElement(ctx, width, height) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "rgba(245, 224, 180, 0.40)";

    ctx.beginPath();
    ctx.moveTo(width * 0.66, height * 0.6);
    ctx.lineTo(width * 0.76, height * 0.34);
    ctx.lineTo(width * 0.86, height * 0.6);
    ctx.lineTo(width * 0.94, height * 0.43);
    ctx.lineTo(width, height * 0.62);
    ctx.lineTo(width, height);
    ctx.lineTo(width * 0.66, height);
    ctx.closePath();
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
    gradient.addColorStop(1, "rgba(0,0,0,0.48)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPostalFrame(ctx, width, height) {
    const border = Math.max(24, width * 0.035);

    ctx.save();

    ctx.strokeStyle = "rgba(255, 248, 230, 0.95)";
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, width - border, height - border);

    ctx.strokeStyle = "rgba(65, 39, 20, 0.70)";
    ctx.lineWidth = 4;
    ctx.strokeRect(border, border, width - border * 2, height - border * 2);

    ctx.restore();
  }

  function drawText(ctx, width, height) {
    ctx.save();

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 248, 230, 0.98)";
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 8;

    ctx.font = `bold ${Math.round(width * 0.045)}px Georgia, serif`;
    ctx.fillText("POSTAL VIVA", width / 2, height * 0.88);

    ctx.font = `${Math.round(width * 0.022)}px Arial, sans-serif`;
    ctx.fillText("Una foto que no existía", width / 2, height * 0.925);

    ctx.restore();
  }

  function downloadPostal() {
    if (!finalImage) return;

    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "postal-viva.png";
    link.click();
  }

  function reset() {
    setFinalImage(null);
    setStatus(stream ? "camera" : "idle");
  }

  return (
    <main className="app">
      <section className="layout">
        <div className="preview">
          {status === "idle" && (
            <div className="intro">
              <div className="icon">🖼️</div>

              <h1>Postal Viva</h1>

              <p>
                Activá la cámara, ubicá a la persona dentro de la guía y generá
                una postal intervenida.
              </p>

              <button className="primary" onClick={startCamera}>
                📷 Activar cámara
              </button>

              {error && <p className="error">{error}</p>}
            </div>
          )}

          {(status === "starting" || status === "camera") && (
            <div className="cameraBox">
              <video ref={videoRef} autoPlay playsInline muted />

              <div className="overlay">
                <div className="safePerson"></div>

                <div className="leftZone">Personaje</div>
                <div className="rightZone">Fondo</div>

                <div className="instructions">
                  <strong>Ubicá a la persona dentro de la silueta</strong>
                  <span>Los personajes aparecerán en los laterales.</span>
                </div>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="processing">
              <div className="spinner"></div>
              <h2>Creando postal…</h2>
              <p>Agregando escena, personaje, marco y color.</p>
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
            <p className="tag">MVP básico</p>

            <h2>Foto guiada + postal automática</h2>

            <p>
              Esta versión no usa IA. Controla la composición con una zona
              central segura para la persona y elementos agregados en los
              laterales.
            </p>

            <div className="steps">
              <div>
                <strong>1. Guía de encuadre</strong>
                <span>La persona queda en el centro.</span>
              </div>

              <div>
                <strong>2. Zonas seguras</strong>
                <span>Los agregados aparecen a los lados.</span>
              </div>

              <div>
                <strong>3. Postal final</strong>
                <span>Se genera una imagen descargable.</span>
              </div>
            </div>
          </div>

          <div className="actions">
            {status === "camera" && (
              <button className="primary full" onClick={capturePhoto}>
                📷 Sacar foto
              </button>
            )}

            {status === "result" && (
              <>
                <button className="primary full" onClick={downloadPostal}>
                  ⬇️ Descargar postal
                </button>

                <button className="secondary full" onClick={reset}>
                  🔄 Tomar otra foto
                </button>
              </>
            )}

            {status !== "idle" && status !== "result" && (
              <button className="secondary full" onClick={reset}>
                Reiniciar
              </button>
            )}
          </div>
        </div>
      </section>

      <canvas ref={canvasRef} hidden />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);