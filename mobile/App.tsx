import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { ToastHost } from "./src/components/notifications";
import {
  DATABASE_NAME,
  initializeDatabase,
} from "./src/database/client";
import { AppRouter } from "./src/routes/AppRouter";
import { LanguageProvider } from "./src/styles/LanguageProvider";
import { ThemeProvider } from "./src/styles/ThemeProvider";

export function App() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      <AppContent />
    </SQLiteProvider>
  );
}

function AppContent() {
  const database = useSQLiteContext();

  return (
    <LanguageProvider database={database}>
      <ThemeProvider database={database}>
        <AppRouter />
        <ToastHost />
      </ThemeProvider>
    </LanguageProvider>
  );
}
