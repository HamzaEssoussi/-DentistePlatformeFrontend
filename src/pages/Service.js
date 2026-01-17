import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Service.css';

const Service = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomSM: '',
    tarifSM: '',
    typeSM: '',
    descriptionSM: '',
    nbSeances: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const serviceTypes = [
    'Dentisterie générale',
    'Diagnostic et soins courants',
    'Parodontologie',
    'Radiologie et imagerie dentaire',
    'Actes chirurgicaux',
    'Endodontie',
    'Esthétique dentaire',
    'Implantologie'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const serviceData = {
        nomSM: formData.nomSM,
        tarifSM: formData.tarifSM ? parseFloat(formData.tarifSM) : 0,
        typeSM: formData.typeSM,
        descriptionSM: formData.descriptionSM || null,
        nbSeances: formData.nbSeances ? parseInt(formData.nbSeances) : 1,
        photoService: null // Pas de photo pour le moment
      };
      
      console.log("=== DONNÉES ENVOYÉES VERS BACKEND ===");
      console.log("Données texte:", serviceData);
      
      const response = await fetch('http://localhost:8080/dentiste/api/services-medicaux/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData)
      });

      const responseText = await response.text();
      console.log("Réponse du serveur:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      if (response.ok) {
        alert("Service médical créé avec succès!");
        setFormData({
          nomSM: '',
          tarifSM: '',
          typeSM: '',
          descriptionSM: '',
          nbSeances: '',
        });
      } else {
        alert(`Erreur: ${responseData.error || responseData}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur réseau: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="service-page-glass">
      {/* BACKGROUND IMAGE */}
      <div 
        className="service-bg"
        style={{
          backgroundImage: `url('image-1-assistance-dentaire-redim.jpg')`
        }}
      ></div>
      
      {/* OVERLAY */}
      <div className="service-overlay"></div>

      <div className="service-container-glass">
        {/* Header Glass */}
        <div className="service-header-glass">
          <div className="header-content-glass">
            <h1 className="header-title-glass-white">
              <i className="bi bi-bandaid me-2"></i>
              Créer un Nouveau Service Médical
            </h1>
            <p className="header-subtitle-glass">
              Ajoutez un service médical à votre catalogue de soins dentaires
            </p>
          </div>
        </div>

        {/* Formulaire uniquement - pas de photo */}
        <div className="service-form-full-glass">
          <div className="form-content-glass-full">
            <form onSubmit={handleSubmit} className="service-form-glass">
              {/* Informations de base */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass-white">
                    <i className="bi bi-info-circle me-2"></i>
                    Informations de base
                  </h4>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass required">Nom du Service</label>
                    <input
                      type="text"
                      className="form-input-glass"
                      name="nomSM"
                      value={formData.nomSM}
                      onChange={handleChange}
                      placeholder="Ex: Détartrage complet"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass required">Tarif (TND)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input-glass"
                      name="tarifSM"
                      value={formData.tarifSM}
                      onChange={handleChange}
                      placeholder="Ex: 150.00"
                      required
                    />
                    <small className="form-hint-glass">
                      <i className="bi bi-currency-euro me-1"></i>
                      Tarif en Dinars
                    </small>
                  </div>
                </div>
              </div>

              {/* Type et séances */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass-white">
                    <i className="bi bi-calendar-check me-2"></i>
                    Configuration du service
                  </h4>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass required">Type de service</label>
                    <select
                      className="form-select-glass-black"
                      name="typeSM"
                      value={formData.typeSM}
                      onChange={handleChange}
                      required
                    >
                      <option value="" className="option-placeholder">[Choisir catégorie]</option>
                      {serviceTypes.map((type, index) => (
                        <option key={index} value={type} className="option-item">{type}</option>
                      ))}
                    </select>
                    <small className="form-hint-glass">
                      <i className="bi bi-tags me-1"></i>
                      Sélectionnez la catégorie
                    </small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass">Nombre de séances</label>
                    <input
                      type="number"
                      className="form-input-glass"
                      name="nbSeances"
                      value={formData.nbSeances}
                      onChange={handleChange}
                      placeholder="Ex: 3"
                      min="1"
                    />
                    <small className="form-hint-glass">
                      <i className="bi bi-calendar-week me-1"></i>
                      Nombre de rendez-vous nécessaires
                    </small>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass-white">
                    <i className="bi bi-card-text me-2"></i>
                    Description détaillée
                  </h4>
                </div>
                <div className="mb-3">
                  <label className="form-label-glass">Description du service</label>
                  <textarea
                    className="form-input-glass"
                    name="descriptionSM"
                    value={formData.descriptionSM}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Décrivez en détail le service médical, les étapes, les bénéfices..."
                    style={{ resize: 'vertical', minHeight: '120px' }}
                  />
                  <small className="form-hint-glass">
                    <i className="bi bi-chat-left-text me-1"></i>
                    Information détaillée pour les patients
                  </small>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions-glass">
                <button 
                  type="submit" 
                  className="btn-glass-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="bi bi-arrow-clockwise spin me-2"></i>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Créer le Service
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-glass-secondary"
                  onClick={() => navigate('/')}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Annuler
                </button>
              </div>
              
              <div className="required-note-glass">
                <small>
                  <i className="bi bi-asterisk me-1"></i>
                  Les champs marqués sont obligatoires
                </small>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Service;