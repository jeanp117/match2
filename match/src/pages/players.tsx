import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Select, SelectItem } from "@nextui-org/react";
import { useMiBand5 } from "./useMiBand5";
import { Status } from "../types";
import { device, game, player, socket, video } from "../io";
const FaceRecognition: React.FC<{
  player: any;
  onExpressionChange: (expression: string) => void;
  onReady: (isReady: boolean) => void;
  index: any;
}> = ({ player, onExpressionChange, onReady, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camerasAvailable, setCamerasAvailable] = useState<any[]>([]);
  const [camera, setCamera] = useState<any>(null);
  const [expression, setExpression] = useState("");
  const [readyness, setReadyness] = useState({
    modelsLoaded: false,
    cameraReady: false,
  });
  //list all cameras and be aware of new cameras being connected
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const cameras = devices.filter((device) => device.kind === "videoinput");
      setCamerasAvailable(cameras);
    });
    navigator.mediaDevices.addEventListener("devicechange", () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const cameras = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCamerasAvailable(cameras);
      });
    });
  }, []);

  useEffect(() => {
    if (camerasAvailable.length > 0 && !camera)
      setCamera(camerasAvailable[index]);
  }, [camerasAvailable]);
  //faceapi setup to detect facial expressions
  useEffect(() => {
    const loadModels = async () => {
      //check if models are loaded before using them

      if (!faceapi.nets.tinyFaceDetector.params) {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      }
      if (!faceapi.nets.faceExpressionNet.params) {
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      }
      setReadyness({ ...readyness, modelsLoaded: true });
    };

    loadModels();
  }, []);

  useEffect(() => {
    let interval: any;
    if (camera) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: camera.deviceId,
            advanced: [{ width: 1280, height: 720 }],
          },
        })
        .then((stream) => {
          if (videoRef.current) {
            (videoRef.current as any).srcObject = stream;
            videoRef.current.addEventListener("play", function () {
              const canvas = faceapi.createCanvasFromMedia(
                videoRef.current as any
              );
              document.body.append(canvas);

              //apply filter to canvas
              // canvas.style.filter = "brightness(2.2) contrast(1.4) saturate(0) ";
              // this.style.filter = "brightness(2.2) contrast(1.4) saturate(0)";
              const displaySize = {
                width: this.width,
                height: this.height,
              };
              faceapi.matchDimensions(canvas, displaySize);
              interval = setInterval(async () => {
                const detection = await faceapi
                  .detectSingleFace(
                    videoRef.current as any,
                    new faceapi.TinyFaceDetectorOptions({
                      inputSize: 128,
                      scoreThreshold: 0.5,
                    })
                  )
                  .withFaceExpressions();
                if (detection) {
                  const expressions = detection.expressions as any;
                  const expression = Object.keys(expressions).reduce((a, b) =>
                    expressions[a] > expressions[b] ? a : b
                  );

                  //get image from canvas in base64 format

                  setExpression(expression);
                  onExpressionChange(expression);
                }
              }, 100);

              // const intervalFoto = setInterval(() => {
              //   if (videoRef.current) {
              //     // use video to get a image
              //     const canvas = document.createElement("canvas");
              //     canvas.width = 320;
              //     canvas.height = 240;
              //     const ctx = canvas.getContext("2d");
              //     ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              //     const data = canvas.toDataURL("image/png");
              //     socket.emit("player:camera", { player, image: data });
              //   }
              // }, 128);
              //return graceful cleanup
            });
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    return () => {
      clearInterval(interval);
      // clearInterval(intervalFoto);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [camera]);

  useEffect(() => {
    console.log("readyness", readyness);
    onReady(readyness.modelsLoaded && readyness.cameraReady);
  }, [readyness]);

  if (!readyness.modelsLoaded) {
    return <div>Loading models</div>;
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-xl flex flex-col w-full justify-between">
      <div className=" bg-slate-400 aspect-video relative">
        <div
          className=" aspect-square rounded-full bg-white absolute left-2 top-2 z-20 
        text-3xl
        "
        >
          {(() => {
            switch (expression) {
              case "neutral":
                return "😐";
              case "happy":
                return "😀";
              case "sad":
                return "😢";
              case "angry":
                return "😠";
              case "fearful":
                return "😨";
              case "disgusted":
                return "🤢";
              case "surprised":
                return "😲";
              default:
                return "😐";
            }
          })()}
        </div>
        {camera ? (
          <video
            src=""
            ref={videoRef}
            autoPlay
            muted
            onCanPlay={() => {
              setReadyness({ ...readyness, cameraReady: true });
            }}
            className="w-full h-auto  object-cover  "
          ></video>
        ) : (
          <div className="w-full h-full flex flex-col justify-center  items-center  object-cover bg-zinc-600">
            <svg
              className="w-24 h-24 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M14 7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7Zm2 9.387 4.684 1.562A1 1 0 0 0 22 17V7a1 1 0 0 0-1.316-.949L16 7.613v8.774Z"
                clipRule="evenodd"
              />
            </svg>
            <h1 className="text-white">
              Conecte una cámara para poder ver la expresión facial
            </h1>
          </div>
        )}
      </div>
      <div className="p-4 ">
        {expression}

        {camerasAvailable.length > 0 && (
          <Select
            label="Seleccionar cámara"
            onChange={(e) => {
              const camera = camerasAvailable.find(
                (camera) => camera.deviceId === e.target.value
              );
              console.log("camera", camera);
              setCamera(camera);
            }}
            selectionMode="single"
            defaultSelectedKeys={[camerasAvailable[0].deviceId]}
          >
            {camerasAvailable.map((cameraAvailable) => (
              <SelectItem
                key={cameraAvailable.deviceId}
                value={cameraAvailable.deviceId}
              >
                {cameraAvailable.label}
              </SelectItem>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
};

export const Players = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [videoURL, setVideoURL] = useState<string>();
  const [playersReady, setPlayersReady] = useState({
    player1: false,
    player2: false,
  });
  const [status, setStatus] = useState<any>();

  useEffect(() => {
    device.onConnect("players", setIsConnected);

    game.onStatus((status: Status) => {
      setVideoURL(status.video.url);
      setStatus(status);

      if (status.status !== "playing" && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current?.pause();
      } else {
        videoRef.current?.play();
      }
    });

    return () => {
      // Clean up event listeners on unmount
      device.offConnect();
      game.offStatus();
    };
  }, []);

  const [isPristine, setIsPristine] = useState(true);

  useEffect(() => {
    player.ready(playersReady.player1 && playersReady.player2 && !isPristine);
  }, [socket.connected, playersReady, isPristine]);

  return (
    <div className="relative  bg-zinc-200 h-screen overflow-hidden flex flex-col justify-center items-center">
      {!status?.debug && (
        <div
          className="flex flex-col items-center justify-center bg-green-300 rounded-lg  shadow-lg h-screen w-full absolute z-50"
          style={{
            visibility: status?.status == "playing" ? "hidden" : "visible",
          }}
        >
          <img
            src={status?.video?.standbyURL}
            alt=""
            className="object-fill w-full"
          />
        </div>
      )}
      {isPristine && (
        <div className="flex flex-col items-center justify-center bg-red-400 rounded-lg p-4 shadow-lg h-screen w-full absolute z-50">
          <button
            className="bg-primary-500 text-white p-2 rounded-lg"
            onClick={() => {
              setIsPristine(false);
              document.documentElement.requestFullscreen();
            }}
          >
            EMPEZAR
          </button>
        </div>
      )}
      <div className="  max-h-screen   ">
        <div className="absolute left-1 top-1 z-50 text-xs">
          {isConnected ? "🟢" : "🔴"}
        </div>
        {isConnected && (
          <video
            src={videoURL}
            className="w-full h-auto object-cover  absolute top-0 left-0  "
            ref={videoRef}
            onDurationChange={(e) => {
              video.duration(e.currentTarget.duration);
            }}
            onTimeUpdate={(e) => {
              if (videoRef.current && status?.status == "playing") {
                video.progress(e.currentTarget.currentTime);
              }
            }}
          ></video>
        )}
        <div
          className="flex flex-row gap-4  justify-center absolute top-4 right-5    z-40 "
          style={{
            visibility: status?.status == "playing" ? "hidden" : "visible",
          }}
        >
          {status &&
            status?.status &&
            ["player1", "player2"].map((jugador, index) => (
              <div className="flex flex-col gap-4" key={index}>
                <FaceRecognition
                  key={index}
                  index={index}
                  player={jugador}
                  onReady={(isReady) => {
                    setPlayersReady((prev) => ({
                      ...prev,
                      [jugador]: isReady,
                    }));
                  }}
                  onExpressionChange={(expression) => {
                    if (!expression) return;
                    player.expression(expression, jugador);
                    console.log("expression", expression);
                  }}
                />
                <h1>{status?.status}</h1>
                <SensorCardiaco
                  authKey={status?.heartRate?.devices[index].authKey}
                  MAC={status?.heartRate?.devices[index].MAC}
                  model={status?.heartRate?.devices[index].model as 4 | 5}
                  enabled={status?.status == "playing"}
                  fake={status?.heartRate?.fake}
                  onBPM={(bpm) => {
                    player.bpm(bpm, jugador);
                  }}
                  onBatteryLevel={(batteryLevel) => {
                    player.batteryLevel(batteryLevel, jugador);
                  }}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const SensorCardiaco: React.FC<{
  authKey: string;
  MAC: string;
  model: 4 | 5;
  onBPM: (bpm: number) => void;
  onBatteryLevel?: (batteryLevel: number) => void;
  onAuthenticated?: (authenticated: boolean) => void;
  enabled: boolean;
  fake?: boolean;
}> = ({
  authKey,
  MAC,
  model,
  onBPM,
  enabled,
  onAuthenticated,
  onBatteryLevel,
  fake,
}) => {
  const {
    hr,
    init,
    batteryLevel,
    startMeasureHr,
    stopMeasureHr,
    authenticated,
    connecting,
    reading,
  } = useMiBand5(authKey, model);

  const [lastBPM, setLastBPM] = useState<number>();
  useEffect(() => {
    if (!fake) return;

    const interval = setInterval(() => {
      // Generar un valor aleatorio dentro del rango de BPM normal para un adulto en reposo (60-100 BPM)
      let current = lastBPM || Math.floor(Math.random() * 41) + 60;

      // Añadir variabilidad dentro del rango de +/- 5 BPM
      let increment = Math.floor(Math.random() * 11) - 5;
      current += increment;

      // Asegurarse de que el valor esté dentro del rango válido
      current = Math.max(60, Math.min(current, 100));

      // Establecer el nuevo valor de BPM
      setLastBPM(current);
    }, 2000); // Agregar un retraso aleatorio entre 1 y 2 segundos

    return () => {
      clearInterval(interval);
    };
  }, [fake, lastBPM]);

  useEffect(() => {
    if (fake && lastBPM) {
      onBPM(lastBPM);
    }
  }, [lastBPM]);

  useEffect(() => {
    if (onAuthenticated) onAuthenticated(authenticated);
  }, [authenticated]);

  useEffect(() => {
    if (onBatteryLevel) {
      onBatteryLevel(batteryLevel);
    }
  }, [batteryLevel]);

  useEffect(() => {
    if (enabled) {
      startMeasureHr();
    } else {
      stopMeasureHr().then(() => {
        console.log("stopMeasureHr");
        onBPM(0);
      });
    }
  }, [enabled, reading]);

  useEffect(() => {
    if (!hr) return;
    onBPM(hr);
    console.log("hr 💓", hr);
  }, [hr]);
  return (
    <div className="bg-white rounded-lg p-4  shadow-lg">
      <p className="bg-warning-100 p-2">
        Da click en <b>Emparejar</b> y busca un dispositivo llamado Mi Band 4
        con mac <b>({MAC})</b>
      </p>
      <h2>Estado: {authenticated ? "Autenticado" : "No autenticado"}</h2>
      {fake ? (
        <h2>
          🤡{lastBPM}
          <b>BPM</b>
        </h2>
      ) : (
        <h2>BPM: {hr}</h2>
      )}
      <div className="flex flex-row gap-4">
        <button
          className="bg-primary-500 text-white p-2 rounded-lg"
          onClick={() => {
            init();
          }}
        >
          {connecting
            ? "Conectando..."
            : authenticated
            ? "Conectado"
            : "Emparejar"}
        </button>
        <button
          className="bg-primary-500 text-white p-2 rounded-lg"
          onClick={() => {
            stopMeasureHr();
          }}
        >
          stop
        </button>
      </div>
    </div>
  );
};
