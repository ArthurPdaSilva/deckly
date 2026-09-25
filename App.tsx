import { SQLiteProvider } from "expo-sqlite";
import { Text, View } from "react-native";
import {
  DATABASE_NAME,
  initializeDatabase,
} from "./src/database/client";
import { ThemeProvider } from "./src/styles/ThemeProvider";

export function App() {
  return (
    <ThemeProvider>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={initializeDatabase}
      >
        <View>
          <Text>Deckly</Text>
        </View>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
