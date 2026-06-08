const fs = require("fs");

const path = "src/main.jsx";
let s = fs.readFileSync(path, "utf8");

fs.copyFileSync(path, path + ".bak-limpieza-total");

// 1) Reemplazar todo el objeto SPACES por una versión limpia
const start = s.indexOf("const SPACES = {");

if (start === -1) {
  console.error("No encontré const SPACES");
  process.exit(1);
}

const open = s.indexOf("{", start);
let depth = 0;
let end = -1;

for (let i = open; i < s.length; i++) {
  if (s[i] === "{") depth++;
  if (s[i] === "}") depth--;

  if (depth === 0) {
    end = i + 1;
    break;
  }
}

if (end === -1) {
  console.error("No encontré el cierre de SPACES");
  process.exit(1);
}

const cleanSpaces = `const SPACES = {
  ciencias: {
    id: "ciencias",
    name: "Museo de las Ciencias",
    postalTitle: "Yo visité el Museo de las Ciencias",
    postalSubtitle: "Ciencia · Megafauna · Descubrimiento",
    frame: "/assets/marcos/ciencias-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Viví una postal imposible entre ciencia, megafauna, fósiles y descubrimientos.",
  },
  "damaso-arce": {
    id: "damaso-arce",
    name: "Museo Dámaso Arce",
    postalTitle: "Yo visité el Museo Dámaso Arce",
    postalSubtitle: "Arte · Historia · Cultura",
    frame: "/assets/marcos/damaso-arce-photocall.png",
    instruction: "Ubicate entre los personajes del marco.",
    description:
      "Convertí tu visita en una postal artística junto a la historia cultural de Olavarría.",
  },
  "centro-cultural": {
    id: "centro-cultural",
    name: "Centro Cultural",
    postalTitle: "Yo visité el Centro Cultural",
    postalSubtitle: "Arte · Música · Comunidad",
    frame: "/assets/marcos/centro-cultural-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Sacate una postal creativa rodeada de arte, música, encuentro y cultura local.",
  },
  emiliozzi: {
    id: "emiliozzi",
    name: "Museo Hermanos Emiliozzi",
    postalTitle: "Yo visité el Museo Hermanos Emiliozzi",
    postalSubtitle: "Automovilismo · Historia · Olavarría",
    frame: "/assets/marcos/emiliozzi-photocall.png",
    instruction: "Ubicate en el centro como protagonista de boxes.",
    description:
      "Llevate una postal junto a La Galera y el legado de los Hermanos Emiliozzi.",
  },
  "loma-negra": {
    id: "loma-negra",
    name: "Museo de Loma Negra",
    postalTitle: "Yo visité el Museo de Loma Negra",
    postalSubtitle: "Industria · Inmigración · Comunidad",
    frame: "/assets/marcos/loma-negra-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar la historia industrial, inmigrante y comunitaria de Loma Negra.",
  },
  bioparque: {
    id: "bioparque",
    name: "Bioparque La Máxima",
    postalTitle: "Yo visité el Bioparque La Máxima",
    postalSubtitle: "Naturaleza · Fauna autóctona · Comunidad",
    frame: "/assets/marcos/bioparque-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar tu visita al Bioparque La Máxima, entre naturaleza, animales autóctonos y patrimonio vivo de Olavarría.",
  },
};`;

s = s.slice(0, start) + cleanSpaces + s.slice(end);

// 2) Corregir mensajes puntuales fuera de SPACES
s = s.replace(
  /"No se pudo acceder a la cámara\.[\s\S]*?localhost\."/,
  `"No se pudo acceder a la cámara. Revisá permisos y usá HTTPS o localhost."`
);

s = s.replace(
  /<p>\s*Acercate al punto de foto,[\s\S]*?postal de recuerdo\.\s*<\/p>/,
  `<p>
                    Acercate al punto de foto, escaneá el QR del museo o espacio
                    cultural y creá tu postal de recuerdo.
                  </p>`
);

s = s.replace(
  /<div className="sceneInstruction">\s*El QR de cada lugar abre[\s\S]*?marco[\s\S]*?\.\s*<\/div>/,
  `<div className="sceneInstruction">
                    El QR de cada lugar abre automáticamente su marco temático.
                  </div>`
);

s = s.replace(
  /<span>Ese espacio[\s\S]*?centro de tu postal\.<\/span>/,
  `<span>Ese espacio será el centro de tu postal.</span>`
);

s = s.replace(
  /<h2>Creando postal[\s\S]*?<\/h2>/,
  `<h2>Creando postal...</h2>`
);

// 3) Reemplazar completamente el mensaje final de "Gracias por tu visita"
s = s.replace(
  /<div className="thanksMessage">[\s\S]*?<\/div>\s*\n\s*\{showResultActions && \(/,
  `<div className="thanksMessage">
                  <span>Gracias por tu visita</span>
                  <strong>{currentSpace?.name}</strong>
                  <p>
                    Tu postal cultural ya está lista para guardar o compartir.
                  </p>
                </div>

                {showResultActions && (`
);

// 4) Limpieza final de caracteres raros típicos
const fixes = [
  ["Ã¡", "á"],
  ["Ã©", "é"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ãº", "ú"],
  ["Ã±", "ñ"],
  ["ÃA", "Á"],
  ["Ã‰", "É"],
  ["ÃM", "Í"],
  ["Ã“", "Ó"],
  ["Ãš", "Ú"],
  ["Ã‘", "Ñ"],
  ["Â·", "·"],
  ["Â", ""],
  ["â€¦", "..."],
  ["âœ¨", ""],
  ["ðŸ“·", ""],
  ["ðŸ“¸", ""],
  ["â€œ", "\""],
  ["â€", "\""]
];

for (const [bad, good] of fixes) {
  s = s.split(bad).join(good);
}

fs.writeFileSync(path, s, "utf8");

console.log("Listo: limpieza total aplicada.");
console.log("Backup creado en src/main.jsx.bak-limpieza-total");
