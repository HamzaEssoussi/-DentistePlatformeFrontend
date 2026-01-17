import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Logique de recherche
    if (searchQuery.toLowerCase().includes('rendez')) {
      navigate('/rendezvous');
    } else if (searchQuery.toLowerCase().includes('connexion') || searchQuery.toLowerCase().includes('login')) {
      navigate('/connexion');
    } else if (searchQuery.toLowerCase().includes('patient')) {
      navigate('/patient');
    } else if (searchQuery.toLowerCase().includes('aide')) {
      navigate('/aide-soignant');
    } else if (searchQuery.toLowerCase().includes('publication')) {
      navigate('/publication');
    } else if (searchQuery.toLowerCase().includes('service')) {
      navigate('/service');
    } else if (searchQuery.toLowerCase().includes('dashboard')) {
      if (user?.type === 'patient') {
        navigate('/PatientDashboard');
      } else if (user?.type === 'dentiste') {
        navigate('/AideSoignantDashboard');
      }
    } else if (searchQuery.toLowerCase().includes('valider')) {
      navigate('/valider-inscription');
    }
    
    setSearchQuery('');
  };

  return (
    <header className="header">
      {/* Logo à GAUCHE (en dehors du container) */}
      <div className="header-logo-container">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="logo-image"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* Navigation dans le CONTAINER */}
      <div className="header-container">
        <nav className="header-nav">
          <Link to="/connexion" className="nav-link">Connexion</Link>
          <Link to="/patient" className="nav-link">Patient</Link>
          <Link to="/aide-soignant" className="nav-link">Aide-soignant</Link>
          <Link to="/service" className="nav-link">Services</Link>
          <Link to="/publication" className="nav-link">Publications</Link>
          <Link to="/rendezvous" className="nav-link nav-cta">
            Rendez-vous
          </Link>
        </nav>
      </div>

      {/* Barre de recherche à DROITE (en dehors du container) */}
      <div className="header-search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
    </header>
  );
};

export default Header;