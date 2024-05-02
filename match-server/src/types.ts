export type Jugador = {
  nombre: string;
  email: string;
  celular: string;
  genero: string;
  image?: string;
  bateria: number;
  bpm: number;
  expression: string;
};

export type Role = "players" | "consola" | "TV";

export interface Section {
  name: string;
  start: number;
  end: number;
  expressions?: {
    player1: Record<string, number>;
    player2: Record<string, number>;
  };
}

export interface Video {
  url: string;
  standbyURL: string;
  progress: number;
  duration: number;
  paused: boolean;
  sections: Section[];
}

export interface HeartRateDevice {
  model: number;
  authKey: string;
  MAC: string;
  name: string;
}

export interface Status {
  status: string;
  players: {
    player1: Jugador;
    player2: Jugador;
  };
  debug: boolean;
  video: Video;
  online: {
    players: boolean;
    consola: boolean;
    TV: boolean;
  };
  playersReady: boolean;
  id: string;
  heartRate: {
    fake: boolean;
    devices: HeartRateDevice[];
  };
}
