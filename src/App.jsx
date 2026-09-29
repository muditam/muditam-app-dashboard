// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";
import WidgetLayout from "./pages/widget/WidgetLayout";
import WidgetDashboard from "./pages/widget/WidgetDashboard";
import WidgetConversations from "./pages/widget/WidgetConversations";
import WidgetLeads from "./pages/widget/WidgetLeads";
import WidgetBotUI from "./pages/widget/WidgetBotUI";
import WidgetBotFlow from "./pages/widget/WidgetBotFlow";
import AuthGate from "./AuthGate";

function App() {
  return (
    <AuthGate>
      <Router>
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/widget" element={<WidgetLayout />}>
            <Route index element={<Navigate to="/widget/dashboard" replace />} />
            <Route path="dashboard" element={<WidgetDashboard />} />
            <Route path="conversations" element={<WidgetConversations />} />
            <Route path="leads" element={<WidgetLeads />} />
            <Route path="bot-ui" element={<WidgetBotUI />} />
            <Route path="bot-flow" element={<WidgetBotFlow />} />
          </Route>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthGate>
  );
}

export default App;
