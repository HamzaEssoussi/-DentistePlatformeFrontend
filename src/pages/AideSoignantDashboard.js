import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardAideSoignant.css';

const API_BASE_URL = 'http://localhost:8080/dentiste/api';
const FILE_BASE_URL = 'http://localhost:8080/dentiste/api/files';

const AideSoignantDashboard = () => {
  const navigate = useNavigate();
  const [dentiste, setDentiste] = useState(null);
  const [rendezvous, setRendezvous] = useState([]);
  const [patientsMap, setPatientsMap] = useState({}); // Cache pour les patients
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState({});
  const [filter, setFilter] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
    completed: 0
  });

  useEffect(() => {
    const loadDentisteData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!storedUser || storedUser.type !== 'dentiste') {
          navigate('/connexion');
          return;
        }

        const dentisteResponse = await fetch(`${API_BASE_URL}/dentistes/${storedUser.idD}`);
        const dentisteData = await dentisteResponse.json();
        setDentiste(dentisteData);

        await loadRendezvous(dentisteData.idD);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setLoading(false);
      }
    };

    loadDentisteData();
  }, [navigate]);

  const loadRendezvous = async (dentisteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rendezvous/dentiste/${dentisteId}`);
      const data = await response.json();
      
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      const formattedRdv = data.map(rdv => {
        const rdvDate = new Date(rdv.dateRv);
        const isToday = rdv.dateRv === today;
        const isUpcoming = rdvDate > now && rdv.statutRv !== 'Terminé' && rdv.statutRv !== 'Annulé';
        const isCompleted = rdv.statutRv === 'Terminé';
        
        return {
          id: rdv.idRv,
          date: rdv.dateRv,
          heure: rdv.heureRv,
          patientId: rdv.patient?.idP || rdv.idP, // ID du patient
          patient: rdv.patient || null, // Peut être null ou un objet partiel
          details: rdv.detailsRv,
          statut: rdv.statutRv || 'Planifié',
          services: rdv.services || [],
          isToday,
          isUpcoming,
          isCompleted
        };
      });

      formattedRdv.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.heure}`);
        const dateB = new Date(`${b.date}T${b.heure}`);
        return dateA - dateB;
      });

      setRendezvous(formattedRdv);
      
      const todayRdv = formattedRdv.filter(rdv => rdv.isToday && !rdv.isCompleted);
      const upcomingRdv = formattedRdv.filter(rdv => rdv.isUpcoming && !rdv.isToday);
      const completedRdv = formattedRdv.filter(rdv => rdv.isCompleted);
      
      setStats({
        total: formattedRdv.length,
        today: todayRdv.length,
        upcoming: upcomingRdv.length,
        completed: completedRdv.length
      });

      // Charger les informations des patients
      await loadPatientsInfo(formattedRdv);
      
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      setRendezvous([]);
    }
  };

  const loadPatientsInfo = async (appointments) => {
    try {
      const patientIds = [...new Set(appointments
        .map(rdv => rdv.patientId)
        .filter(id => id && !patientsMap[id]))];

      if (patientIds.length === 0) return;

      // Marquer ces patients comme en cours de chargement
      const newLoadingPatients = {};
      patientIds.forEach(id => {
        newLoadingPatients[id] = true;
      });
      setLoadingPatients(prev => ({ ...prev, ...newLoadingPatients }));

      // Charger les informations des patients en parallèle
      const patientPromises = patientIds.map(async (patientId) => {
        try {
          const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
          if (response.ok) {
            const patientData = await response.json();
            return { id: patientId, data: patientData };
          }
          return null;
        } catch (error) {
          console.error(`Erreur chargement patient ${patientId}:`, error);
          return null;
        }
      });

      const patientsResults = await Promise.all(patientPromises);
      
      // Mettre à jour le cache des patients
      const updatedPatientsMap = { ...patientsMap };
      patientsResults.forEach(result => {
        if (result && result.data) {
          updatedPatientsMap[result.id] = result.data;
        }
      });
      setPatientsMap(updatedPatientsMap);

      // Retirer du chargement
      const updatedLoading = { ...loadingPatients };
      patientIds.forEach(id => {
        delete updatedLoading[id];
      });
      setLoadingPatients(updatedLoading);

    } catch (error) {
      console.error('Erreur chargement patients:', error);
    }
  };

  const getPatientInfo = (patientId) => {
    if (!patientId) return null;
    
    // Si le patient est déjà dans le cache
    if (patientsMap[patientId]) {
      return patientsMap[patientId];
    }
    
    // Si le patient n'est pas encore chargé, démarrer le chargement
    if (!loadingPatients[patientId]) {
      setLoadingPatients(prev => ({ ...prev, [patientId]: true }));
      loadPatientInfo(patientId);
    }
    
    return null;
  };

  const loadPatientInfo = async (patientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
      if (response.ok) {
        const patientData = await response.json();
        setPatientsMap(prev => ({ ...prev, [patientId]: patientData }));
      }
    } catch (error) {
      console.error(`Erreur chargement patient ${patientId}:`, error);
    } finally {
      setLoadingPatients(prev => {
        const updated = { ...prev };
        delete updated[patientId];
        return updated;
      });
    }
  };

  const getPhotoUrl = (photoPath, type = 'patient') => {
    if (!photoPath || photoPath.trim() === '') {
      return null;
    }
    
    let url = photoPath.trim();
    url = url.replace(/\\/g, '/').replace(/\/\//g, '/');
    
    if (type === 'patient') {
      if (url.startsWith('/uploads/patients/')) {
        const filename = url.split('/').pop();
        return `${FILE_BASE_URL}/uploads/patients/${filename}`;
      }
      else if (!url.includes('/')) {
        return `${FILE_BASE_URL}/uploads/patients/${url}`;
      }
    } else {
      if (url.startsWith('/uploads/patients/')) {
        const filename = url.split('/').pop();
        return `${FILE_BASE_URL}/uploads/patients/${filename}`;
      }
      else if (!url.includes('/')) {
        return `${FILE_BASE_URL}/uploads/patients/${url}`;
      }
    }
    
    return url;
  };

  const getInitials = (prenom = '', nom = '') => {
    const firstInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
    const lastInitial = nom ? nom.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}` || '??';
  };

  const PhotoDisplay = ({ patientId, prenom, nom, type = 'patient', size = 'md' }) => {
    const [imgError, setImgError] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [patientInfo, setPatientInfo] = useState(null);
    
    useEffect(() => {
      // Si patientId est fourni, chercher les informations
      if (patientId) {
        const info = getPatientInfo(patientId);
        if (info) {
          setPatientInfo(info);
          if (info.photoP) {
            const url = getPhotoUrl(info.photoP, type);
            setPhotoUrl(url);
          }
        }
      } else if (prenom || nom) {
        // Si les infos sont directement fournies
        if (type === 'dentiste' && dentiste?.photoD) {
          const url = getPhotoUrl(dentiste.photoD, type);
          setPhotoUrl(url);
        }
      }
    }, [patientId, prenom, nom, type]);
    
    const sizes = {
      sm: { width: '40px', height: '40px', fontSize: '14px' },
      md: { width: '60px', height: '60px', fontSize: '18px' },
      lg: { width: '80px', height: '80px', fontSize: '24px' },
      xl: { width: '100px', height: '100px', fontSize: '32px' }
    };
    
    const avatarColors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    
    const displayPrenom = patientInfo?.prenomP || prenom || '';
    const displayNom = patientInfo?.nomP || nom || '';
    
    if (!photoUrl || imgError) {
      const avatarStyle = {
        width: sizes[size].width,
        height: sizes[size].height,
        borderRadius: '50%',
        background: avatarColors[(displayPrenom?.length || displayNom?.length || 0) % avatarColors.length],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: sizes[size].fontSize,
        border: '2px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      };
      
      return (
        <div 
          className="avatar-initials"
          style={avatarStyle}
          title={`${displayPrenom} ${displayNom}`}
        >
          {getInitials(displayPrenom, displayNom)}
        </div>
      );
    }
    
    return (
      <div 
        className="photo-container"
        style={{
          width: sizes[size].width,
          height: sizes[size].height,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <img 
          src={photoUrl} 
          alt={`${displayPrenom} ${displayNom}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rendezvous/${appointmentId}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statutRv: newStatus })
      });

      if (response.ok) {
        await loadRendezvous(dentiste.idD);
        setSelectedAppointment(null);
      } else {
        console.error('Erreur mise à jour statut');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    const confirmationMessages = {
      'Confirmé': 'Confirmer ce rendez-vous ?',
      'En cours': 'Marquer ce rendez-vous comme "En cours" ?',
      'Terminé': 'Marquer ce rendez-vous comme "Terminé" ?',
      'Annulé': 'Annuler ce rendez-vous ?'
    };

    if (window.confirm(confirmationMessages[newStatus] || 'Modifier le statut ?')) {
      await updateAppointmentStatus(appointmentId, newStatus);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Planifié': { class: 'status-planned', icon: 'bi-clock' },
      'Confirmé': { class: 'status-confirmed', icon: 'bi-check-circle' },
      'En cours': { class: 'status-inprogress', icon: 'bi-play-circle' },
      'Terminé': { class: 'status-completed', icon: 'bi-check-circle-fill' },
      'Annulé': { class: 'status-cancelled', icon: 'bi-x-circle' }
    };
    
    const statusInfo = statusMap[status] || statusMap['Planifié'];
    
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        <i className={`bi ${statusInfo.icon} me-1`}></i>
        {status}
      </span>
    );
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch(filter) {
      case 'today':
        return rendezvous.filter(rdv => rdv.date === today && rdv.statut !== 'Terminé' && rdv.statut !== 'Annulé');
      case 'upcoming':
        return rendezvous.filter(rdv => {
          const rdvDate = new Date(`${rdv.date}T${rdv.heure}`);
          return rdvDate > now && rdv.date !== today && rdv.statut !== 'Terminé' && rdv.statut !== 'Annulé';
        });
      case 'completed':
        return rendezvous.filter(rdv => rdv.statut === 'Terminé');
      case 'cancelled':
        return rendezvous.filter(rdv => rdv.statut === 'Annulé');
      default:
        return rendezvous;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const AppointmentCard = ({ appointment }) => {
    const patientInfo = getPatientInfo(appointment.patientId);
    const isLoadingPatient = loadingPatients[appointment.patientId];
    
    return (
      <div className="appointment-card">
        <div className="appointment-header">
          <div className="patient-info">
            <PhotoDisplay 
              patientId={appointment.patientId}
              type="patient"
              size="md"
            />
            <div className="patient-details">
              {isLoadingPatient ? (
                <div className="loading-patient">
                  <div className="loading-spinner-small"></div>
                  <span>Chargement des informations...</span>
                </div>
              ) : patientInfo ? (
                <>
                  <h6 className="patient-name">
                    {patientInfo.prenomP} {patientInfo.nomP}
                  </h6>
                  <div className="patient-meta">
                    <span className="patient-email">
                      <i className="bi bi-envelope me-1"></i>
                      {patientInfo.emailP || 'Email non spécifié'}
                    </span>
                    
                  </div>
                </>
              ) : (
                <>
                  <h6 className="patient-name">
                    Patient #{appointment.patientId}
                  </h6>
                  <div className="patient-meta">
                    <span className="patient-email">
                      <i className="bi bi-question-circle me-1"></i>
                      Informations en cours de chargement
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="appointment-meta">
            <div className="appointment-time">
              <i className="bi bi-clock me-1"></i>
              {formatTime(appointment.heure)}
            </div>
            {getStatusBadge(appointment.statut)}
          </div>
        </div>

        <div className="appointment-body">
          {appointment.details && (
            <p className="appointment-notes">
              <i className="bi bi-chat-left-text me-2"></i>
              {appointment.details}
            </p>
          )}
          
          {appointment.services && appointment.services.length > 0 && (
            <div className="services-list">
              <h6><i className="bi bi-clipboard-check me-2"></i>Services :</h6>
              <div className="services-tags">
                {appointment.services.map((service, index) => (
                  <span key={index} className="service-tag">
                    {service.nomSM}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="appointment-actions">
            {appointment.statut !== 'Terminé' && appointment.statut !== 'Annulé' && (
              <>
                {appointment.statut === 'Planifié' && (
                  <button 
                    className="btn-action confirm"
                    
                    onClick={() => handleStatusChange(appointment.id, 'Confirmé')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Confirmer
                  </button>
                )}
                
                {appointment.statut === 'Confirmé' && (
                  <button 
                    className="btn-action inprogress"
                    onClick={() => handleStatusChange(appointment.id, 'En cours')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-play-circle me-1"></i>
                    En cours
                  </button>
                )}
                
                {appointment.statut === 'En cours' && (
                  <button 
                    className="btn-action complete"
                    onClick={() => handleStatusChange(appointment.id, 'Terminé')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Terminer
                  </button>
                )}
                
                {appointment.statut !== 'Annulé' && (
                  <button 
                    className="btn-action cancel"
                    onClick={() => handleStatusChange(appointment.id, 'Annulé')}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Annuler
                  </button>
                )}
              </>
            )}
            
            {(appointment.statut === 'Terminé' || appointment.statut === 'Annulé') && (
              <button 
                className="btn-action details"
                onClick={() => setSelectedAppointment(appointment)}
              >
                <i className="bi bi-eye me-1"></i>
                Détails
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="planning-loading">
        <div className="spinner-glass">
          <div className="spinner-inner"></div>
        </div>
        <p>Chargement du planning...</p>
      </div>
    );
  }

  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="planning-page">
      {/* VIDEO BACKGROUND */}
      <video
        className="video-bg"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/AQMxPJjokH7IiloWaBetcXNXKxbeUhAILtizQ6Vj7M7vKQKj0bmsH1TR2OH5MFudBam2_LQT5Vyo48aIsgymLLBhtJgwKOezNK8kgscsVliVNQ.mp4" type="video/mp4" />
      </video>

      {/* OVERLAY */}
      <div className="video-overlay"></div>

      {/* CONTENU PRINCIPAL */}
      <div className="planning-wrapper">
        {/* SIDEBAR DENTISTE */}
        <div className="dentiste-sidebar">
          <div className="dentiste-profile">
            <PhotoDisplay 
              prenom={dentiste?.prenomD}
              nom={dentiste?.nomD}
              type="dentiste"
              size="xl"
            />
            <h2 className="dentiste-name">
              Dr. {dentiste?.prenomD} {dentiste?.nomD}
            </h2>
            <p className="dentiste-speciality">
              <i className="bi bi-award me-2"></i>
              {dentiste?.specialiteD}
            </p>
            
            <div className="dentiste-contact">
              <div className="contact-item">
                <i className="bi bi-envelope"></i>
                <span>{dentiste?.emailD}</span>
              </div>
              <div className="contact-item">
                <i className="bi bi-phone"></i>
                <span>{dentiste?.telD}</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-primary"
              onClick={() => navigate('/dentiste/publication')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nouvelle publication
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/rendezvous')}
            >
              <i className="bi bi-calendar-plus me-2"></i>
              Ajouter RDV
            </button>
          </div>
        </div>

        {/* CONTENU PLANNING */}
        <div className="planning-content">
          {/* EN-TÊTE */}
          <div className="planning-header">
            <h1>
              <i className="bi bi-calendar-week me-2"></i>
              Planning des rendez-vous
            </h1>
            
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
                onClick={() => setFilter('today')}
              >
                <i className="bi bi-calendar-day me-1"></i>
                Aujourd'hui
              </button>
              <button 
                className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                onClick={() => setFilter('upcoming')}
              >
                <i className="bi bi-calendar-week me-1"></i>
                À venir
              </button>
              <button 
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                <i className="bi bi-check-circle me-1"></i>
                Terminés
              </button>
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                <i className="bi bi-calendar3 me-1"></i>
                Tous
              </button>
            </div>
          </div>

          {/* STATISTIQUES */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total RDV</div>
              </div>
            </div>
            
            <div className="stat-card today">
              <div className="stat-icon">
                <i className="bi bi-calendar-day"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.today}</div>
                <div className="stat-label">Aujourd'hui</div>
              </div>
            </div>
            
            <div className="stat-card upcoming">
              <div className="stat-icon">
                <i className="bi bi-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.upcoming}</div>
                <div className="stat-label">À venir</div>
              </div>
            </div>
            
            <div className="stat-card completed">
              <div className="stat-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Terminés</div>
              </div>
            </div>
          </div>

          {/* LISTE DES RENDEZ-VOUS */}
          <div className="appointments-list">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="bi bi-calendar-x"></i>
                </div>
                <h3>Aucun rendez-vous</h3>
                <p>Aucun rendez-vous trouvé pour ce filtre</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/rendezvous')}
                >
                  <i className="bi bi-calendar-plus me-2"></i>
                  Prendre un rendez-vous
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AideSoignantDashboard;