import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TablePage from './TablePage';
import StatusPage from './StatusPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TablePage />} />
        <Route path="/status" element={<StatusPage />} />
      </Routes>
    </Router>
  );
}

export default App;