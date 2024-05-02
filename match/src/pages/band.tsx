//@ts-nocheck
import { useEffect, useState } from "react";
// import { useMiBand5 } from "./useMiBand5";
import MiBand5 from "../miband/miband";
import { useMiBand5 } from "./useMiBand5";
export const MiBandTest: React.FC<{}> = () => {
  // const {
  //   init,
  //   ready,
  //   reading,
  //   startMeasureHr,
  //   pingHR,
  //   setContador,
  //   stopMeasureHr,
  //   contador,
  //   authenticated,
  //   connecting,
  //   hr,
  //   lastHRtime,
  // } = useMiBand5("dfbc921f057ab58d1664bc1f89145db0");

  // useEffect(() => {
  //   if (ready && reading) {
  //     const interval = setInterval(() => {
  //       console.log("Reading " + contador, Date.now());
  //       setContador((prev) => prev + 1);
  //       pingHR();
  //     }, 12000);

  //     return () => clearInterval(interval);
  //   }
  // }, [ready, pingHR]);

  const {
    init,
    device,
    reading,
    startMeasureHr,
    stopMeasureHr,
    authenticated,
    connecting,
    hr,
    lastHRtime,
    disconnect,
    connected,
    batteryLevel: bandBatteryLevel,
  } = useMiBand5("12efa6f67fd328d6c08d90e95534dbf3", 4);

  return (
    <>
      <h1>{hr} bpm</h1>
      <h1>{connected ? "conectado" : "NOPE"} connected</h1>
      <pre>{JSON.stringify(device)}</pre>
      <button
        onClick={() => {
          init();
        }}
      >
        init
      </button>
      <button onClick={() => startMeasureHr()}>startMeasureHr</button>
      <button onClick={() => stopMeasureHr()}>stopMeasureHr</button>
      {/* {!ready && <p>Conectar sensor</p>}
      {connecting && <p>Conectando...</p>}
      {hr ? (
        <h1>
          {hr} bpm <small>{lastHRtime}</small>
        </h1>
      ) : (
        reading && <p>Esperando lectura...</p>
      )}
      {reading && !hr && (
        <div>
          <p>Leyendo, espere...</p>
        </div>
      )}
      {!authenticated && !connecting && (
        <button onClick={init}>Conectar</button>
      )}

      <button
        disabled={!ready || !authenticated || reading}
        onClick={startMeasureHr}
      >
        Start
      </button>
      <button
        disabled={!ready || !authenticated || !reading}
        onClick={stopMeasureHr}
      >
        stop
      </button> */}
    </>
  );
};
