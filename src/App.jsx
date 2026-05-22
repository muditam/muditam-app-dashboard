// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";
import DietPlanEditor from "./pages/DietPlanEditor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/users" element={<Users />} /> 
        <Route path="/diet/editor/:leadId" element={<DietPlanEditor />} />
        <Route path="/diet/editor/:leadId/:planId" element={<DietPlanEditor />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
