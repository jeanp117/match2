import exp = require("constants");
import { Status } from "./types";
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://192.168.1.2:5173",
      "http://localhost:3000",
      "http://localhost:5172",
      "http://localhost:5173",
    ],
  },
});

const game: Status = {
  status: "waiting",
  players: {
    player1: {
      nombre: "Silvia",
      email: "jeanpr117@gmail.com",
      celular: "626",
      genero: "F",
      expression: "",
      bpm: 0,
      bateria: null,
    },
    player2: {
      nombre: "Silvia",
      email: "jeanpr117@gmail.com",
      celular: "626",
      genero: "F",
      expression: "",
      bpm: 0,
      bateria: null,
    },
  },
  debug: true,
  video: {
    url: "",
    standbyURL: "",
    progress: 0,
    duration: null,
    paused: true,
    sections: [],
  },
  online: {
    players: false,
    consola: false,
    TV: false,
  },
  playersReady: false,
  id: generateId(),
  heartRate: {
    fake: false,
    devices: [],
  },
};

//read config.json file and set the video url and sections
const fs = require("fs");
const path = require("path");
const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "config.json"), "utf-8")
);
game.video.url = config.videoURL;
game.video.standbyURL = config.standbyURL;
game.video.sections = config.sections;
game.heartRate = config.heartRate;

function generateId() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

function updateStatus() {
  let isReady;
  try {
    isReady = canStartGame();
  } catch (error) {
    console.error(error.message);
  }

  if (!["playing", "ended"].includes(game.status)) {
    if (game.status === "waiting" && isReady) {
      game.status = "ready";
    }
    if (game.status === "ready" && !isReady) {
      game.status = "waiting";
    }
  }

  io.emit("game:status", game);
}

function canStartGame() {
  if (!game.online.consola) throw new Error("La consola no está conectada");
  if (!game.online.players)
    throw new Error("Los jugadores no están conectados");
  if (!game.online.TV) throw new Error("La TV no está conectada");
  if (!game.playersReady)
    throw new Error("No todos los jugadores están listos");
  if (!game.video.url || !game.video.sections)
    throw new Error("No hay video o secciones");

  for (const player of ["player1", "player2"]) {
    const { nombre, email, celular, genero } = game.players[player];
    if (!nombre || !email || !celular || !genero) {
      throw new Error("Datos incompletos de los jugadores");
    }
  }

  return true;
}

function joinAs(role, socket) {
  if (["players", "consola", "TV"].includes(role)) {
    socket.role = role;
    game.online[role] = true;
  }
}

function startGame() {
  try {
    canStartGame();
    //game.video.progress = 0;
    game.video.paused = false;
    game.debug = false;
    game.status = "playing";

    io.emit("game:start");
  } catch (error) {
    io.emit("game:error", error.message);
    console.error(error);
  }
  updateStatus();
}

function onProgress(time) {
  game.video.progress = time;
  game.status =
    game.video.progress >= game.video.duration ? "ended" : "playing";
  if (game.status === "ended") {
    game.video.progress = 0;
    game.video.paused = true;
  }
  updateStatus();
}

function onExpression({ player, expression }) {
  const { video } = game;
  game.players[player].expression = expression;

  let suma = 1;

  if (expression === "neutral") {
    suma = 0.05;
  }

  video.sections.forEach((section) => {
    if (section.start <= video.progress && section.end >= video.progress) {
      if (!section.expressions) {
        section.expressions = { player1: {}, player2: {} };
      }

      section.expressions[player][expression] =
        (section.expressions[player][expression] || 0) + suma;
    }
  });
  updateStatus();
}

function onBPM({ player, bpm }) {
  game.players[player].bpm = bpm;
  updateStatus();
}

io.on("connection", (socket) => {
  socket.onAny(() => {
    updateStatus();
  });

  socket.on("reconnect", () => {
    updateStatus();
  });

  socket.on("disconnect", () => {
    const { role } = socket;
    if (!["players", "consola", "TV"].includes(role)) return;
    game.online[role] = false;
    if (role === "players") {
      game.playersReady = false;
      game.video.progress = 0;
      game.status = "waiting";
    }
    socket.leave(role);
    updateStatus();
  });

  socket.on("joinAs", (role) => {
    joinAs(role, socket);
    updateStatus();
    console.log("joined as", role);
  });

  socket.on("game:fakeHeartRate", () => {
    game.heartRate.fake = !game.heartRate.fake;
    updateStatus();
  });
  socket.on("game:debug", () => {
    game.debug = !game.debug;
    updateStatus();
  });

  socket.on("game:restart", () => {
    game.video.sections.forEach((section) => {
      section.expressions = { player1: {}, player2: {} };
    });
    //clean player data
    game.players = {
      player1: {
        ...game.players.player1,
        nombre: undefined,
        email: undefined,
        celular: undefined,
        genero: undefined,
        expression: undefined,
      },
      player2: {
        ...game.players.player2,
        nombre: undefined,
        email: undefined,
        celular: undefined,
        genero: undefined,
        expression: undefined,
      },
    };
    game.status = "waiting";
    game.video.progress = 0;
    game.id = generateId();
    updateStatus();
  });
  socket.on("game:start", startGame);
  socket.on("game:stop", () => {
    game.status = "ready";
    game.video.paused = true;
    updateStatus();
  });
  socket.on("game:end", () => {
    //save a json file  with the game object on the partidas folder

    const path = require("path");
    const dir = path.resolve(__dirname, "partidas");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    fs.writeFileSync(
      path.resolve(dir, `${game.id}.json`),
      JSON.stringify(game, null, 2)
    );

    game.status = "waiting";
    //reset the game object in partidas folder with the whole game object

    game.players = {
      player1: {
        nombre: "",
        email: "",
        celular: "",
        genero: "",
        expression: "",
        bpm: 0,
        bateria: null,
      },
      player2: {
        nombre: "",
        email: "",
        celular: "",
        genero: "",
        expression: "",
        bpm: 0,
        bateria: null,
      },
    };
    game.video.progress = 0;
    game.video.paused = true;

    game.video.sections.forEach((section) => {
      section.expressions = { player1: {}, player2: {} };
    });

    updateStatus();
  });
  socket.on("video:progress", onProgress);
  socket.on("video:duration", (duration) => {
    game.video.duration = duration;
  });
  socket.on("players:ready", (isReady) => {
    game.playersReady = isReady;
    updateStatus();
  });
  socket.on("player:details", ({ player, details }) => {
    game.players[player] = details;
    updateStatus();
  });
  socket.on("player:expression", ({ player, expression }) => {
    onExpression({ player, expression });
    updateStatus();
  });
  socket.on("player:batteryLevel", ({ player, level }) => {
    game.players[player].bateria = level;
  });
  socket.on("player:bpm", ({ player, bpm }) => {
    onBPM({ player, bpm });
    updateStatus();
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});

// Route
app.get("/game/start", (req, res) => {
  try {
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message, game });
  }
});
