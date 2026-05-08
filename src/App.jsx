// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/users" element={<Users />} /> 
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
