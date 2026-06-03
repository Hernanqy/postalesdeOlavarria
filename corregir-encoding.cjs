const fs = require("fs");

const path = "src/main.jsx";
let s = fs.readFileSync(path, "utf8");

fs.copyFileSync(path, path + ".bak-encoding");

const fixes = [
  // Bioparque
  ["Yo visitÃ© el Bioparque La MÃ¡xima", "Yo visité el Bioparque La Máxima"],
  ["Yo visitÃ© el Bioparque La Máxima", "Yo visité el Bioparque La Máxima"],
  ["Bioparque La MÃ¡xima", "Bioparque La Máxima"],
  ["Bioparque La MÃ¡xima", "Bioparque La Máxima"],
  ["Naturaleza Â· Fauna autÃ³ctona Â· Comunidad", "Naturaleza · Fauna autóctona · Comunidad"],
  ["Naturaleza Â· Fauna autóctona Â· Comunidad", "Naturaleza · Fauna autóctona · Comunidad"],
  ["Naturaleza · Fauna autÃ³ctona · Comunidad", "Naturaleza · Fauna autóctona · Comunidad"],
  ["animales autÃ³ctonos", "animales autóctonos"],
  ["animales autóctonos", "animales autóctonos"],
  ["OlavarrÃ­a", "Olavarría"],
  ["Olavarría", "Olavarría"],

  // Textos generales
  ["SacÃ¡ tu foto", "Sacá tu foto"],
  ["Sacá tu foto", "Sacá tu foto"],
  ["descargÃ¡ tu postal", "descargá tu postal"],
  ["descargá tu postal", "descargá tu postal"],
  ["compartÃ­ tu visita", "compartí tu visita"],
  ["compartí tu visita", "compartí tu visita"],
  ["convertÃ­ tu visita", "convertí tu visita"],
  ["convertí tu visita", "convertí tu visita"],
  ["Activar cÃ¡mara", "Activar cámara"],
  ["Activar cámara", "Activar cámara"],
  ["CreÃ¡ tu postal", "Creá tu postal"],
  ["Creá tu postal", "Creá tu postal"],
  ["EscaneÃ¡", "Escaneá"],
  ["Escaneá", "Escaneá"],

  // Emoji roto del botón cámara
  ["ðŸ“·", "📷"],
  ["ðŸ“¸", "📷"],

  // Otros posibles mojibakes
  ["MÃ¡xima", "Máxima"],
  ["MÃºsica", "Música"],
  ["autÃ³ctona", "autóctona"],
  ["autÃ³ctonos", "autóctonos"],
  ["visitÃ©", "visité"],
  ["cÃ¡mara", "cámara"],
  ["compartÃ­", "compartí"],
  ["convertÃ­", "convertí"],
  ["descargÃ¡", "descargá"],
  ["SacÃ¡", "Sacá"],
  ["OlavarrÃ­a", "Olavarría"],
  ["Â·", "·"],
  ["Â", ""]
];

for (const [bad, good] of fixes) {
  s = s.split(bad).join(good);
}

// Cambiar título principal de la pantalla con espacio seleccionado
s = s.replace(
  /<h1>\s*Creá tu postal\s*<\/h1>/g,
  "<h1>Postales culturales</h1>"
);

s = s.replace(
  /<h1>\s*CreÃ¡ tu postal\s*<\/h1>/g,
  "<h1>Postales culturales</h1>"
);

// Asegurar que el botón quede con emoji correcto
s = s.replace(
  /<span>.*?<\/span>\s*Activar cámara/g,
  "<span>📷</span>\n                    Activar cámara"
);

fs.writeFileSync(path, s, "utf8");

console.log("Listo: corregí textos raros, acentos y emoji de cámara.");
console.log("Backup creado en src/main.jsx.bak-encoding");
