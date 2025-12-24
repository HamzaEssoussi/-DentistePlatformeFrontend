import React from 'react';
import { Link } from 'react-router-dom';
import './ValiderInscription.css';

const ValiderInscription = () => {
  return (
    <div className="validation-page">
      <div className="container">
        <div className="validation-card">
          <div className="validation-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          
          <div className="validation-content">
            <h2 className="validation-title">Inscription réussie !</h2>
            <p className="validation-message">
              Votre dossier médical a été créé avec succès. 
              Consultez la liste des dentistes disponibles et prenez rendez-vous dès maintenant.
            </p>
            
            <div className="validation-actions">
              <Link to="/rendezvous" className="primary-action-btn">
                <i className="bi bi-calendar-plus me-2"></i>
                Prendre rendez-vous maintenant
              </Link>
              
              <Link to="/" className="secondary-action-btn">
                <i className="bi bi-house-door me-2"></i>
                Retour à l'accueil
              </Link>
            </div>
            
            <div className="additional-info">
              <h4 className="steps-title">Prochaines étapes :</h4>
              <ul className="steps-list">
                <li>
                  <i className="bi bi-person-badge text-primary me-2"></i>
                  Choisissez un dentiste selon sa spécialité
                </li>
                <li>
                  <i className="bi bi-clock text-primary me-2"></i>
                  Sélectionnez une date et heure convenable
                </li>
                <li>
                  <i className="bi bi-file-earmark-medical text-primary me-2"></i>
                  Précisez les services dentaires nécessaires
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValiderInscription;