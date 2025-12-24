import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
       {/* Barre du bas */}
        <div className="footer-bottom">
          <div className="footer-marquee">
            <div className="marquee-content">
              <span>Développé par Hamza Essoussi</span>
              <span>•</span>
              <span>ENIT - Université de Tunis El Manar</span>
              <span>•</span>
              <span>Examen JEE</span>
              <span>•</span>
              <span>Contact: hamza.essoussi@etudiant-enit.utm.tn</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;