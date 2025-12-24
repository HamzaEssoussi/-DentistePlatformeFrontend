import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import PatientDashboard from './pages/PatientDashboard';
import AideSoignantDashboard from './pages/AideSoignantDashboard';

// Composant ProtectedRoute
const ProtectedRoute = ({ children, requiredType }) => {
  // Récupérer les données d'authentification depuis localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  console.log('ProtectedRoute check:', { user, isAuthenticated, requiredType });

  // Si non authentifié, rediriger vers login
  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/connexion" />;
  }

  // Vérifier le type d'utilisateur si spécifié
  if (requiredType && user.type !== requiredType) {
    console.log('Wrong user type, redirecting to login');
    return <Navigate to="/connexion" />;
  }

  console.log('Access granted to protected route');
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Navigate to="/connexion" />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/patient" element={<Patient />} />
          <Route path="/aide-soignant" element={<AideSoignant />} />
          <Route path="/service" element={<Service />} />
          <Route path="/publication" element={<Publication />} />
          <Route path="/valider-inscription" element={<ValiderInscription />} />
          <Route path="/rendezvous" element={<Rendezvous />} />
          
          {/* Routes protégées */}
          <Route 
            path="/PatientDashboard" 
            element={
              <ProtectedRoute requiredType="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/AideSoignantDashboard" 
            element={
              <ProtectedRoute requiredType="dentiste">
                <AideSoignantDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Route 404 - Redirection vers login */}
          <Route path="*" element={<Navigate to="/connexion" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;