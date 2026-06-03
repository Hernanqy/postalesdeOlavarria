const fs = require("fs");

const path = "src/main.jsx";
let s = fs.readFileSync(path, "utf8");

if (s.includes('id: "bioparque"')) {
  console.log("Bioparque ya existe. No hice cambios.");
  process.exit(0);
}

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
    end = i;
    break;
  }
}

if (end === -1) {
  console.error("No encontre el cierre de SPACES");
  process.exit(1);
}

fs.copyFileSync(path, path + ".bak");

const block = `,

  bioparque: {
    id: "bioparque",
    name: "Bioparque La Máxima",
    postalTitle: "Yo visité el Bioparque La Máxima",
    postalSubtitle: "Naturaleza · Fauna autóctona · Comunidad",
    frame: "/assets/marcos/bioparque-photocall.png",
    instruction: "Ubicate dentro del centro libre del marco.",
    description:
      "Una postal para recordar tu visita al Bioparque La Máxima, entre naturaleza, animales autóctonos y patrimonio vivo de Olavarría.",
  }`;

s = s.slice(0, end) + block + s.slice(end);

fs.writeFileSync(path, s, "utf8");

console.log("Listo: Bioparque agregado en src/main.jsx");
console.log("Backup creado en src/main.jsx.bak");
