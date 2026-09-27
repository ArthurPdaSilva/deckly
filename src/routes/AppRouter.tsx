import {
  NavigationContainer,
  type NavigationProp,
  useFocusEffect,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { CardFormScreen } from "../features/cards/CardFormScreen";
import { CardsScreen } from "../features/cards/CardsScreen";
import { MoveCardScreen } from "../features/cards/MoveCardScreen";
import { DeckFormScreen } from "../features/decks/DeckFormScreen";
import { DecksScreen } from "../features/decks/DecksScreen";
import { GroupFormScreen } from "../features/decks/GroupFormScreen";
import { GroupsScreen } from "../features/decks/GroupsScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { ReviewScreen } from "../features/review/ReviewScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { StatisticsScreen } from "../features/statistics/StatisticsScreen";
import type { AppRoute, RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

type Navigation = NavigationProp<RootStackParamList>;

function navigateFromAppRoute(navigation: Navigation, route: AppRoute): void {
  switch (route.name) {
    case "home":
      navigation.navigate("home");
      break;
    case "decks":
      navigation.navigate("decks", { groupId: route.groupId });
      break;
    case "groups":
      navigation.navigate("groups");
      break;
    case "cards":
      navigation.navigate("cards", { deck: route.deck });
      break;
    case "groupForm":
      navigation.navigate("groupForm", { group: route.group });
      break;
    case "deckForm":
      navigation.navigate("deckForm", {
        deck: route.deck,
        groupId: route.groupId,
      });
      break;
    case "cardForm":
      navigation.navigate("cardForm", {
        deck: route.deck,
        card: route.card,
      });
      break;
    case "moveCard":
      navigation.navigate("moveCard", { deck: route.deck, card: route.card });
      break;
    case "review":
      navigation.navigate("review", {
        deck: route.deck,
        group: route.group,
      });
      break;
    case "statistics":
      navigation.navigate("statistics");
      break;
    case "settings":
      navigation.navigate("settings");
      break;
  }
}

function HomeRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "home">) {
  return (
    <HomeScreen
      onNavigate={(route) => navigateFromAppRoute(navigation, route)}
    />
  );
}

function DecksRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "decks">) {
  return (
    <DecksScreen
      onBack={() => navigation.goBack()}
      groupId={route.params?.groupId}
      onNavigate={(route) => navigateFromAppRoute(navigation, route)}
    />
  );
}

function GroupsRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "groups">) {
  return (
    <GroupsScreen
      onBack={() => navigation.navigate("home")}
      onNavigate={(route) => navigateFromAppRoute(navigation, route)}
    />
  );
}

function CardsRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "cards">) {
  const [reloadKey, setReloadKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setReloadKey((current) => current + 1);
    }, []),
  );

  return (
    <CardsScreen
      deck={route.params.deck}
      reloadKey={reloadKey}
      onBack={() => navigation.goBack()}
      onCreateCard={() =>
        navigation.navigate("cardForm", { deck: route.params.deck })
      }
      onEditCard={(card) =>
        navigation.navigate("cardForm", { deck: route.params.deck, card })
      }
      onMoveCard={(card) =>
        navigation.navigate("moveCard", { deck: route.params.deck, card })
      }
      onReview={() =>
        navigation.navigate("review", { deck: route.params.deck })
      }
    />
  );
}

function ReviewRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "review">) {
  return (
    <ReviewScreen
      deck={route.params?.deck}
      group={route.params?.group}
      onBack={() => navigation.goBack()}
    />
  );
}

function StatisticsRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "statistics">) {
  return <StatisticsScreen onBack={() => navigation.goBack()} />;
}

function GroupFormRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "groupForm">) {
  return (
    <GroupFormScreen
      group={route.params.group}
      onBack={() => navigation.goBack()}
    />
  );
}

function DeckFormRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "deckForm">) {
  return (
    <DeckFormScreen
      deck={route.params.deck}
      groupId={route.params.groupId}
      onBack={() => navigation.goBack()}
    />
  );
}

function CardFormRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "cardForm">) {
  return (
    <CardFormScreen
      deck={route.params.deck}
      card={route.params.card}
      onBack={() => navigation.goBack()}
    />
  );
}

function MoveCardRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "moveCard">) {
  return (
    <MoveCardScreen
      card={route.params.card}
      deck={route.params.deck}
      onBack={() => navigation.goBack()}
      onMoved={() => navigation.goBack()}
    />
  );
}

function SettingsRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "settings">) {
  return <SettingsScreen onBack={() => navigation.goBack()} />;
}

export function AppRouter() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen component={HomeRoute} name="home" />
        <Stack.Screen component={GroupsRoute} name="groups" />
        <Stack.Screen component={DecksRoute} name="decks" />
        <Stack.Screen component={CardsRoute} name="cards" />
        <Stack.Screen component={CardFormRoute} name="cardForm" />
        <Stack.Screen component={MoveCardRoute} name="moveCard" />
        <Stack.Screen component={DeckFormRoute} name="deckForm" />
        <Stack.Screen component={GroupFormRoute} name="groupForm" />
        <Stack.Screen component={ReviewRoute} name="review" />
        <Stack.Screen component={StatisticsRoute} name="statistics" />
        <Stack.Screen component={SettingsRoute} name="settings" />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
