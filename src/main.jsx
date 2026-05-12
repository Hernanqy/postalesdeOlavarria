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

  async function createPostal(capturedImage, width, height) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    try {
      const base = await loadImage(capturedImage);

      // Foto original
      ctx.drawImage(base, 0, 0, width, height);

      // Tono general
      ctx.fillStyle = "rgba(70, 43, 18, 0.18)";
      ctx.fillRect(0, 0, width, height);

      // Cargar gliptodonte removiendo fondo blanco/claro
      const gliptodonte = await loadImageWithoutLightBackground(
        "/assets/personajes/gliptodonte.png"
      );

      drawPng(
        ctx,
        gliptodonte,
        width * 0.04,
        height * 0.50,
        width * 0.34,
        height * 0.30
      );

      drawVignette(ctx, width, height);
      drawPostalFrame(ctx, width, height);
      drawText(ctx, width, height);

      const result = canvas.toDataURL("image/png");
      setFinalImage(result);
      setStatus("result");
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo cargar gliptodonte.png. Revisá que esté en public/assets/personajes/gliptodonte.png"
      );
      setStatus("camera");
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);

      img.onerror = () => {
        reject(new Error("No se pudo cargar la imagen: " + src));
      };

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
          const isNeutralLight = isVeryLight && colorDifference < 25;

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

      img.onerror = () => reject(new Error("No se pudo cargar la imagen: " + src));
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

                <div className="leftZone">Gliptodonte</div>
                <div className="rightZone">Fondo</div>

                <div className="instructions">
                  <strong>Ubicá a la persona dentro de la silueta</strong>
                  <span>El gliptodonte aparecerá a la izquierda.</span>
                </div>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="processing">
              <div className="spinner"></div>
              <h2>Creando postal…</h2>
              <p>Agregando gliptodonte, marco y color.</p>
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

            <h2>Foto guiada + gliptodonte PNG</h2>

            <p>
              Esta versión intenta borrar automáticamente el fondo blanco/claro
              del archivo <strong>gliptodonte.png</strong>.
            </p>

            <div className="steps">
              <div>
                <strong>1. Cámara</strong>
                <span>La persona se ubica en el centro.</span>
              </div>

              <div>
                <strong>2. PNG</strong>
                <span>El gliptodonte aparece en la zona izquierda.</span>
              </div>

              <div>
                <strong>3. Postal</strong>
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

                <button className="secondary full" onClick={sharePostal}>
                  📤 Compartir
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

          {error && <p className="error">{error}</p>}
        </div>
      </section>

      <canvas ref={canvasRef} hidden />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);