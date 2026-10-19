import { Route, Routes } from "react-router-dom";
import { AppToaster } from "../components/AppToaster";
import { Layout } from "../components/Layout";
import { BackupPage } from "../features/backup/BackupPage";
import { CardFormPage } from "../features/cards/CardFormPage";
import { CardsPage } from "../features/cards/CardsPage";
import { MoveCardPage } from "../features/cards/MoveCardPage";
import { DeckFormPage } from "../features/decks/DeckFormPage";
import { DecksPage } from "../features/decks/DecksPage";
import { GroupFormPage } from "../features/decks/GroupFormPage";
import { GroupsPage } from "../features/decks/GroupsPage";
import { HomePage } from "../features/home/HomePage";
import { ReviewPage } from "../features/review/ReviewPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { StatisticsPage } from "../features/statistics/StatisticsPage";
import { NotFoundPage } from "./NotFoundPage";

export function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route element={<HomePage />} index />
          <Route element={<GroupsPage />} path="groups" />
          <Route element={<GroupFormPage />} path="groups/new" />
          <Route element={<GroupFormPage />} path="groups/:groupId/edit" />
          <Route element={<DecksPage />} path="groups/:groupId/decks" />
          <Route element={<DeckFormPage />} path="decks/new" />
          <Route element={<DeckFormPage />} path="decks/:deckId/edit" />
          <Route element={<CardsPage />} path="decks/:deckId/cards" />
          <Route element={<CardFormPage />} path="decks/:deckId/cards/new" />
          <Route element={<CardFormPage />} path="cards/:cardId/edit" />
          <Route element={<MoveCardPage />} path="cards/:cardId/move" />
          <Route element={<ReviewPage />} path="review" />
          <Route element={<ReviewPage />} path="review/deck/:deckId" />
          <Route element={<ReviewPage />} path="review/group/:groupId" />
          <Route element={<StatisticsPage />} path="statistics" />
          <Route element={<BackupPage />} path="backup" />
          <Route element={<SettingsPage />} path="settings" />
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
      <AppToaster />
    </>
  );
}
