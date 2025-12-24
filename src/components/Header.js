import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">

        {/* Logo + slogan */}
        <div className="header-left">
          <Link to="/" className="logo-text">
            SmileEveryDay
          </Link>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <Link to="/connexion" className="nav-link">Connexion</Link>
          <Link to="/patient" className="nav-link">Patient</Link>
          <Link to="/aide-soignant" className="nav-link">Aide-soignant</Link>
          <Link to="/service" className="nav-link">Services</Link>
          <Link to="/publication" className="nav-link">Publications</Link>

          {/* CTA */}
          <Link to="/rendezvous" className="nav-link nav-cta">
            Rendez-vous
          </Link>
        </nav>

      </div>
    </header>
  );
};

export default Header;
