import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Players } from "./pages/players.tsx";
import { ConsolaPage } from "./pages/consola.tsx";

import { NextUIProvider } from "@nextui-org/react";
import { TvPublicoPage } from "./pages/TV/tvpublico.tsx";
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode >
  <NextUIProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Players />} />
        <Route path="/consola" element={<ConsolaPage />} />
        <Route path="/tv" element={<TvPublicoPage />} />
      </Routes>
    </BrowserRouter>
  </NextUIProvider>
  // </React.StrictMode>
);
