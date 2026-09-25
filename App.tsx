import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { ToastHost } from "./src/components/notifications";
import {
  DATABASE_NAME,
  initializeDatabase,
} from "./src/database/client";
import { AppRouter } from "./src/routes/AppRouter";
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
    <ThemeProvider database={database}>
      <AppRouter />
      <ToastHost />
    </ThemeProvider>
  );
}
