import { createContext, type PropsWithChildren, useContext } from "react";
import type { Services } from "./services";

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({
  services,
  children,
}: PropsWithChildren<{ services: Services }>) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error("useServices deve ser usado dentro de ServicesProvider");
  }
  return services;
}
