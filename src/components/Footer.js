import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="email-animation">
          <span className="moving-email">contact@dentiste-platform.com</span>
        </div>
        <p className="copyright">
          &copy; {new Date().getFullYear()} Plateforme Dentiste - Tous droits réservés
        </p>
      </div>
    </footer>
  );
};

export default Footer;