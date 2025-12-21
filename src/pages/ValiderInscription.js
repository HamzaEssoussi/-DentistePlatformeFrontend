import React from 'react';
import { Link } from 'react-router-dom';
import './ValiderInscription.css';

const ValiderInscription = () => {
  return (
    <div className="validation-page">
      <div className="container">
        <div className="validation-card">
          <div className="validation-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          
          <div className="validation-content">
            <h2>Inscription réussie !</h2>
            <p className="validation-message">
              Votre dossier médical a été créé avec succès. 
              Consultez la liste des dentistes disponibles et prenez rendez-vous dès maintenant.
            </p>
            
            <div className="validation-actions">
              <Link to="/rendezvous" className="btn btn-primary btn-lg">
                <i className="fas fa-calendar-plus me-2"></i>
                Prendre rendez-vous maintenant
              </Link>
              
              <Link to="/" className="btn btn-outline-secondary btn-lg">
                <i className="fas fa-home me-2"></i>
                Retour à l'accueil
              </Link>
            </div>
            
            <div className="additional-info mt-4">
              <h4>Prochaines étapes :</h4>
              <ul className="steps-list">
                <li>
                  <i className="fas fa-user-md text-primary me-2"></i>
                  Choisissez un dentiste selon sa spécialité
                </li>
                <li>
                  <i className="fas fa-clock text-primary me-2"></i>
                  Sélectionnez une date et heure convenable
                </li>
                <li>
                  <i className="fas fa-file-medical text-primary me-2"></i>
                  Précisez les services dentaires nécessaires
                </li>
                <li>
                  <i className="fas fa-bell text-primary me-2"></i>
                  Recevez une confirmation par email
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