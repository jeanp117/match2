import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Slider,
  Switch,
  useDisclosure,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { device, game, player, socket } from "../io";
import { Jugador, Status } from "../types";

export const ConsolaPage = () => {
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<Status>();

  const [sections, setSections] = useState<
    [
      {
        name: string;
        start: number;
        end: number;
      }
    ]
  >();

  useEffect(() => {
    device.onConnect("consola", setIsConnected);
    game.onStatus((statusData) => {
      setStatus(statusData.status);
      setStatus(statusData);
      setVideoDuration(statusData.video.duration);
      setVideoProgress(statusData.video.progress);
      if (!sections) {
        setSections(
          statusData.video.sections.map((section: any) => ({
            label: section.name,
            value: section.start / statusData.video.duration,
          }))
        );
      }
      setVideoDuration(statusData.video.duration);
    });

    return () => {
      device.offConnect();
      game.offStatus();
    };
  }, [socket.connected]);

  return (
    <div className="flex flex-row justify-center ">
      <div className="container flex flex-col w-full">
        <h1>{status?.id}</h1>
        <div className="flex  flex-row gap-4 justify-center p-2">
          <StatusJugador
            jugador={status?.players?.player1}
            onEdit={(jugador) => player.details("player1", jugador)}
          />
          <StatusJugador
            jugador={status?.players?.player2}
            onEdit={(jugador) => player.details("player2", jugador)}
          />
        </div>
        {status && <StatusGame status={status} />}
        <div className="flex  flex-row  p-4 bg-white shadow-lg rounded-lg">
          {status?.status && (
            <Slider
              label={
                <b>
                  Avance del video{" "}
                  {((seconds) => {
                    var minutos = Math.floor(seconds / 60);
                    var segundosRestantes = Math.floor(seconds % 60);
                    return minutos + ":" + segundosRestantes;
                  })(videoProgress)}{" "}
                  /{" "}
                  {((seconds) => {
                    var minutos = Math.floor(seconds / 60);
                    var segundosRestantes = Math.floor(seconds % 60);
                    return minutos + ":" + segundosRestantes;
                  })(videoDuration)}
                </b>
              }
              step={0.01}
              formatOptions={{ style: "percent" }}
              maxValue={1}
              minValue={0}
              marks={sections as any}
              classNames={{
                mark: "scale-120",
              }}
              value={status?.video?.progress / status?.video?.duration || 0}
            />
          )}
        </div>
        <div className="flex flex-col p-4 gap-4 bg-white shadow-lg rounded-lg">
          <Switch
            isSelected={status?.debug}
            onValueChange={() => {
              game.debug();
            }}
          >
            Modo configuración de cámaras
          </Switch>
          <Switch
            isSelected={status?.heartRate?.fake}
            onValueChange={() => {
              game.fakeHeartRate();
            }}
          >
            Modo 5
          </Switch>
        </div>
        <div className=" w-full h-1/2 flex flex-col items-center justify-center relative p-4">
          {status?.status === "playing" && (
            <div
              className="absolute w-12 flex flex-col justify-center items-center bg-red-700 aspect-square rounded-full left-4 bottom-4 text-white hover:scale-125"
              onClick={() => {
                game.stop(); // Send emergency stop signal
              }}
            >
              Parar
            </div>
          )}
          <div
            className=" w-52 aspect-square   shadow-md hover:scale-105 hover:shadow-lg bg bg-green-500 flex flex-col justify-center items-center text-white font-bold text-4xl text-center rounded-full select-none p-6"
            onClick={() => {
              if (status?.status === "ready") {
                console.log("start");
                socket.emit("game:start");
              } else if (status?.status === "playing") {
                game.stop(); // Pause the video on click
              } else if (status?.status === "ended") {
                game.restart(); // Restart the game
              }
            }}
          >
            {status?.status === "waiting"
              ? "Esperando jugadores"
              : status?.status === "ready"
              ? "Iniciar"
              : status?.status === "playing"
              ? "Pausar"
              : status?.status === "ended"
              ? "Reiniciar"
              : "Iniciar juego"}
          </div>

          {status?.status === "playing" && (
            <div
              className=" w-32 aspect-square   shadow-md hover:scale-105 hover:shadow-lg bg bg-red-300 flex flex-col justify-center items-center text-white font-bold text-2xl text-center rounded-full select-none p-6"
              onClick={() => {
                if (
                  confirm("¿Estás seguro de que deseas reiniciar el juego?")
                ) {
                  game.restart(); // Restart the game
                }
              }}
            >
              Reiniciar
            </div>
          )}

          {status?.status === "ended" && (
            <div
              className=" w-40 aspect-square   shadow-md hover:scale-105 hover:shadow-lg bg bg-green-500 flex flex-col justify-center items-center text-white font-bold text-2xl text-center rounded-full select-none"
              onClick={() => {
                game.end(); // Send the data and end the game
              }}
            >
              Enviar y terminar
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const checkDatosParticipantes = (jugador: Jugador) => {
  return (
    jugador?.celular && jugador?.email && jugador?.nombre && jugador?.genero
  );
};

const StatusGame: React.FC<{
  status: Status;
}> = ({ status }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col md:flex-row gap-4">
      <div className="shadow-md rounded p-4">
        <h1 className="font-bold">Dispositivos conectados</h1>
        <h1>Video {status?.online?.players ? "🟢" : "🔴"}</h1>
        <h1>Consola {status?.online?.consola ? "🟢" : "🔴"}</h1>
        <h1>TV público {status?.online?.TV ? "🟢" : "🔴"}</h1>
        <h1>Cámaras y sensor cardiaco {status?.playersReady ? "🟢" : "🔴"}</h1>
      </div>
      <div className="shadow-md rounded p-4">
        <h1 className="font-bold">Datos de los participantes</h1>
        <h1>
          Jugador 1:
          {checkDatosParticipantes(status?.players?.player1) ? "🟢" : "🔴"}
        </h1>
        <h1>
          Jugador 2:
          {checkDatosParticipantes(status?.players?.player2) ? "🟢" : "🔴"}
        </h1>
      </div>
      <div className="shadow-md rounded p-4">
        <h1 className="font-bold">Estado de los equipos</h1>
        <h1>
          Sensor cardiaco 1:{" "}
          {status.players?.player1?.bateria > 60 ? "🔋" : "🪫"}
          {status.players?.player1?.bateria}%
        </h1>
        <h1>
          Sensor cardiaco 2:{" "}
          {status.players?.player2?.bateria > 60 ? "🔋" : "🪫"}{" "}
          {status.players?.player2?.bateria}%
        </h1>
      </div>
    </div>
  );
};

const StatusJugador: React.FC<{
  jugador: Jugador | undefined;
  onEdit: (jugador: Jugador) => void;
}> = ({ jugador, onEdit }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [jugadorLocal, setJugadorLocal] = useState<
    Partial<Jugador> | undefined
  >();

  useEffect(() => {
    setJugadorLocal(jugador);
  }, [jugador]);

  return (
    <>
      <div
        className="flex   w-full  flex-col md:flex-row  bg-white shadow-lg rounded-lg overflow-hidden  gap-4 "
        onClick={onOpen}
      >
        {jugador?.nombre ? (
          <>
            <div className="w-full md:w-fit md:h-64 bg-red-400 aspect-square  ">
              <img src={jugador.image} className="object-cover  rounded-lg" />
            </div>
            <div className="flex flex-col gap-2 p-4">
              <h2 className="font-bold text-xl line-clamp-1">
                {jugador.nombre}
              </h2>
              <div className="flex flex-row gap-2">
                <h2>🔋 {jugador.bateria}%</h2>
                <h2>💓 {jugador.bpm}bpm</h2>
                <h2>😃 {jugador.expression}</h2>
              </div>
            </div>
          </>
        ) : (
          <>
            <Button className="pointer-events-none" fullWidth>
              Seleccionar jugador
            </Button>
          </>
        )}
      </div>
      <Modal
        placement="bottom"
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={() => {
          onOpenChange();

          if (!isOpen) {
            setJugadorLocal(undefined);
          }
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Editar jugador
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full flex-wrap md:flex-nowrap gap-4">
              {" "}
              <pre>{JSON.stringify(jugadorLocal)}</pre>
              <Input
                type="text"
                label="Nombre"
                placeholder="Nombre completo"
                defaultValue={jugador?.nombre}
                onValueChange={(value) => {
                  setJugadorLocal({ ...jugadorLocal, nombre: value });
                }}
              />
              <Input
                type="email"
                label="Email"
                defaultValue={jugador?.email}
                placeholder="Correo electrónico"
                onValueChange={(value) => {
                  setJugadorLocal({ ...jugadorLocal, email: value });
                }}
              />
              <Input
                type="tel"
                label="Celular"
                placeholder="Número de celular"
                defaultValue={jugador?.celular}
                onValueChange={(value) => {
                  setJugadorLocal({
                    ...jugadorLocal,
                    celular: value,
                  });
                }}
              />
              <Select
                label="Género"
                placeholder="Seleccionar"
                selectedKeys={
                  jugadorLocal?.genero ? [jugadorLocal?.genero] : undefined
                }
                selectionMode="single"
                defaultSelectedKeys={
                  jugador?.genero ? [jugador?.genero] : undefined
                }
                onChange={(e) => {
                  setJugadorLocal({
                    ...jugadorLocal,
                    genero: e.target.value,
                  });
                }}
              >
                <SelectItem value="M" key={"M"}>
                  Masculino
                </SelectItem>
                <SelectItem value="F" key={"F"}>
                  Femenino
                </SelectItem>
                <SelectItem value="O" key={"O"}>
                  Otro
                </SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              size="lg"
              fullWidth
              color="primary"
              onPress={() => {
                onEdit(jugadorLocal as Jugador);
                onOpenChange();
              }}
              isDisabled={
                !(
                  jugadorLocal?.celular &&
                  jugadorLocal?.nombre &&
                  jugadorLocal?.email &&
                  jugadorLocal?.genero
                )
              }
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
