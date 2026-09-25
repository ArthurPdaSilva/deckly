import { SQLiteProvider } from "expo-sqlite";
import { ToastHost } from "./src/components/notifications";
import {
  DATABASE_NAME,
  initializeDatabase,
} from "./src/database/client";
import { DecksScreen } from "./src/features/decks/DecksScreen";
import { ThemeProvider } from "./src/styles/ThemeProvider";

export function App() {
  return (
    <ThemeProvider>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={initializeDatabase}
      >
        <DecksScreen />
      </SQLiteProvider>
      <ToastHost />
    </ThemeProvider>
  );
}
