const fs = require("fs");

const path = "src/main.jsx";
let s = fs.readFileSync(path, "utf8");

// Backup
fs.copyFileSync(path, path + ".bak-textos");

// Reemplazos de textos rotos
const fixes = [
  ['Bioparque La MÃ¡xima', 'Bioparque La Máxima'],
  ['Yo visitÃ© el Bioparque La MÃ¡xima', 'Yo visité el Bioparque La Máxima'],
  ['Naturaleza · Fauna autÃ³ctona · Comunidad', 'Naturaleza · Fauna autóctona · Comunidad'],
  ['Una postal para recordar tu visita al Bioparque La MÃ¡xima, entre naturaleza, animales autÃ³ctonos y patrimonio vivo de OlavarrÃ­a.', 'Una postal para recordar tu visita al Bioparque La Máxima, entre naturaleza, animales autóctonos y patrimonio vivo de Olavarría.'],
  ['SacÃ¡ tu foto en el centro, descargÃ¡ tu postal y compartÃ­ tu visita.', 'Sacá tu foto en el centro, descargá tu postal y compartí tu visita.'],
  ['Sacate una foto, convertÃ­ tu visita en una postal cultural y compartila.', 'Sacate una foto, convertí tu visita en una postal cultural y compartila.'],
  ['Activar cÃ¡mara', 'Activar cámara'],
  ['CreÃ¡ tu postal', 'Creá tu postal'],
  ['MÃºsica', 'Música'],
  ['Automovilismo · Historia · OlavarrÃ­a', 'Automovilismo · Historia · Olavarría'],
  ['Una postal para recordar la historia industrial, inmigrante y comunitaria de Loma Negra.', 'Una postal para recordar la historia industrial, inmigrante y comunitaria de Loma Negra.']
];

for (const [bad, good] of fixes) {
  s = s.split(bad).join(good);
}

// Cambiar el título principal cuando hay espacio seleccionado
s = s.replace(
  /<h1>\s*Creá tu postal\s*<\/h1>/,
  '<h1>Postales culturales</h1>'
);

// Por si quedó roto en mojibake
s = s.replace(
  /<h1>\s*CreÃ¡ tu postal\s*<\/h1>/,
  '<h1>Postales culturales</h1>'
);

fs.writeFileSync(path, s, "utf8");

console.log("Listo: textos corregidos en src/main.jsx");
console.log("Backup creado en src/main.jsx.bak-textos");
