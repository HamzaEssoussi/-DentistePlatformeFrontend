import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import des composants
import Layout from './components/Layout';
import Login from './pages/Login';
import Patient from './pages/Patient';
import AideSoignant from './pages/AideSoignant';
import Service from './pages/Service';
import Publication from './pages/Publication';
import Rendezvous from './pages/Rendezvous';
import ValiderInscription from './pages/ValiderInscription';
function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/patient" element={<Patient />} />
          <Route path="/aide-soignant" element={<AideSoignant />} />
          <Route path="/service" element={<Service />} />
          <Route path="/publication" element={<Publication />} />
          <Route path="/valider-inscription" element={<ValiderInscription />} />
          <Route path="/rendezvous" element={<Rendezvous />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;