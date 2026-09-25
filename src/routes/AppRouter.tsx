import { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { CardsScreen } from "../features/cards/CardsScreen";
import { DecksScreen } from "../features/decks/DecksScreen";
import { ReviewScreen } from "../features/review/ReviewScreen";
import { StatisticsScreen } from "../features/statistics/StatisticsScreen";
import type { AppRoute } from "./types";

export function AppRouter() {
  const [route, setRoute] = useState<AppRoute>({ name: "decks" });

  useEffect(() => {
    if (route.name === "decks") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setRoute({ name: "decks" });
        return true;
      },
    );

    return () => subscription.remove();
  }, [route.name]);

  switch (route.name) {
    case "cards":
      return (
        <CardsScreen
          deck={route.deck}
          onBack={() => setRoute({ name: "decks" })}
        />
      );
    case "review":
      return <ReviewScreen onBack={() => setRoute({ name: "decks" })} />;
    case "statistics":
      return <StatisticsScreen onBack={() => setRoute({ name: "decks" })} />;
    case "decks":
      return <DecksScreen onNavigate={setRoute} />;
  }
}
