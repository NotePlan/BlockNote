import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "highlight.js/styles/github-dark.css";

window.React = React;

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
