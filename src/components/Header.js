import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        {/* Logo et titre */}
        <div className="header-top">
          <div className="logo">
            <img src="/logo.png" alt="Logo Dentiste" className="logo-img" />
          </div>
          <div className="title">
            <h1>Un sourire en un clic : simplifiez vos rendez-vous dentaires !</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="navbar">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/connexion" className="nav-link">Connexion</Link>
            </li>
            <li className="nav-item">
              <Link to="/patient" className="nav-link">Patient</Link>
            </li>
            <li className="nav-item">
              <Link to="/aide-soignant" className="nav-link">Aide-soignant</Link>
            </li>
            <li className="nav-item">
              <Link to="/service" className="nav-link">Service</Link>
            </li>
            <li className="nav-item">
              <Link to="/publication" className="nav-link">Publication</Link>
            </li>
            <li className="nav-item">
              <Link to="/rendezvous" className="nav-link">Rendez-vous</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;