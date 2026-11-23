import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./index.css";
import { installGlobalErrorReporting } from "./lib/report-error";

installGlobalErrorReporting();

createRoot(document.getElementById("root")!).render(<App />);
