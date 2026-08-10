// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";
import DietPlanEditor from "./pages/DietPlanEditor";
import WidgetLayout from "./pages/widget/WidgetLayout";
import WidgetDashboard from "./pages/widget/WidgetDashboard";
import WidgetConversations from "./pages/widget/WidgetConversations";
import WidgetBotUI from "./pages/widget/WidgetBotUI";
import WidgetBotFlow from "./pages/widget/WidgetBotFlow";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/users" element={<Users />} />
        <Route path="/diet/editor/:leadId" element={<DietPlanEditor />} />
        <Route path="/diet/editor/:leadId/:planId" element={<DietPlanEditor />} />
        <Route path="/widget" element={<WidgetLayout />}>
          <Route index element={<Navigate to="/widget/dashboard" replace />} />
          <Route path="dashboard" element={<WidgetDashboard />} />
          <Route path="conversations" element={<WidgetConversations />} />
          <Route path="bot-ui" element={<WidgetBotUI />} />
          <Route path="bot-flow" element={<WidgetBotFlow />} />
        </Route>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
