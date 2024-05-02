//@ts-nocheck
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ADVERTISEMENT_SERVICE,
  CHAR_UUIDS,
  UUIDS,
  UUID_BASE,
} from "../miband/constants";
import aesjs from "../miband/aes";

function buf2hex(buffer: Iterable<number>) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join("");
}

const concatBuffers = (buffer1, buffer2) => {
  const out = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  out.set(new Uint8Array(buffer1), 0);
  out.set(new Uint8Array(buffer2), buffer1.byteLength);
  return out.buffer;
};

export const useMiBand5 = (authKey: string, model: 4 | 5) => {
  const [device, setDevice] = useState();
  const [services, setServices] = useState({});
  const [chars, setChars] = useState({});
  const timeoutRef = useRef<any>();
  const [reading, setReading] = useState(false);
  const [hr, setHr] = useState();
  const [lastHRtime, setLastHRtime] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);

  // const [status, setStatus] = useState<
  //   "authentication failed" | "connecting" | "connected"
  // >();

  const interval = useRef<any>(null);

  const batteryInterval = useRef<any>(null);

  useEffect(() => {
    if (connected) {
      if (!batteryLevel) readBatteryLevel();

      batteryInterval.current = setInterval(
        async () => await readBatteryLevel(),
        1000 * 60
      );

      return () => {
        clearInterval(batteryInterval.current);
      };
    }
  }, [connected]);

  function handleHRChange(e) {
    const heartRate = e.target.value.getInt16();
    setHr(heartRate);
    setLastHRtime(Date.now());
  }
  useEffect(() => {
    console.log("Reading", reading);
    if (reading) {
      chars.hrControl.writeValue(Uint8Array.from([0x15, 0x01, 0x01]));
      // Start pinging HRM
      interval.current = setInterval(async () => await pingHR(), 12000);

      return () => {
        clearInterval(interval.current);
      };
    } else {
      clearInterval(interval.current);
    }
  }, [reading]);
  function cleanAll() {
    reading ? stopMeasureHr() : null;
    setAuthenticated(false);
    setConnecting(false);
    setConnected(false);
    setReading(false);
    setHr(null);
    setLastHRtime(0);
    setDevice(null);
    setServices({});
    setChars({});
    device ? device.gatt.disconnect() : null;
  }

  useMemo(() => {
    if (device) {
      device.addEventListener("gattserverdisconnected", () => {
        console.warn("Device disconnected");
        cleanAll();
      });
    }

    return () => {
      if (device) {
        device.removeEventListener("gattserverdisconnected", () => {});
      }
    };
  }, [device]);

  //when authentification fails clean all
  useEffect(() => {
    if (!authenticated) {
      cleanAll();
    }
  }, [authenticated]);

  async function disconnect() {
    await device.gatt.disconnect();
    cleanAll();
  }

  async function init() {
    console.log("Initializing", authKey);
    setConnecting(true);
    console.log("Requesting device");
    await navigator.bluetooth
      .requestDevice({
        filters: [
          {
            services: [ADVERTISEMENT_SERVICE],
          },
        ],
        optionalServices: [
          UUIDS.miband2,
          UUIDS.heartrate,
          UUIDS.miband1,
          model === 5 ? 0x180f : null,
        ].filter((x) => x),
      })
      .then((device) => {
        setDevice(device);
        console.log("Name", device.name);
        device.gatt.disconnect();
        return device.gatt.connect().then(async (server) => {
          console.log("Connected through gatt", server);

          const services = {
            miband1: await server.getPrimaryService(UUIDS.miband1),
            miband2: await server.getPrimaryService(UUIDS.miband2),
            heartrate: await server.getPrimaryService(UUIDS.heartrate),
            // battery:
            //   model === 5 ? await server.getPrimaryService(0x180f) : null,
            battery:
              model === 5
                ? await server.getPrimaryService(0x180f)
                : await server.getPrimaryService(UUIDS.miband1),
          };
          const chars = {
            auth: await services.miband2.getCharacteristic(CHAR_UUIDS.auth),
            hrControl: await services.heartrate.getCharacteristic(
              CHAR_UUIDS.heartrate_control
            ),
            hrMeasure: await services.heartrate.getCharacteristic(
              CHAR_UUIDS.heartrate_measure
            ),
            sensor: await services.miband1.getCharacteristic(CHAR_UUIDS.sensor),
            battery: await services.miband1.getCharacteristic(
              UUID_BASE("0006")
            ),
            // battery: await services.miband1.getCharacteristic(
            //   UUID_BASE("0006") // mi band 4
            // ),
          };
          await authenticate(chars)
            .then(() => {
              setAuthenticated(true);
              setServices(server);
              setChars(chars);
              setConnecting(false);
              setConnected(true);
            })
            .catch((e) => {
              console.log("Error authenticating ooo", e);
              cleanAll();
            });
          return { services, chars };
        });
      })
      .catch((e) => {
        console.log("Error connecting Jean1", e);
        cleanAll();
      });
  }

  async function authenticate(chars) {
    console.log("Authenticating", chars);

    function startNotifications(characteristic, callback) {
      return characteristic.startNotifications().then(() => {
        characteristic.addEventListener("characteristicvaluechanged", callback);
      });
    }

    await startNotifications(chars.auth, async (e) => {
      const value = e.target.value.buffer;
      const cmd = buf2hex(value.slice(0, 3));
      if (cmd === "100101") {
        console.log("Set new key OK");
      } else if (cmd === "100201") {
        const number = value.slice(3);
        console.log(
          "Received authentication challenge: ",
          buf2hex(value.slice(3))
        );
        const key = aesjs.utils.hex.toBytes(authKey);
        const aesCbc = new aesjs.ModeOfOperation.cbc(key);
        const out = aesCbc.encrypt(new Uint8Array(number));
        const cmd = concatBuffers(new Uint8Array([3, 0]), out);
        console.log("Sending authentication response");
        await chars.auth.writeValue(cmd);
      } else if (cmd === "100301") {
        console.log("Authenticated OK");
        setAuthenticated(true);
        return true;
      } else if (cmd === "100308") {
        setAuthenticated(false);
        throw new Error("Authenticated Failed");
      } else {
        setAuthenticated(false);
        throw new Error(`Unknown callback, cmd='${cmd}'`);
      }
    });
    await chars.auth.writeValue(Uint8Array.from([2, 0]));
  }

  async function readBatteryLevel() {
    //read battery for mi band 4  using miband1 service
    const batteryLevel = await chars.battery.readValue().then((value) => {
      const batteryLevel = value.getUint8(1);
      console.log(`Battery percentage is ${batteryLevel}`);
      setBatteryLevel(batteryLevel);
      return batteryLevel;
    });
  }

  async function startMeasureHr() {
    console.log("❇️ Starting heart rate measurement", chars);
    await chars.hrControl.writeValue(Uint8Array.from([0x15, 0x02, 0x00]));
    await chars.hrControl.writeValue(Uint8Array.from([0x15, 0x01, 0x00]));

    setReading(true);

    await chars.hrControl.writeValue(Uint8Array.from([0x15, 0x01, 0x01]));

    await startNotifications(chars.hrMeasure, handleHRChange);
  }

  async function pingHR() {
    console.log("🛎️ Pinging heart rate monitor", Date.now());
    await chars.hrControl.writeValue(Uint8Array.from([0x16]));
  }

  async function stopMeasureHr() {
    console.log("🛑 Stopping heart rate measurement");
    setReading(false);
    switch (model) {
      case 4:
        await chars.hrControl.writeValue(Uint8Array.from([0x15, 0x01, 0x00]));
        break;
      case 5:
        //stop heart rate on mi band 5
        await chars.hrControl.writeValue(Uint8Array.from([0x15, 0x02, 0x00]));
        break;
    }

    await stopNotifications(chars.hrMeasure, handleHRChange);
  }

  async function stopNotifications(char, cb) {
    console.log("🔔 Stopping notifications");
    await char.stopNotifications();
    await char.removeEventListener("characteristicvaluechanged", cb);
  }

  async function startNotifications(char, cb) {
    await char.startNotifications().then(() => {
      char.addEventListener("characteristicvaluechanged", cb);
    });
  }

  return {
    init,
    disconnect,
    device,
    services,
    chars,
    pingHR,
    hr,
    lastHRtime,
    reading,
    authenticate,
    authenticated,
    startMeasureHr,
    stopMeasureHr,
    connecting,
    connected,
    batteryLevel,
    startNotifications,
  };
};
