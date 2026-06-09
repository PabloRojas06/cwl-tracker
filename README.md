# 🏰 CWL Tracker

Tracker de **Clan War Leagues** de Clash of Clans para tu clan. Registra ataques y defensas durante los 7 días de la liga y genera un ranking automático para entregar el bonus al mejor jugador.

## 🛠 Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + lucide-react
- **Backend:** Node.js + Express
- **Base de datos:** SQLite vía `better-sqlite3` (un solo archivo `.db`, sin instalación adicional)

---

## 📋 Requisitos previos

Solo necesitas **Node.js 18 o superior** instalado.

Para verificar tu versión, abre una terminal y ejecuta:

```bash
node --version
```

Si no tienes Node, descárgalo de [nodejs.org](https://nodejs.org) (la versión LTS está bien).

> **Nota Windows:** `better-sqlite3` se compila al instalarse. Si en Windows da error al instalar, instala las herramientas de compilación con:
> ```bash
> npm install --global windows-build-tools
> ```
> O instala Visual Studio Build Tools manualmente. En Mac y Linux normalmente no hay problema.

---

## 🚀 Cómo correrlo

1. **Abre la carpeta del proyecto en VS Code**
   ```
   File > Open Folder... > selecciona la carpeta cwl-tracker
   ```

2. **Abre la terminal de VS Code**
   - Atajo: `Ctrl + ñ` (Windows/Linux) o `Cmd + J` (Mac)
   - O en el menú: `Terminal > New Terminal`

3. **Instala las dependencias** (solo la primera vez)
   ```bash
   npm install
   ```
   Esto puede tardar un par de minutos.

4. **Arranca la aplicación**
   ```bash
   npm run dev
   ```
   Vas a ver algo así:
   ```
   🏰  CWL server listo en http://localhost:3001
   📦  Base de datos: /ruta/cwl-tracker/cwl.db
   
   VITE v5.x  ready in 500 ms
   ➜  Local:   http://localhost:5173/
   ```

5. **Abre el navegador en** `http://localhost:5173`

¡Listo! Para detener la app, presiona `Ctrl + C` en la terminal.

---

## 💾 Sobre la base de datos

- Al arrancar el servidor por primera vez, se crea automáticamente un archivo `cwl.db` en la raíz del proyecto.
- Todos los datos (participantes y registros de los 7 días) se guardan ahí.
- **Para resetear todo manualmente:** detén el servidor y borra el archivo `cwl.db`.
- El archivo `cwl.db` está en `.gitignore`, así que no se sube a Git si haces commit.

---

## 📁 Estructura del proyecto

```
cwl-tracker/
├── server.js              ← Backend Express + SQLite (API REST)
├── index.html             ← Punto de entrada HTML
├── package.json           ← Dependencias y scripts
├── vite.config.js         ← Config de Vite (con proxy al backend)
├── tailwind.config.js     ← Config de Tailwind
├── postcss.config.js      ← Config de PostCSS
├── public/
│   └── favicon.svg        ← Icono del castillo
├── src/
│   ├── main.jsx           ← Punto de entrada de React
│   ├── App.jsx            ← Componente principal (toda la UI)
│   ├── api.js             ← Cliente de la API (fetch wrappers)
│   └── index.css          ← Estilos globales (Tailwind)
├── cwl.db                 ← (autogenerado) Base de datos SQLite
└── README.md
```

---

## 🔌 Endpoints de la API

| Método | Ruta                       | Qué hace                              |
|--------|----------------------------|---------------------------------------|
| GET    | `/api/state`               | Devuelve participantes y todos sus registros |
| POST   | `/api/participants`        | Crea un participante                  |
| DELETE | `/api/participants/:id`    | Elimina un participante               |
| PUT    | `/api/day-data`            | Actualiza el registro de un día       |
| DELETE | `/api/state`               | Resetea todo (borra todos los datos)  |

---

## 🤖 Cómo pedirle ayuda a Claude Code

Si abres este proyecto en VS Code con la extensión Claude Code instalada, le puedes pedir ayuda con cosas como:

### Para entender el código
```
"Léete el README y explícame qué hace cada archivo del proyecto"
"¿Cómo funciona el cálculo del ranking? Mírate src/App.jsx"
```

### Para agregar features
```
"Agrega una columna 'tropa usada' al registro de cada ataque, con un select de las tropas más comunes (dragones, electros, valks, etc.)"

"En el ranking, agrega una medalla extra al jugador que más triples haya hecho"

"Crea una pestaña nueva llamada 'Historial' donde se puedan ver ligas anteriores. Hay que guardar la fecha de inicio y fin de cada liga en SQLite"

"Agrega un botón para exportar el ranking a una imagen PNG que se pueda compartir por WhatsApp"

"Suma puntos extra cuando un jugador ataca a un TH superior al suyo: +1 estrella si ataca a TH+1, +2 si ataca a TH+2 o más"
```

### Para arreglar problemas
```
"Cuando corro npm install me da error en better-sqlite3, ayúdame a solucionarlo"
"El servidor no arranca, dice que el puerto 3001 está ocupado, ¿qué hago?"
```

### Para desplegar
```
"Quiero que mi clan pueda usar este tracker desde sus celulares. ¿Cómo lo despliego en internet?"
```

---

## 🌐 Si quieres que tu clan acceda desde sus celulares

Por defecto el tracker corre solo en tu computadora. Si quieres que tu clan lo use, tienes opciones:

1. **Compartir tu red local (gratis, solo casa):** correr `npm run dev` y darle tu IP local a tu clan (ej. `http://192.168.1.100:5173`). Solo funciona si están en la misma red WiFi.

2. **Desplegar en internet (recomendado):** servicios como [Railway](https://railway.app), [Render](https://render.com) o [Fly.io](https://fly.io) tienen planes gratis que soportan Node.js + SQLite. Pídele a Claude Code que te ayude con el despliegue paso a paso.

3. **Túnel temporal con [ngrok](https://ngrok.com):** para pruebas rápidas, ngrok te da una URL pública apuntando a tu localhost.

---

## 📝 Reglas del tracker (recordatorio)

- **Estrellas amarillas:** las que tu jugador sacó en su ataque (0-3).
- **Escudos rojos:** las estrellas que el rival te quitó en defensa (0-3).
- **Si marcas 3 estrellas, el % se llena automáticamente en 100.**
- **Defensa que cuenta para el ranking:** `3 - escudos rojos` (si no te atacaron o defendiste perfecto, suman 3 estrellas defensivas).
- **Total:** estrellas de ataque + estrellas defensivas conservadas.
- **Empate:** se desempata por estrellas de ataque, luego por % promedio, luego por nombre alfabético.

---

## 🎯 Ideas para mejorar más adelante

- Múltiples ligas guardadas con histórico
- Bonus extra por atacar a TH superior
- Penalización por ataques no realizados
- Exportar resultados como imagen
- Modo "espectador" de solo lectura para los miembros del clan
- Login simple con contraseña para que solo el líder edite

¡Pregúntale a Claude Code y lo arma! 💛
