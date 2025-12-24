import React, { useState, useEffect, useRef } from 'react';
import './Rendezvous.css';

const API_BASE_URL = 'http://localhost:8080/dentiste/api';
const FILE_BASE_URL = 'http://localhost:8080/dentiste/api/files';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [stats, setStats] = useState({ available: 0, occupied: 0, total: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateAllTimeSlots = () => {
    const slots = [];
    const startHour = 8;
    const endHour = 18;
    const interval = 15;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          available: true,
          disabled: false,
          isOccupied: false
        });
      }
    }
    return slots;
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8080/dentiste/api/services-medicaux/', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      const text = await response.text();
      return { 
        success: response.ok,
        status: response.status,
        text: text
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loadOccupiedSlots = async (dentisteId, date) => {
    try {
      if (!dentisteId || !date) return [];
      
      const formattedDate = date;
      const response = await fetch(
        `http://localhost:8080/dentiste/api/rendezvous/dentiste/${dentisteId}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );
      
      if (response.ok) {
        const allRendezVous = await response.json();
        const rendezvousDuJour = allRendezVous.filter(rdv => {
          const rdvDate = rdv.dateRv ? 
            (typeof rdv.dateRv === 'string' ? rdv.dateRv.split('T')[0] : rdv.dateRv) : 
            null;
          
          return rdvDate === formattedDate && 
                 rdv.statutRv !== 'Annulé' && 
                 rdv.statutRv !== 'Terminé';
        });
        
        const occupiedTimes = rendezvousDuJour
          .map(rdv => {
            if (rdv.heureRv) {
              const timeStr = typeof rdv.heureRv === 'string' ? rdv.heureRv : rdv.heureRv.toString();
              const timeParts = timeStr.split(':');
              if (timeParts.length >= 2) {
                const hours = parseInt(timeParts[0]);
                const minutes = parseInt(timeParts[1]);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }
            }
            return null;
          })
          .filter(time => time !== null);
        
        return occupiedTimes;
      }
      
      return [];
    } catch (error) {
      console.error("Erreur chargement créneaux occupés:", error);
      return [];
    }
  };

  const updateTimeSlotsAvailability = async (dentisteId, date) => {
    if (!dentisteId || !date) {
      const slots = generateAllTimeSlots();
      setTimeSlots(slots);
      setStats({
        available: slots.length,
        occupied: 0,
        total: slots.length
      });
      return;
    }
    
    setIsCheckingAvailability(true);
    
    try {
      const occupiedTimes = await loadOccupiedSlots(dentisteId, date);
      const allSlots = generateAllTimeSlots();
      
      const updatedSlots = allSlots.map(slot => {
        const isOccupied = occupiedTimes.includes(slot.time);
        return {
          ...slot,
          available: !isOccupied,
          disabled: isOccupied,
          isOccupied: isOccupied
        };
      });
      
      const availableCount = updatedSlots.filter(slot => slot.available).length;
      const occupiedCount = updatedSlots.filter(slot => slot.isOccupied).length;
      
      setTimeSlots(updatedSlots);
      setStats({
        available: availableCount,
        occupied: occupiedCount,
        total: updatedSlots.length
      });
      
      if (formData.heureRv) {
        const selectedSlot = updatedSlots.find(slot => slot.time === formData.heureRv);
        if (selectedSlot && selectedSlot.isOccupied) {
          setFormData(prev => ({ ...prev, heureRv: '' }));
          setErrors(prev => ({
            ...prev,
            heureRv: "Le créneau sélectionné n'est plus disponible"
          }));
        }
      }
      
    } catch (error) {
      console.error("Erreur mise à jour disponibilité:", error);
      const slots = generateAllTimeSlots();
      setTimeSlots(slots);
      setStats({
        available: slots.length,
        occupied: 0,
        total: slots.length
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const testResult = await testBackendConnection();
        
        if (testResult.success) {
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
          
          try {
            const dentistesResponse = await fetch('http://localhost:8080/dentiste/api/dentistes/', {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            });
            
            if (dentistesResponse.ok) {
              const dentistesData = await dentistesResponse.json();
              const dentistesWithPhotos = dentistesData.map(dentiste => ({
                ...dentiste,
                photoUrl: dentiste.photoD ? 
                  `${FILE_BASE_URL}/uploads/patients/${dentiste.photoD}` : 
                  null
              }));
              setDentistes(dentistesWithPhotos);
            }
          } catch (dentistesError) {
            console.error("Erreur chargement dentistes:", dentistesError);
          }
          
        } else {
          setServicesMedicaux([
            { 
              numSM: 1, 
              nomSM: "Consultation dentaire générale", 
              descriptionSM: "Examen complet",
              tarifSM: 50.00,
              dureeSM: 30
            },
            { 
              numSM: 2, 
              nomSM: "Détartrage", 
              descriptionSM: "Nettoyage professionnel",
              tarifSM: 80.00,
              dureeSM: 45
            }
          ]);
          
          setDentistes([
            { 
              idD: 1, 
              nomD: "Martin", 
              prenomD: "Pierre", 
              emailD: "pierre.martin@clinique.com",
              specialiteD: "Dentisterie générale",
              telD: "01 23 45 67 89",
              photoUrl: null
            }
          ]);
        }
        
      } catch (error) {
        console.error('Erreur générale:', error);
      } finally {
        setLoading(false);
        const slots = generateAllTimeSlots();
        setTimeSlots(slots);
        setStats({
          available: slots.length,
          occupied: 0,
          total: slots.length
        });
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    updateTimeSlotsAvailability(selectedDentisteId, formData.dateRv);
  }, [selectedDentisteId, formData.dateRv]);

  const filteredDentistes = dentistes.filter(dentiste => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      dentiste.nomD.toLowerCase().includes(term) ||
      dentiste.prenomD.toLowerCase().includes(term) ||
      (dentiste.specialiteD && dentiste.specialiteD.toLowerCase().includes(term))
    );
  });

  const selectedDentiste = dentistes.find(d => d.idD === parseInt(selectedDentisteId));

  const DentistePhoto = ({ dentiste, size = 'md' }) => {
    const sizes = { sm: '40px', md: '60px', lg: '80px', xl: '100px' };
    const [imgError, setImgError] = useState(false);
    
    const getInitials = (prenom, nom) => {
      return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
    };
    
    const getAvatarColor = (id) => {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      ];
      return colors[id % colors.length];
    };
    
    if (dentiste?.photoUrl && !imgError) {
      return (
        <img 
          src={dentiste.photoUrl} 
          alt={`Dr. ${dentiste.prenomD} ${dentiste.nomD}`}
          className="dentiste-photo"
          style={{
            width: sizes[size],
            height: sizes[size],
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
          onError={() => setImgError(true)}
        />
      );
    }
    
    return (
      <div 
        className="dentiste-avatar"
        style={{
          width: sizes[size],
          height: sizes[size],
          borderRadius: '50%',
          background: getAvatarColor(dentiste?.idD || 0),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: size === 'sm' ? '16px' : size === 'lg' ? '24px' : '20px',
          border: '3px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        {getInitials(dentiste?.prenomD, dentiste?.nomD)}
      </div>
    );
  };

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
    if (errors.dentiste) setErrors(prev => ({ ...prev, dentiste: '' }));
  };

  const handleClearSelection = () => {
    setSelectedDentisteId('');
    setSearchTerm('');
    setShowDropdown(true);
    setFormData(prev => ({ ...prev, heureRv: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTimeSelect = (time, isAvailable) => {
    if (!isAvailable) {
      setErrors(prev => ({
        ...prev,
        heureRv: "Ce créneau n'est pas disponible. Veuillez en choisir un autre."
      }));
      return;
    }
    setFormData(prev => ({ ...prev, heureRv: time }));
    if (errors.heureRv) setErrors(prev => ({ ...prev, heureRv: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = {};
    if (!formData.dateRv) validationErrors.dateRv = "La date est requise";
    if (!formData.heureRv) validationErrors.heureRv = "L'heure est requise";
    if (!selectedDentisteId) validationErrors.dentiste = "Veuillez sélectionner un dentiste";
    if (selectedServiceIds.length === 0) validationErrors.services = "Veuillez sélectionner au moins un service médical";
    
    const selectedSlot = timeSlots.find(slot => slot.time === formData.heureRv);
    if (selectedSlot && selectedSlot.isOccupied) {
      validationErrors.heureRv = "Le créneau sélectionné n'est pas disponible";
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      const patientId = storedUser?.idP;

      if (!patientId) {
        alert("Veuillez vous connecter pour prendre un rendez-vous");
        return;
      }

      const patientInfo = storedUser;
      const rendezvousData = {
        dateRv: formData.dateRv,
        heureRv: formData.heureRv,
        detailsRv: formData.detailsRv || '',
        statutRv: "Planifié",
        patient: { 
          idP: patientId, 
          nomP: patientInfo?.nomP || patientInfo?.name?.split(' ')[0] || "Patient", 
          prenomP: patientInfo?.prenomP || patientInfo?.name?.split(' ')[1] || "Test",
          emailP: patientInfo?.emailP || patientInfo?.email || ""
        },        
        dentiste: {
          idD: parseInt(selectedDentisteId),
          nomD: selectedDentiste?.nomD || "",
          prenomD: selectedDentiste?.prenomD || "",
          emailD: selectedDentiste?.emailD || "",
          specialiteD: selectedDentiste?.specialiteD || ""
        },
        services: selectedServiceIds.map(serviceId => {
          const service = servicesMedicaux.find(s => s.numSM === serviceId);
          return { numSM: serviceId, nomSM: service?.nomSM || "Service" };
        })
      };

      const response = await fetch('http://localhost:8080/dentiste/api/rendezvous/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(rendezvousData)
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Erreur parsing:", parseError);
        throw new Error(`Réponse invalide du serveur: ${responseText}`);
      }

      if (response.ok) {
        setSuccessMessage(`Rendez-vous créé avec succès !`);
        
        setFormData({ dateRv: '', heureRv: '', detailsRv: '', premiereVisite: 'non', defaut: '' });
        setSelectedServiceIds([]);
        setSelectedDentisteId('');
        setSearchTerm('');
        setShowDropdown(false);
        
        if (selectedDentisteId && formData.dateRv) {
          updateTimeSlotsAvailability(selectedDentisteId, formData.dateRv);
        }
        
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(data.error || `Erreur ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error("Erreur création rendez-vous:", error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ dateRv: '', heureRv: '', detailsRv: '', premiereVisite: 'non', defaut: '' });
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

  const TimeSlot = ({ slot, isSelected, onSelect }) => {
    return (
      <div
        className={`time-slot ${slot.isOccupied ? 'occupied' : 'available'} ${isSelected ? 'selected' : ''}`}
        onClick={() => !slot.isOccupied && onSelect(slot.time, slot.available)}
        title={slot.isOccupied ? "Créneau déjà réservé" : "Créneau disponible"}
      >
        <div className="time-display">{slot.time}</div>
        <div className="time-status">
          {slot.isOccupied ? (
            <>
              <i className="bi bi-x-circle-fill"></i>
              <span>Occupé</span>
            </>
          ) : (
            <>
              <i className="bi bi-check-circle-fill"></i>
              <span>Disponible</span>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="rendezvous-page">
        <div className="container text-center py-5">
          <div className="spinner-border text-blue-accent" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-white">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rendezvous-page">
      <div className="container">
        <div className="page-header text-center mb-5">
          <h1 className="display-title">
            <i className="bi bi-calendar-plus me-2"></i>
            Prendre un rendez-vous dentaire
          </h1>
          <p className="page-subtitle">
            Sélectionnez un dentiste et les services médicaux nécessaires
          </p>
        </div>

        {successMessage && (
          <div className="success-message">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
          </div>
        )}

        {errors.submit && (
          <div className="error-message">
            <i className="bi bi-x-circle me-2"></i>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rendezvous-form">
          
          {/* SECTION 1: Recherche dentiste */}
          <div className="form-section" ref={dropdownRef}>
            <label className="section-label">
              <i className="bi bi-search me-2"></i>
              Rechercher et sélectionner votre dentiste *
            </label>
            {errors.dentiste && (
              <div className="error-text">
                <i className="bi bi-exclamation-circle me-1"></i>
                {errors.dentiste}
              </div>
            )}

            <div className="search-dentiste-wrapper">
              <div className="search-input-group">
                <span className="search-icon">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Rechercher un dentiste..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowDropdown(true)}
                />
                {selectedDentisteId && (
                  <button type="button" className="clear-btn" onClick={handleClearSelection}>
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </div>

              {showDropdown && searchTerm && (
                <div className="dentiste-dropdown">
                  <div className="dropdown-header">
                    <small>{filteredDentistes.length} dentiste(s) trouvé(s)</small>
                  </div>
                  <div className="dropdown-list">
                    {filteredDentistes.length === 0 ? (
                      <div className="dropdown-empty">
                        <i className="bi bi-person-x"></i>
                        <p>Aucun dentiste trouvé</p>
                      </div>
                    ) : (
                      filteredDentistes.map(dentiste => (
                        <div 
                          key={dentiste.idD} 
                          className={`dropdown-item ${selectedDentisteId == dentiste.idD ? 'selected' : ''}`}
                          onClick={() => handleSelectDentiste(dentiste)}
                        >
                          <div className="dentiste-dropdown-info">
                            <div className="dentiste-photo-wrapper">
                              <DentistePhoto dentiste={dentiste} size="sm" />
                            </div>
                            <div className="dentiste-details">
                              <div className="dentiste-name">
                                Dr. {dentiste.prenomD} {dentiste.nomD}
                              </div>
                              <div className="dentiste-speciality">
                                <i className="bi bi-award"></i> {dentiste.specialiteD}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedDentiste && (
              <div className="selected-dentiste-display">
                <div className="dentiste-card">
                  <div className="dentiste-card-header">
                    <h6 className="dentiste-card-title">
                      <i className="bi bi-person-check me-2"></i>
                      Dentiste sélectionné
                    </h6>
                  </div>
                  <div className="dentiste-card-body">
                    <div className="dentiste-info-row">
                      <div className="dentiste-photo-col">
                        <DentistePhoto dentiste={selectedDentiste} size="lg" />
                      </div>
                      <div className="dentiste-details-col">
                        <h5 className="dentiste-name-large">
                          Dr. {selectedDentiste.prenomD} {selectedDentiste.nomD}
                        </h5>
                        <p className="dentiste-speciality-large">
                          <i className="bi bi-award"></i> {selectedDentiste.specialiteD}
                        </p>
                        <button type="button" className="change-dentiste-btn" onClick={handleClearSelection}>
                          <i className="bi bi-x-circle me-1"></i> Changer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Date et heure */}
          <div className="form-row">
            <div className="form-col">
              <label className="section-label">
                <i className="bi bi-calendar-date me-2"></i>
                Date souhaitée *
              </label>
              {errors.dateRv && (
                <div className="error-text">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {errors.dateRv}
                </div>
              )}
              <input
                type="date"
                className={`form-input ${errors.dateRv ? 'error' : ''}`}
                name="dateRv"
                value={formData.dateRv}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="form-col">
              <label className="section-label">
                <i className="bi bi-clock me-2"></i>
                Créneaux horaires (8h-18h) *
              </label>
              {errors.heureRv && (
                <div className="error-text">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {errors.heureRv}
                </div>
              )}
              
              {!formData.dateRv || !selectedDentisteId ? (
                <div className="info-alert">
                  <i className="bi bi-info-circle me-2"></i>
                  Sélectionnez d'abord un dentiste et une date
                </div>
              ) : isCheckingAvailability ? (
                <div className="loading-slots">
                  <div className="loading-spinner"></div>
                  Chargement des créneaux...
                </div>
              ) : (
                <>
                  {/* Statistiques */}
                  <div className="time-stats">
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-number success">{stats.available}</div>
                        <div className="stat-label">Disponibles</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-number danger">{stats.occupied}</div>
                        <div className="stat-label">Occupés</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-number primary">{stats.total}</div>
                        <div className="stat-label">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Liste des créneaux */}
                  <div className="time-slots-container">
                    <div className="time-slots-grid">
                      {timeSlots.map(slot => (
                        <TimeSlot
                          key={slot.time}
                          slot={slot}
                          isSelected={formData.heureRv === slot.time}
                          onSelect={handleTimeSelect}
                        />
                      ))}
                    </div>
                    
                    {/* Légende */}
                    <div className="time-legend">
                      <div className="legend-item">
                        <div className="legend-dot available"></div>
                        <span>Disponible</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot occupied"></div>
                        <span>Occupé</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot selected"></div>
                        <span>Sélectionné</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 3: Services médicaux */}
          <div className="form-section">
            <label className="section-label">
              <i className="bi bi-heart-pulse me-2"></i>
              Services médicaux *
            </label>
            {errors.services && (
              <div className="error-text">
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
                    setSelectedServiceIds(prev => 
                      prev.includes(service.numSM)
                        ? prev.filter(id => id !== service.numSM)
                        : [...prev, service.numSM]
                    );
                  }}
                >
                  <div className="service-header">
                    <div className="service-checkbox">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={selectedServiceIds.includes(service.numSM)}
                        onChange={() => {}}
                      />
                    </div>
                    <h6 className="service-title">{service.nomSM}</h6>
                    <span className="service-price">{service.tarifSM} TND</span>
                  </div>
                  <p className="service-description">{service.descriptionSM}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Informations supplémentaires */}
          <div className="form-section">
            <label className="section-label">
              <i className="bi bi-chat-left-text me-2"></i>
              Informations complémentaires
            </label>
            <textarea
              className="form-textarea"
              name="detailsRv"
              value={formData.detailsRv}
              onChange={handleChange}
              rows="3"
              placeholder="Allergies, traitements en cours..."
              maxLength="500"
            />
          </div>

          {/* SECTION 5: Boutons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              <i className="bi bi-x-circle me-2"></i>
              Annuler
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="submit-spinner"></span>
                  En cours...
                </>
              ) : (
                <>
                  <i className="bi bi-calendar-check me-2"></i>
                  Confirmer ({calculateTotal()} TND)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Rendezvous;