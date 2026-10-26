import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { MobileContainer } from "./components/MobileContainer";
import { Dashboard } from "./screens/Dashboard";
import { MapScreen } from "./screens/MapScreen";
import { TranslatorScreen } from "./screens/TranslatorScreen";
import { ContactsScreen } from "./screens/ContactsScreen";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { sosActive } = useApp();

  return (
    <MobileContainer activeTab={activeTab} onTabChange={setActiveTab} sosActive={sosActive}>
      {activeTab === "dashboard" && <Dashboard onNavigate={setActiveTab} />}
      {activeTab === "map" && <MapScreen />}
      {activeTab === "translate" && <TranslatorScreen />}
      {activeTab === "contacts" && <ContactsScreen />}
    </MobileContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

