import { io } from "socket.io-client";
import { Role } from "./types";

// "undefined" means the URL will be computed from the `window.location` object
const URL = "http://192.168.1.2:3000";

export const socket = io(URL, {
  reconnectionDelay: 1000, // defaults to 1000
  reconnectionDelayMax: 5000, // defaults to 5000
});

const game = {
  start: () => {
    socket.emit("game:start");
  },
  restart: () => {
    socket.emit("game:restart");
  },
  stop: () => {
    socket.emit("game:stop");
  },
  end: () => {
    socket.emit("game:end");
  },
  debug: () => {
    socket.emit("game:debug");
  },
  fakeHeartRate: () => {
    socket.emit("game:fakeHeartRate");
  },
  status: () => {
    socket.emit("game:status");
  },
  onStatus: (callback: (status: any) => void) => {
    socket.on("game:status", callback);
  },
  offStatus: () => {
    socket.off("game:status");
  },
};

const device = {
  debug: (debug: boolean) => {
    socket.emit("debug", debug);
  },
  onConnect: (joinAs: Role, callback: (connected: boolean) => void) => {
    socket.on("connect", () => {
      socket.emit("joinAs", joinAs);
      callback(true);
    });
    socket.on("disconnect", () => {
      callback(false);
    });

    socket.on("reconnect", () => {
      socket.emit("joinAs", joinAs);
      callback(true);
    });
  },

  offConnect: () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("reconnect");
  },
};

const player = {
  ready: (isReady: boolean) => {
    socket.emit("players:ready", isReady);
  },
  expression: (expression: string, player: string) => {
    socket.emit("player:expression", { player, expression });
  },
  bpm: (bpm: number, player: string) => {
    socket.emit("player:bpm", { player, bpm });
  },
  batteryLevel: (level: number, player: string) => {
    socket.emit("player:batteryLevel", { player, level });
  },
  details: (player: string, details: any) => {
    socket.emit("player:details", { player, details });
  },
};

const video = {
  progress: (time: number) => {
    socket.emit("video:progress", time);
  },

  pause: (paused: boolean) => {
    socket.emit("video:pause", paused);
  },

  duration: (duration: number) => {
    socket.emit("video:duration", duration);
  },
};

export { game, device, player, video };
