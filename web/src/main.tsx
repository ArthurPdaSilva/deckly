import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { ServicesProvider } from "./app/ServicesProvider";
import { createServices } from "./app/services";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { requestPersistentStorage } from "./lib/storage";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./index.css";

const services = createServices();

// Pede ao navegador para não apagar os dados sozinho; a resposta é opcional.
void requestPersistentStorage();

const container = document.getElementById("root");
if (!container) throw new Error("Elemento #root não encontrado");

createRoot(container).render(
  <StrictMode>
    <ServicesProvider services={services}>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </ServicesProvider>
  </StrictMode>,
);
