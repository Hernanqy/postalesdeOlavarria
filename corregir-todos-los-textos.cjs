const fs = require("fs");

const path = "src/main.jsx";
let s = fs.readFileSync(path, "utf8");

fs.copyFileSync(path, path + ".bak-sin-simbolos-raros");

// Correcciones puntuales de textos rotos
const fixes = [
  ["VivÃ­", "Viví"],
  ["fÃ³siles", "fósiles"],
  ["DÃ¡maso", "Dámaso"],
  ["ConvertÃ­", "Convertí"],
  ["artÃ­stica", "artística"],
  ["mÃºsica", "música"],
  ["InmigraciÃ³n", "Inmigración"],
  ["RevisÃ¡", "Revisá"],
  ["usÃ¡", "usá"],
  ["escaneÃ¡", "escaneá"],
  ["creÃ¡", "creá"],
  ["automÃ¡ticamente", "automáticamente"],
  ["temÃ¡tico", "temático"],
  ["serÃ¡", "será"],
  ["estÃ¡", "está"],
  ["MÃ¡xima", "Máxima"],
  ["OlavarrÃ­a", "Olavarría"],
  ["autÃ³ctona", "autóctona"],
  ["autÃ³ctonos", "autóctonos"],
  ["visitÃ©", "visité"],
  ["cÃ¡mara", "cámara"],
  ["SacÃ¡", "Sacá"],
  ["descargÃ¡", "descargá"],
  ["compartÃ­", "compartí"],
  ["Â·", "·"],
  ["Â", ""],
  ["â€¦", "..."],
  ["âœ¨", ""]
];

for (const [bad, good] of fixes) {
  s = s.split(bad).join(good);
}

// Fuerza textos principales correctos para evitar que quede algún símbolo raro
s = s.replace(
  /description:\s*"Viv.*?descubrimientos\.",/s,
  'description:\n      "Viví una postal imposible entre ciencia, megafauna, fósiles y descubrimientos.",'
);

s = s.replace(
  /name:\s*"Museo D.*?Arce",/,
  'name: "Museo Dámaso Arce",'
);

s = s.replace(
  /postalTitle:\s*"Yo visit.*?Museo D.*?Arce",/,
  'postalTitle: "Yo visité el Museo Dámaso Arce",'
);

s = s.replace(
  /description:\s*"Convert.*?Olavarría\.",/s,
  'description:\n      "Convertí tu visita en una postal artística junto a la historia cultural de Olavarría.",'
);

s = s.replace(
  /description:\s*"Sacate una postal creativa.*?local\.",/s,
  'description:\n      "Sacate una postal creativa rodeada de arte, música, encuentro y cultura local.",'
);

s = s.replace(
  /postalSubtitle:\s*"Industria.*?Comunidad",/,
  'postalSubtitle: "Industria · Inmigración · Comunidad",'
);

s = s.replace(
  /setError\(\s*"No se pudo acceder a la cámara\..*?"\s*\);/s,
  'setError(\n        "No se pudo acceder a la cámara. Revisá permisos y usá HTTPS o localhost."\n      );'
);

// Pantalla inicial sin espacio seleccionado
s = s.replace(
  /<p>\s*Acercate al punto de foto,[\s\S]*?cre.*?postal de recuerdo\.\s*<\/p>/,
  `<p>
                    Acercate al punto de foto, escaneá el QR del museo o espacio
                    cultural y creá tu postal de recuerdo.
                  </p>`
);

s = s.replace(
  /<div className="sceneInstruction">\s*El QR de cada lugar abre[\s\S]*?marco.*?\.\s*<\/div>/,
  `<div className="sceneInstruction">
                    El QR de cada lugar abre automáticamente su marco temático.
                  </div>`
);

// Texto de cámara
s = s.replace(
  /<span>Ese espacio ser.*?centro de tu postal\.<\/span>/,
  "<span>Ese espacio será el centro de tu postal.</span>"
);

// Pantalla procesando
s = s.replace(
  /<h2>Creando postal.*?<\/h2>/,
  "<h2>Creando postal...</h2>"
);

// Mensaje final después de sacar la foto.
// Lo dejo SIN emojis para evitar cualquier símbolo raro en celulares.
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

// Limpieza final por si quedó alguna secuencia típica
s = s
  .replace(/Ã¡/g, "á")
  .replace(/Ã©/g, "é")
  .replace(/Ã­/g, "í")
  .replace(/Ã³/g, "ó")
  .replace(/Ãº/g, "ú")
  .replace(/Ã±/g, "ñ")
  .replace(/ÃA/g, "Á")
  .replace(/Ã‰/g, "É")
  .replace(/ÃM/g, "Í")
  .replace(/Ã“/g, "Ó")
  .replace(/Ãš/g, "Ú")
  .replace(/Ã‘/g, "Ñ")
  .replace(/âœ¨/g, "")
  .replace(/â€¦/g, "...")
  .replace(/Â/g, "");

fs.writeFileSync(path, s, "utf8");

console.log("Listo: textos corregidos y mensaje final sin símbolos raros.");
console.log("Backup creado en src/main.jsx.bak-sin-simbolos-raros");
