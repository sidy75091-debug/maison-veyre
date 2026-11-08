import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./suisse.css";
const root = document.getElementById("root")!;
const application = <App path={window.location.pathname} />;
if (root.dataset.prerendered) hydrateRoot(root, application);
else createRoot(root).render(application);
