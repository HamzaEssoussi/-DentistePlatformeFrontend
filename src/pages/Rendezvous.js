import React, { useState, useEffect, useRef } from 'react';
import './Rendezvous.css';

const Rendezvous = () => {
  const [formData, setFormData] = useState({
    dateRv: '',
    heureRv: '',
    detailsRv: '',
    premiereVisite: 'non',
    defaut: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [servicesMedicaux, setServicesMedicaux] = useState([]);
  const [dentistes, setDentistes] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedDentisteId, setSelectedDentisteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [testConnectionResult, setTestConnectionResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction pour tester la connexion au backend
  const testBackendConnection = async () => {
    try {
      console.log("Test de connexion au backend...");
      
      const response = await fetch('http://localhost:8080/dentiste/api/services-medicaux/', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      const text = await response.text();
      const result = { 
        success: response.ok,
        status: response.status,
        text: text,
        endpoint: 'services-medicaux'
      };
      
      setTestConnectionResult(result);
      return result;
      
    } catch (error) {
      console.error("Erreur de test:", error);
      const result = { success: false, error: error.message };
      setTestConnectionResult(result);
      return result;
    }
  };

  // Charger les services médicaux et dentistes depuis la base de données
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log("Chargement des données depuis le backend...");
        
        const testResult = await testBackendConnection();
        
        if (testResult.success) {
          // Charger les services médicaux
          try {
            const servicesResponse = await fetch('http://localhost:8080/dentiste/api/services-medicaux/', {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            });
            
            if (servicesResponse.ok) {
              const servicesData = await servicesResponse.json();
              setServicesMedicaux(servicesData);
            }
          } catch (servicesError) {
            console.error("Erreur chargement services:", servicesError);
          }
          
          // Charger les dentistes
          try {
            const dentistesResponse = await fetch('http://localhost:8080/dentiste/api/dentistes/', {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            });
            
            if (dentistesResponse.ok) {
              const dentistesData = await dentistesResponse.json();
              setDentistes(dentistesData);
            }
          } catch (dentistesError) {
            console.error("Erreur chargement dentistes:", dentistesError);
          }
          
        } else {
          useTestData();
          setErrors(prev => ({ 
            ...prev, 
            backend: `Mode démo activé: ${testResult.error || 'Serveur non accessible'}`
          }));
        }
        
      } catch (error) {
        console.error('Erreur générale:', error);
        useTestData();
        setErrors(prev => ({ 
          ...prev, 
          backend: `Erreur: ${error.message}` 
        }));
      } finally {
        setLoading(false);
      }
    };

    const useTestData = () => {
      console.log("Utilisation des données de test");
      
      // Services médicaux de test
      const servicesTest = [
        { 
          numSM: 1, 
          nomSM: "Consultation dentaire générale", 
          descriptionSM: "Examen complet de la santé bucco-dentaire",
          tarifSM: 50.00,
        },
        
      ];
      
      // Dentistes de test
      const dentistesTest = [
        { 
          idD: 1, 
          nomD: "Martin", 
          prenomD: "Pierre", 
          emailD: "pierre.martin@clinique.com",
          specialiteD: "Dentisterie générale",
          telD: "01 23 45 67 89"
        },
        
      ];
      
      setServicesMedicaux(servicesTest);
      setDentistes(dentistesTest);
    };

    loadData();
  }, []);

  // Filtrer les dentistes basé sur la recherche
  const filteredDentistes = dentistes.filter(dentiste => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      dentiste.nomD.toLowerCase().includes(term) ||
      dentiste.prenomD.toLowerCase().includes(term) ||
      dentiste.specialiteD.toLowerCase().includes(term) ||
      `${dentiste.prenomD} ${dentiste.nomD}`.toLowerCase().includes(term)
    );
  });

  // Dentiste sélectionné
  const selectedDentiste = dentistes.find(d => d.idD === parseInt(selectedDentisteId));

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    if (selectedDentisteId && value === '') {
      setSelectedDentisteId('');
    }
  };

  const handleSelectDentiste = (dentiste) => {
    setSelectedDentisteId(dentiste.idD);
    setSearchTerm(`${dentiste.prenomD} ${dentiste.nomD} - ${dentiste.specialiteD}`);
    setShowDropdown(false);
    
    if (errors.dentiste) {
      setErrors(prev => ({ ...prev, dentiste: '' }));
    }
  };

  const handleClearSelection = () => {
    setSelectedDentisteId('');
    setSearchTerm('');
    setShowDropdown(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = {};
    if (!formData.dateRv) validationErrors.dateRv = "La date est requise";
    if (!formData.heureRv) validationErrors.heureRv = "L'heure est requise";
    if (!selectedDentisteId) validationErrors.dentiste = "Veuillez sélectionner un dentiste";
    if (selectedServiceIds.length === 0) validationErrors.services = "Veuillez sélectionner au moins un service médical";
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const rendezvousData = {
        dateRv: formData.dateRv,
        heureRv: formData.heureRv,
        detailsRv: formData.detailsRv || '',
        statutRv: "Planifié",
        premiereVisite: formData.premiereVisite || 'non',
        defautConstate: formData.defaut || '',
        patient: {
          idP: 1,
          nomP: "Patient",
          prenomP: "Test"
        },
        dentiste: {
          idD: parseInt(selectedDentisteId),
          nomD: selectedDentiste?.nomD || "",
          prenomD: selectedDentiste?.prenomD || "",
          emailD: selectedDentiste?.emailD || "",
          specialiteD: selectedDentiste?.specialiteD || "",
          actifD: true
        },
        services: selectedServiceIds.map(serviceId => {
          const service = servicesMedicaux.find(s => s.numSM === serviceId);
          return {
            numSM: serviceId,
            description: service?.nomSM || "Service médical",
            tarif: service?.tarifSM || 0,
            nomSM: service?.nomSM || "",
            
          };
        })
      };

      console.log("📤 Données envoyées au backend:", JSON.stringify(rendezvousData, null, 2));

      const response = await fetch('http://localhost:8080/dentiste/api/rendezvous/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(rendezvousData)
      });

      const responseText = await response.text();
      console.log("📥 Réponse du backend:", responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Erreur parsing JSON:", parseError);
        throw new Error(`Réponse invalide du serveur: ${responseText.substring(0, 200)}`);
      }

      if (response.ok) {
        setSuccessMessage(`✅ Rendez-vous créé avec succès ! ID: ${data.rendezvousId || data.idRv || 'N/A'}`);
        
        setFormData({
          dateRv: '',
          heureRv: '',
          detailsRv: '',
          premiereVisite: 'non',
          defaut: ''
        });
        setSelectedServiceIds([]);
        setSelectedDentisteId('');
        setSearchTerm('');
        setShowDropdown(false);
        
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(data.error || `Erreur ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      dateRv: '',
      heureRv: '',
      detailsRv: '',
      premiereVisite: 'non',
      defaut: ''
    });
    setSelectedServiceIds([]);
    setSelectedDentisteId('');
    setSearchTerm('');
    setShowDropdown(false);
    setErrors({});
    setSuccessMessage('');
  };

  const calculateTotal = () => {
    return selectedServiceIds.reduce((total, serviceId) => {
      const service = servicesMedicaux.find(s => s.numSM === serviceId);
      return total + (service?.tarifSM || 0);
    }, 0);
  };

  const calculateDureeTotale = () => {
    return selectedServiceIds.reduce((total, serviceId) => {
      const service = servicesMedicaux.find(s => s.numSM === serviceId);
      return total + (service?.dureeSM || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="rendezvous-page">
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rendezvous-page">
      <div className="container">
        <div className="page-header text-center mb-5">
          <h1 className="display-5 fw-bold text-primary">
            <i className="bi bi-calendar-plus me-2"></i>
            Prendre un rendez-vous dentaire
          </h1>
          <p className="lead text-muted">
            Sélectionnez un dentiste et les services médicaux nécessaires
          </p>
        </div>

        {/* Messages d'information */}
        {testConnectionResult && !testConnectionResult.success && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Mode démo activé :</strong> {errors.backend}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setErrors(prev => ({ ...prev, backend: '' }))}
              aria-label="Close"
            ></button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccessMessage('')}
              aria-label="Close"
            ></button>
          </div>
        )}

        {errors.submit && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-x-circle me-2"></i>
            <strong>Erreur :</strong> {errors.submit}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setErrors(prev => ({ ...prev, submit: '' }))}
              aria-label="Close"
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rendezvous-form shadow-lg p-4 rounded-3">
          
          {/* SECTION 1: Recherche et sélection du dentiste */}
          <div className="mb-4" ref={dropdownRef}>
            <label className="form-label fw-bold">
              <i className="bi bi-search me-2"></i>
              Rechercher et sélectionner votre dentiste *
            </label>
            {errors.dentiste && (
              <div className="text-danger small mb-2">
                <i className="bi bi-exclamation-circle me-1"></i>
                {errors.dentiste}
              </div>
            )}

            {/* Barre de recherche avec dropdown */}
            <div className="search-dentiste-wrapper">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control search-dentiste-input"
                  placeholder="Rechercher un dentiste par nom, prénom ou spécialité..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowDropdown(true)}
                  autoComplete="off"
                />
                {selectedDentisteId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleClearSelection}
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </div>

              {/* Dropdown des résultats */}
              {showDropdown && searchTerm && (
                <div className="dentiste-dropdown">
                  <div className="dropdown-header">
                    <small className="text-muted">
                      {filteredDentistes.length} dentiste{filteredDentistes.length !== 1 ? 's' : ''} trouvé{filteredDentistes.length !== 1 ? 's' : ''}
                    </small>
                  </div>
                  <div className="dropdown-list">
                    {filteredDentistes.length === 0 ? (
                      <div className="dropdown-empty">
                        <i className="bi bi-person-x fs-4 mb-2"></i>
                        <p className="mb-0">Aucun dentiste trouvé</p>
                        <small className="text-muted">Essayez un autre nom ou spécialité</small>
                      </div>
                    ) : (
                      filteredDentistes.map(dentiste => (
                        <div 
                          key={dentiste.idD} 
                          className={`dropdown-item ${selectedDentisteId == dentiste.idD ? 'selected' : ''}`}
                          onClick={() => handleSelectDentiste(dentiste)}
                        >
                          <div className="dentiste-dropdown-info">
    
                            <div className="dentiste-details">
                              <div className="dentiste-name">
                                Dr. {dentiste.prenomD} {dentiste.nomD}
                              </div>
                              <div className="dentiste-speciality">
                                <i className="bi bi-award me-1"></i>
                                {dentiste.specialiteD}
                              </div>
                              <div className="dentiste-contact">
                                <i className="bi bi-telephone me-1"></i>
                                {dentiste.telD}
                              </div>
                            </div>
                          </div>
                          {selectedDentisteId == dentiste.idD && (
                            <div className="selected-indicator">
                              <i className="bi bi-check-circle-fill text-success"></i>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Affichage du dentiste sélectionné */}
            {selectedDentiste && (
              <div className="selected-dentiste-display mt-3">
                <div className="card border-primary">
                  <div className="card-header bg-primary text-white">
                    <h6 className="mb-0">
                      <i className="bi bi-person-check me-2"></i>
                      Dentiste sélectionné
                    </h6>
                  
                  <div className="card-body">
                    <div className="row">
                
                      </div>
                      <div className="col-md-10">
                        <h5 className="card-title text-primary">
                          Dr. {selectedDentiste.prenomD} {selectedDentiste.nomD}
                        </h5>
                        <div className="row mt-3">
                          <div className="col-md-6">
                            <p className="mb-2">
                              <i className="bi bi-award me-2 text-success"></i>
                              <strong>Spécialité :</strong> {selectedDentiste.specialiteD}
                            </p>
                            <p className="mb-2">
                              <i className="bi bi-telephone me-2"></i>
                              <strong>Téléphone :&nbsp;</strong> {selectedDentiste.telD}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-2">
                              <i className="bi bi-envelope me-2"></i>
                              <strong>Email:  </strong> 
                              <a href={`mailto:${selectedDentiste.emailD}`} className="ms-2">
                                {selectedDentiste.emailD}
                              </a>
                            </p>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm mt-2"
                              onClick={handleClearSelection}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              Changer de dentiste
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Date et heure */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-calendar-date me-2"></i>
                Date souhaitée *
              </label>
              {errors.dateRv && (
                <div className="text-danger small mb-2">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {errors.dateRv}
                </div>
              )}
              <input
                type="date"
                className={`form-control ${errors.dateRv ? 'is-invalid' : ''}`}
                name="dateRv"
                value={formData.dateRv}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                required
              />
              <div className="form-text">Du lundi au vendredi uniquement</div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-clock me-2"></i>
                Heure souhaitée *
              </label>
              {errors.heureRv && (
                <div className="text-danger small mb-2">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {errors.heureRv}
                </div>
              )}
              <input
                type="time"
                className={`form-control ${errors.heureRv ? 'is-invalid' : ''}`}
                name="heureRv"
                value={formData.heureRv}
                onChange={handleChange}
                min="08:00"
                max="18:00"
                step="900"
                required
              />
              <div className="form-text">Créneaux de 15 minutes (8h00 - 18h00)</div>
            </div>
          </div>

          {/* SECTION 3: Services médicaux */}
          <div className="mb-4">
            <label className="form-label fw-bold">
              <i className="bi bi-heart-pulse me-2"></i>
              Services médicaux *
            </label>
            {errors.services && (
              <div className="text-danger small mb-2">
                <i className="bi bi-exclamation-circle me-1"></i>
                {errors.services}
              </div>
            )}
            
            <div className="services-grid">
              {servicesMedicaux.map(service => (
                <div 
                  key={service.numSM} 
                  className={`service-card ${selectedServiceIds.includes(service.numSM) ? 'selected' : ''}`}
                  onClick={() => {
                    const newSelected = selectedServiceIds.includes(service.numSM)
                      ? selectedServiceIds.filter(id => id !== service.numSM)
                      : [...selectedServiceIds, service.numSM];
                    setSelectedServiceIds(newSelected);
                  }}
                >
                  <div className="service-header">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedServiceIds.includes(service.numSM)}
                        onChange={() => {}}
                      />
                    </div>
                    <h6 className="service-title">{service.nomSM}</h6>
                    <span className="service-price">{service.tarifSM} €</span>
                  </div>
                  <div className="service-body">
                    <p className="service-description">{service.descriptionSM}</p>
                    
                  </div>
                </div>
              ))}
            </div>
            
            {/* Résumé des services sélectionnés */}
            {selectedServiceIds.length > 0 && (
              <div className="selected-services-summary mt-3 p-3 bg-light rounded">
                <h6>
                  <i className="bi bi-check2-circle me-2 text-success"></i>
                  Services sélectionnés ({selectedServiceIds.length})
                </h6>
                <ul className="list-group list-group-flush">
                  {selectedServiceIds.map(serviceId => {
                    const service = servicesMedicaux.find(s => s.numSM === serviceId);
                    return service ? (
                      <li key={service.numSM} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <span>{service.nomSM}</span>
                          <small className="text-muted d-block">{service.dureeSM} min</small>
                        </div>
                        <span className="badge bg-primary rounded-pill">{service.tarifSM} €</span>
                      </li>
                    ) : null;
                  })}
                </ul>
                <div className="mt-2 text-end">
                  <p className="mb-1">
                    <strong>Durée totale:</strong> {calculateDureeTotale()} minutes
                  </p>
                  <p className="mb-0">
                    <strong>Total:</strong> {calculateTotal()} €
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Informations supplémentaires */}
          <div className="mb-4">
            <label className="form-label fw-bold">
              <i className="bi bi-chat-left-text me-2"></i>
              Informations complémentaires
            </label>
            <textarea
              className="form-control"
              name="detailsRv"
              value={formData.detailsRv}
              onChange={handleChange}
              rows="3"
              placeholder="Informations importantes (allergies, traitements en cours, médicaments, etc.)..."
              maxLength="500"
            />
            <div className="form-text">{formData.detailsRv.length}/500 caractères</div>
          </div>

          {/* SECTION 5: Première visite */}
          <div className="mb-4">
            <label className="form-label fw-bold">Première visite chez nous ?</label>
            <div className="btn-group" role="group">
              <input
                type="radio"
                className="btn-check"
                name="premiereVisite"
                id="premiereVisiteOui"
                value="oui"
                checked={formData.premiereVisite === 'oui'}
                onChange={handleChange}
              />
              <label className="btn btn-outline-primary" htmlFor="premiereVisiteOui">
                Oui
              </label>

              <input
                type="radio"
                className="btn-check"
                name="premiereVisite"
                id="premiereVisiteNon"
                value="non"
                checked={formData.premiereVisite === 'non'}
                onChange={handleChange}
              />
              <label className="btn btn-outline-primary" htmlFor="premiereVisiteNon">
                Non
              </label>
            </div>
          </div>

          {/* SECTION 6: Motif de consultation */}
          <div className="mb-4">
            <label className="form-label fw-bold">Motif de consultation</label>
            <textarea
              className="form-control"
              name="defaut"
              value={formData.defaut}
              onChange={handleChange}
              rows="2"
              placeholder="Décrivez brièvement le motif de votre consultation..."
            />
          </div>

          {/* SECTION 7: Boutons d'action */}
          <div className="form-actions d-flex justify-content-between mt-5 pt-4 border-top">
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-lg px-4"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              <i className="bi bi-x-circle me-2"></i>
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  En cours...
                </>
              ) : (
                <>
                  <i className="bi bi-calendar-check me-2"></i>
                  Confirmer le rendez-vous ({calculateTotal()} €)
                </>
              )}
            </button>
          </div>
          
          <div className="mt-3 text-muted small">
            <p className="mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Les champs marqués d'un * sont obligatoires
            </p>
            <p className="mb-0">
              <i className="bi bi-shield-check me-1"></i>
              Vos données sont traitées de manière confidentielle
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Rendezvous;