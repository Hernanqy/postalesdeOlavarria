const fs = require("fs");

const path = "src/main.jsx";
let s = fs.readFileSync(path, "utf8");

fs.copyFileSync(path, path + ".bak-textos-ascii");

// Reemplaza completo SPACES con textos simples, sin acentos ni simbolos raros.
const start = s.indexOf("const SPACES = {");
if (start === -1) {
  console.error("No encontre const SPACES");
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
  console.error("No encontre el cierre de SPACES");
  process.exit(1);
}

const cleanSpaces = `const SPACES = {
  ciencias: {
    id: "ciencias",
    name: "Museo de las Ciencias",
    postalTitle: "Yo visite el Museo de las Ciencias",
    postalSubtitle: "Ciencia - Megafauna - Descubrimiento",
    frame: "/assets/marcos/ciencias-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar tu visita al Museo de las Ciencias.",
  },
  "damaso-arce": {
    id: "damaso-arce",
    name: "Museo Damaso Arce",
    postalTitle: "Yo visite el Museo Damaso Arce",
    postalSubtitle: "Arte - Historia - Cultura",
    frame: "/assets/marcos/damaso-arce-photocall.png",
    instruction: "Ubicate entre los personajes del marco.",
    description:
      "Una postal para recordar tu visita al Museo Damaso Arce.",
  },
  "centro-cultural": {
    id: "centro-cultural",
    name: "Centro Cultural",
    postalTitle: "Yo visite el Centro Cultural",
    postalSubtitle: "Arte - Musica - Comunidad",
    frame: "/assets/marcos/centro-cultural-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar tu visita al Centro Cultural.",
  },
  emiliozzi: {
    id: "emiliozzi",
    name: "Museo Hermanos Emiliozzi",
    postalTitle: "Yo visite el Museo Hermanos Emiliozzi",
    postalSubtitle: "Automovilismo - Historia - Olavarria",
    frame: "/assets/marcos/emiliozzi-photocall.png",
    instruction: "Ubicate en el centro como protagonista.",
    description:
      "Una postal para recordar tu visita al Museo Hermanos Emiliozzi.",
  },
  "loma-negra": {
    id: "loma-negra",
    name: "Museo de Loma Negra",
    postalTitle: "Yo visite el Museo de Loma Negra",
    postalSubtitle: "Industria - Inmigracion - Comunidad",
    frame: "/assets/marcos/loma-negra-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar tu visita al Museo de Loma Negra.",
  },
  bioparque: {
    id: "bioparque",
    name: "Bioparque La Maxima",
    postalTitle: "Yo visite el Bioparque La Maxima",
    postalSubtitle: "Naturaleza - Fauna autoctona - Comunidad",
    frame: "/assets/marcos/bioparque-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar tu visita al Bioparque La Maxima.",
  },
};`;

s = s.slice(0, start) + cleanSpaces + s.slice(end);

// Textos generales de la pantalla inicial, camara, resultado y panel.
s = s.replace(/Escaneá/g, "Escanea");
s = s.replace(/EscaneÃ¡/g, "Escanea");
s = s.replace(/creá/g, "crea");
s = s.replace(/creÃ¡/g, "crea");
s = s.replace(/automáticamente/g, "automaticamente");
s = s.replace(/automÃ¡ticamente/g, "automaticamente");
s = s.replace(/temático/g, "tematico");
s = s.replace(/temÃ¡tico/g, "tematico");
s = s.replace(/será/g, "sera");
s = s.replace(/serÃ¡/g, "sera");
s = s.replace(/cámara/g, "camara");
s = s.replace(/cÃ¡mara/g, "camara");
s = s.replace(/Revisá/g, "Revisa");
s = s.replace(/RevisÃ¡/g, "Revisa");
s = s.replace(/usá/g, "usa");
s = s.replace(/usÃ¡/g, "usa");
s = s.replace(/Sacá/g, "Saca");
s = s.replace(/SacÃ¡/g, "Saca");
s = s.replace(/descargá/g, "descarga");
s = s.replace(/descargÃ¡/g, "descarga");
s = s.replace(/compartí/g, "comparti");
s = s.replace(/compartÃ­/g, "comparti");
s = s.replace(/convertí/g, "converti");
s = s.replace(/convertÃ­/g, "converti");
s = s.replace(/está/g, "esta");
s = s.replace(/estÃ¡/g, "esta");
s = s.replace(/Olavarría/g, "Olavarria");
s = s.replace(/OlavarrÃ­a/g, "Olavarria");

// Fuerza bloques completos limpios.
s = s.replace(
  /<h2>Escane[\s\S]*?el QR del espacio<\/h2>/g,
  "<h2>Escanea el QR del espacio</h2>"
);

s = s.replace(
  /<p>\s*Acercate al punto de foto,[\s\S]*?postal de recuerdo\.\s*<\/p>/g,
  `<p>
                    Acercate al punto de foto, escanea el QR del museo o espacio
                    cultural y crea tu postal de recuerdo.
                  </p>`
);

s = s.replace(
  /<div className="sceneInstruction">\s*El QR de cada lugar abre[\s\S]*?<\/div>/g,
  `<div className="sceneInstruction">
                    El QR de cada lugar abre automaticamente su marco tematico.
                  </div>`
);

s = s.replace(
  /<p className="motivationalText">[\s\S]*?<\/p>/g,
  `<p className="motivationalText">
                    Sacate una foto, converti tu visita en una postal cultural y
                    compartila.
                  </p>`
);

s = s.replace(
  /<span>Ese espacio[\s\S]*?centro de tu postal\.<\/span>/g,
  "<span>Ese espacio sera el centro de tu postal.</span>"
);

s = s.replace(
  /<h2>Creando postal[\s\S]*?<\/h2>/g,
  "<h2>Creando postal...</h2>"
);

s = s.replace(
  /<span>[\s\S]*?Gracias por tu visita[\s\S]*?<\/span>/g,
  "<span>Gracias por tu visita</span>"
);

s = s.replace(
  /<p>\s*Tu postal cultural ya[\s\S]*?guardar o compartir\.\s*<\/p>/g,
  `<p>
                    Tu postal cultural ya esta lista para guardar o compartir.
                  </p>`
);

s = s.replace(
  /Cada espacio cultural tiene un marco propio\.[\s\S]*?compart[\s\S]*?visita\./g,
  "Cada espacio cultural tiene un marco propio. Saca tu foto en el centro, descarga tu postal y comparti tu visita."
);

s = s.replace(
  /No se pudo acceder a la camara\.[\s\S]*?localhost\./g,
  "No se pudo acceder a la camara. Revisa permisos y usa HTTPS o localhost."
);

// Borra restos de simbolos raros tipicos.
s = s
  .replace(/Ã¡/g, "a")
  .replace(/Ã©/g, "e")
  .replace(/Ã­/g, "i")
  .replace(/Ã³/g, "o")
  .replace(/Ãº/g, "u")
  .replace(/Ã±/g, "n")
  .replace(/ÃA/g, "A")
  .replace(/Ã‰/g, "E")
  .replace(/ÃM/g, "I")
  .replace(/Ã“/g, "O")
  .replace(/Ãš/g, "U")
  .replace(/Ã‘/g, "N")
  .replace(/Â·/g, "-")
  .replace(/Â/g, "")
  .replace(/âœ¨/g, "")
  .replace(/â€¦/g, "...")
  .replace(/ðŸ“·/g, "")
  .replace(/ðŸ“¸/g, "");

// Ultimo filtro: elimina cualquier caracter no ASCII de textos.
// Esto evita que vuelva a aparecer un simbolo raro.
s = s.replace(/[^\x00-\x7F]/g, "");

fs.writeFileSync(path, s, "utf8");

console.log("Listo: textos pasados a espanol simple sin acentos ni simbolos raros.");
console.log("Backup creado en src/main.jsx.bak-textos-ascii");
