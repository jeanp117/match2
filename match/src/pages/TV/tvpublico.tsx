import Lottie from "lottie-react";
import { getAnimation } from "./utils";
import { GraficaBPM, updateChart } from "./grafica";
import { useEffect, useState } from "react";
import { socket } from "../../io";
import { Jugador, Status } from "../../types";

export const TvPublicoPage = () => {
  const [isConnected, setIsConnected] = useState(false);

  const [status, setStatus] = useState<Status>();
  const [currentSection, setCurrentSection] = useState<any>();
  useEffect(() => {
    if (status?.video.sections) {
      const current = status?.video.sections.find(
        (section: any) =>
          section.start <= status?.video.progress &&
          section.end >= status?.video.progress
      );
      setCurrentSection(current);
    }
  }, [status?.video.progress, status?.video.sections]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("joinAs", "TV");
    });

    socket.on("reconnect", () => {
      setIsConnected(true);
      socket.emit("joinAs", "TV");
    });

    socket.on("game:status", (status: Status) => {
      setStatus(status);
    });

    return () => {
      socket.off("connect");
      socket.off("game:status");
    };
  }, []);
  let videos = ["1714682094222", "1714682152812"];
  const [videoPublicitario, setVideoPublicitario] = useState<number>(0);
  useEffect(() => {
    if (status?.status === "waiting" || status?.status === "ready") {
      //pick a random video
      setVideoPublicitario(Math.floor(Math.random() * videos.length));
    }
  }, [status?.status]);

  function getStrongestEmotion(expressions: Record<string, number>) {
    return Object.entries(expressions).reduce(
      (acc, [emotion, value]) => {
        return value > acc[1] ? [emotion, value] : acc;
      },
      ["", 0]
    )[0];
  }

  function calcularPersonaje(emocion1: string, emocion2: string) {
    let diccionarioEmociones = {
      neutral: [
        "Mentor sabio",
        "El Soñador romántico",
        "El Cuidador compasivo",
        "El Guerrero valiente",
        "El Curioso investigador",
      ],
      happy: [
        "El Soñador romántico",
        "El Príncipe encantado",
        "El Viajero del tiempo",
        "El Maestro Zen",
        "El Constructor de sueños",
      ],
      sad: [
        "El Cuidador compasivo",
        "El Viajero del tiempo",
        "El Artista Inspirado",
        "El Visionario Inspirador",
        "El Filósofo contemplativo",
      ],
      angry: [
        "El guerrero Valiente",
        "El Maestro Zen",
        "El Visionario Inspirador",
        "El Protector Cariñoso",
        "El Mago Encantador",
      ],
      fearfull: [
        "El Curioso",
        "Investigador",
        "El Constructor de Sueños",
        "El Filoso contemplativo",
        "El Mago Encantador",
        "El Compañero de Aventuras",
      ],
    } as any;
    // Convertir las emociones a minúsculas
    emocion1 = emocion1.toLowerCase();
    emocion2 = emocion2.toLowerCase();

    // Validar si las emociones existen
    if (!diccionarioEmociones[emocion1] || !diccionarioEmociones[emocion2]) {
      console.error("Error: Las emociones ingresadas no son válidas.");
      return;
    }

    // Obtener las listas de personajes
    const personajesEmocion1 = diccionarioEmociones[emocion1];
    const personajesEmocion2 = diccionarioEmociones[emocion2];

    // Encontrar el índice del personaje común
    let indicePersonajeComun = -1;
    for (let i = 0; i < personajesEmocion1.length; i++) {
      if (personajesEmocion2.includes(personajesEmocion1[i])) {
        indicePersonajeComun = i;
        break;
      }
    }
    return personajesEmocion1[indicePersonajeComun];
  }

  function getStrongestEmotionAllSections(player: string) {
    let emotions = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
    };
    status?.video.sections.forEach((section: any) => {
      let playerEmotions = section?.expressions?.[player];
      if (playerEmotions) {
        Object.entries(playerEmotions).forEach(([emotion, value]) => {
          let key: "neutral" | "happy" | "sad" | "angry" | "surprised" =
            emotion as any;
          emotions[`${key}`] += value as number;
        });
      }
    });
    return Object.entries(emotions).reduce(
      (acc, [emotion, value]) => {
        return value > acc[1] ? [emotion, value] : acc;
      },
      ["", 0]
    )[0];
  }

  return (
    <div
      className="flex flex-col h-screen w-full 
        justify-between items-stretch bg-black
    "
    >
      <div className="h-fit text-white absolute left-2 top-2 z-50 ">
        {isConnected ? "🟢" : "🔴"}
      </div>
      {(status?.status === "ended" || status?.status === "ready") && (
        <div className="w-full h-screen  absolute z-40 text-white backdrop-blur-lg flex flex-col justify-center items-center gap-8   align-middle">
          <div>
            {status?.debug && (
              <div>
                {status.video.sections.map((section: any, index: number) => {
                  return (
                    <div key={index}>
                      <h1>
                        p1{" "}
                        {getStrongestEmotion(
                          section?.expressions?.player1 || {}
                        )}
                      </h1>
                      <h1>
                        p2{" "}
                        {getStrongestEmotion(
                          section?.expressions?.player2 || {}
                        )}
                      </h1>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="container">
              <div className="flex flex-row justify-between ">
                <h1 className="text-6xl text-center font-bold">
                  {status.players.player1.nombre.split(" ")[0]} {" y "}
                  {status.players.player2.nombre.split(" ")[0]},
                </h1>
              </div>
              <div>
                <h1 className="text-4xl">
                  mezclamos sus emociones en común y descubrimos que juntos son
                  como
                </h1>
              </div>
            </div>
          </div>

          <div
            className="w-fit h-100 relative bg-cyan-50/10 p-2 overflow-hidden  rounded-xl    "
            style={{
              backgroundImage: `url(https://i.pinimg.com/originals/22/86/5d/22865d4b8b7e517dce1b60a2988c8482.gif)`,

              backgroundSize: "cover",
            }}
          >
            <img
              src={`tv/Relaciones/${calcularPersonaje("sad", "angry")}.png`}
              className="h-64 object-scale-down aspect-auto z-10 
          "
            />
          </div>

          <h1 className="text-5xl font-bold">
            {calcularPersonaje("sad", "angry")}
          </h1>

          <h4 className="text-2xl">¡Muchas gracias por participar!</h4>
          <img src="xmslogo.svg" alt="" className="w-32" />
        </div>
      )}
      {(status?.status === "waiting" || status?.status === "ready") && (
        <div className="w-full h-screen *:absolute  z-40">
          <video
            autoPlay
            onEnded={() => {
              setVideoPublicitario((videoPublicitario + 1) % videos.length);
            }}
            src={`tv/videos/${videos[videoPublicitario]}.mp4`}
            className="object-cover h-full w-full"
          ></video>
        </div>
      )}

      {isConnected &&
      status?.players.player1 &&
      status.players.player2 &&
      status.status == "playing" ? (
        <div className="h-fit flex flex-col ">
          <div className="h-fit    p-12">
            <PlayerCard player={status.players.player1} />

            {currentSection?.expressions?.player1 && (
              <EmotionGraph
                expressions={currentSection?.expressions?.player1}
              />
            )}
          </div>
          <div className="h-fit   p-12">
            <PlayerCard player={status.players.player2} />{" "}
            {currentSection?.expressions?.player2 && (
              <EmotionGraph
                expressions={currentSection?.expressions?.player2}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="h-4/6 flex justify-center items-center text-white text-4xl">
          Esperando jugadores...
        </div>
      )}
      <div className="h-1/6   relative">
        <img
          src="grilla.jpg"
          alt="grilla"
          className="object-cover h-full w-full"
        />
        {/* floating in the middle of the div  */}
        <img
          src="xmslogo.svg"
          alt="logo"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            w-1/4 animate-pulse
          "
        />
      </div>
    </div>
  );
};

const DiccionarioEmociones: {
  [key: string]: {
    text: string;
    image: string;
  };
} = {
  neutral: { text: "El sabio", image: "Sabio" },
  happy: { text: "El animador", image: "Animador" },
  sad: { text: "El romántico", image: "Romantico" },
  angry: { text: "El protector", image: "Protector" },
  surprised: { text: "El explorador", image: "Explorador" },
};

const EmotionGraph = ({
  expressions,
}: {
  expressions: {
    [key: string]: number;
  };
}) => {
  const [total, setTotal] = useState<number>(0);
  const [strongest, setStronger] = useState<string>();
  useEffect(() => {
    let expresionesMejoradas = {
      ...expressions,
      neutral: expressions.neutral * 0.1,
    };
    if (expressions !== null) {
      setTotal(
        Object.entries(expressions).reduce((acc, [_emotion, value]) => {
          return acc + value;
        }, 0)
      );

      setStronger(
        Object.entries(expressions).reduce(
          (acc, [emotion, value]) => {
            return value > acc[1] ? [emotion, value] : acc;
          },
          ["", 0]
        )[0]
      );
    }
  }, [expressions]);

  return (
    <div className="flex flex-row gap-4 h-fit py-4  ">
      <div
        className="w-2/5 h-full relative bg-cyan-50/10 p-2 overflow-hidden  rounded-xl "
        style={{
          backgroundImage: `
          url(/tv/fondoPJ.webp)`,
          backgroundSize: "cover",
        }}
      >
        <img
          src={`tv/Emociones/${
            strongest
              ? DiccionarioEmociones[strongest as any]?.image
              : "ninguna"
          }.png`}
          className="h-64 object-scale-down aspect-auto z-10 
          "
        />

        {strongest && (
          <h1 className="text-white font-bold text-3xl text-center">
            {DiccionarioEmociones[strongest as any]?.text}
          </h1>
        )}
      </div>
      <div className=" text-white flex flex-col gap-2   w-full relative">
        <div className="flex flex-col gap-2">
          {expressions &&
            Object.entries(expressions)
              .map(([emotion, value], index) => {
                return (
                  <div
                    key={index}
                    className=" rounded-sm px-4 py-2 min-w-fit
            bg-gradient-to-r 
            from-green-400/10 to-cyan-200
            text-white line-clamp-1 text-2xl
            "
                    style={{
                      width: `${(value / total) * 100}%`,

                      backgroundImage:
                        emotion == strongest
                          ? `url(https://media.giphy.com/media/ZFFZP9n6TcFRFc0QE8/giphy-downsized-large.gif)`
                          : undefined,
                      backgroundSize:
                        emotion == strongest ? "cover" : undefined,
                      backgroundBlendMode:
                        emotion == strongest ? "overlay" : undefined,
                      backgroundColor:
                        emotion == strongest ? "#00ffff0f" : undefined,
                    }}
                  >
                    {DiccionarioEmociones[emotion as any]?.text}{" "}
                    {Math.round((value / total) * 100)}%
                  </div>
                );
              })
              .sort((a: any, b: any) => {
                return b[1]?.value - a[1]?.value;
              })
              .slice(-5)}
        </div>
      </div>
    </div>
  );
};

const PlayerCard = ({ player }: { player: Jugador }) => {
  const [chartData, setChartData] = useState<
    Array<{
      x: number;
      y: number;
    }>
  >([]);

  useEffect(() => {
    updateChart(player.bpm, setChartData);
  }, [player.bpm]);

  return (
    <div
      className="flex flex-row gap-4 bg-white/10 h-fit   rounded-3xl overflow-hidden 
      
      backdrop-blur-sm shadow-lg
      text-white
    "
    >
      <div
        className="w-8/12 text-3xl 
        flex flex-col justify-between
        "
        //add gradient inset to smooth the edges
      >
        <div className="px-8 pt-8">
          <h1 className="font-bold text-6xl">{player.nombre.split(" ")[0]}</h1>
        </div>
        <div
          className="rounded-lg relative
            
          "
        >
          <div
            className=" right-4 top-0 z-30
           p-2
           relative h-full
          "
          >
            <div
              className=" backdrop-blur-md
          bg-cyan-700/10 rounded-lg absolute p-4 right-2 top-0"
            >
              <h1 className="text-4xl font-bold">
                💓
                {player.bpm} bpm
              </h1>
            </div>
            <GraficaBPM
              top={
                //get the highest value from the chartData on Y

                Math.max(
                  ...chartData.map((d) => {
                    return d.y;
                  })
                ) + 20
              }
              bottom={
                //get the lowest value from the chartData on Y

                Math.min(
                  ...chartData.map((d) => {
                    return d.y;
                  })
                ) - 20
              }
              data={chartData || []}
            />
          </div>
        </div>
      </div>
      <div className="p-3">
        <Lottie
          style={{
            height: "15vmax",
          }}
          animationData={getAnimation(player.expression)}
          loop={true}
          autoplay={true}
        />
      </div>
    </div>
  );
};
