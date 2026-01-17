import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardAideSoignant.css';

const API_BASE_URL = 'http://localhost:8080/dentiste/api';
const FILE_BASE_URL = 'http://localhost:8080/dentiste/api/files';

const AideSoignantDashboard = () => {
  const navigate = useNavigate();
  const [dentiste, setDentiste] = useState(null);
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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

        // Charger le dentiste
        const dentisteResponse = await fetch(`${API_BASE_URL}/dentistes/${storedUser.idD}`);
        const dentisteData = await dentisteResponse.json();
        setDentiste(dentisteData);

        // Charger les rendez-vous AVEC les informations patients
        await loadRendezvousWithPatients(dentisteData.idD);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setLoading(false);
      }
    };

    loadDentisteData();
  }, [navigate]);

  // FONCTION AMÉLIORÉE : Charger les rendez-vous et les patients en même temps
  const loadRendezvousWithPatients = async (dentisteId) => {
    try {
      console.log("Chargement des rendez-vous pour dentiste:", dentisteId);
      
      // 1. Charger tous les rendez-vous
      const rdvResponse = await fetch(`${API_BASE_URL}/rendezvous/dentiste/${dentisteId}`);
      const rdvData = await rdvResponse.json();
      console.log("Rendez-vous bruts:", rdvData);

      if (!rdvData || rdvData.length === 0) {
        setRendezvous([]);
        setStats({ total: 0, today: 0, upcoming: 0, completed: 0 });
        return;
      }

      // 2. Récupérer tous les IDs de patients uniques
      const patientIds = [...new Set(rdvData.map(rdv => rdv.idP).filter(id => id))];
      console.log("IDs patients uniques:", patientIds);

      // 3. Charger TOUS les patients en une seule requête
      const patientsMap = {};
      if (patientIds.length > 0) {
        try {
          // Essayer de charger tous les patients d'un coup
          const allPatientsResponse = await fetch(`${API_BASE_URL}/patients`);
          if (allPatientsResponse.ok) {
            const allPatients = await allPatientsResponse.json();
            allPatients.forEach(patient => {
              patientsMap[patient.idP] = patient;
            });
            console.log("Tous les patients chargés:", Object.keys(patientsMap).length);
          }
        } catch (error) {
          console.error("Erreur chargement batch patients:", error);
        }
        
        // Si certains patients manquent, les charger individuellement
        const missingPatientIds = patientIds.filter(id => !patientsMap[id]);
        if (missingPatientIds.length > 0) {
          console.log("Chargement individuel des patients manquants:", missingPatientIds);
          const patientPromises = missingPatientIds.map(async (patientId) => {
            try {
              const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
              if (response.ok) {
                const patientData = await response.json();
                return { id: patientId, data: patientData };
              }
            } catch (error) {
              console.error(`Erreur patient ${patientId}:`, error);
            }
            return null;
          });

          const patientResults = await Promise.all(patientPromises);
          patientResults.forEach(result => {
            if (result && result.data) {
              patientsMap[result.id] = result.data;
            }
          });
        }
      }

      // 4. Formatter les rendez-vous avec les informations des patients
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      const formattedRdv = rdvData.map(rdv => {
        const rdvDate = new Date(rdv.dateRv);
        const isToday = rdv.dateRv === today;
        const isUpcoming = rdvDate > now && rdv.statutRv !== 'Terminé' && rdv.statutRv !== 'Annulé';
        const isCompleted = rdv.statutRv === 'Terminé';
        
        // Récupérer le patient depuis la map
        const patientInfo = rdv.idP ? patientsMap[rdv.idP] : null;
        
        return {
          id: rdv.idRv,
          date: rdv.dateRv,
          heure: rdv.heureRv,
          patientId: rdv.idP,
          patient: patientInfo, // Informations du patient
          details: rdv.detailsRv,
          statut: rdv.statutRv || 'Planifié',
          services: rdv.services || [],
          dentiste: rdv.dentiste,
          isToday,
          isUpcoming,
          isCompleted
        };
      });

      // Trier par date
      formattedRdv.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.heure}`);
        const dateB = new Date(`${b.date}T${b.heure}`);
        return dateA - dateB;
      });

      console.log("Rendez-vous formatés avec patients:", formattedRdv);
      setRendezvous(formattedRdv);
      
      // Calculer les statistiques
      const todayRdv = formattedRdv.filter(rdv => rdv.isToday && !rdv.isCompleted);
      const upcomingRdv = formattedRdv.filter(rdv => rdv.isUpcoming && !rdv.isToday);
      const completedRdv = formattedRdv.filter(rdv => rdv.isCompleted);
      
      setStats({
        total: formattedRdv.length,
        today: todayRdv.length,
        upcoming: upcomingRdv.length,
        completed: completedRdv.length
      });
      
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      setRendezvous([]);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    setIsUpdating(true);
    try {
      const endpoint = newStatus === 'Annulé' 
        ? `${API_BASE_URL}/rendezvous/${appointmentId}/annuler`
        : newStatus === 'Terminé'
          ? `${API_BASE_URL}/rendezvous/${appointmentId}/terminer`
          : newStatus === 'Confirmé'
            ? `${API_BASE_URL}/rendezvous/${appointmentId}/confirmer`
            : `${API_BASE_URL}/rendezvous/${appointmentId}/statut`;

      const method = newStatus === 'Annulé' || newStatus === 'Terminé' || newStatus === 'Confirmé'
        ? 'POST'
        : 'PUT';

      const body = newStatus === 'Annulé' || newStatus === 'Terminé' || newStatus === 'Confirmé'
        ? null
        : JSON.stringify({ statutRv: newStatus });

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(body && { body })
      });

      if (response.ok) {
        await loadRendezvousWithPatients(dentiste.idD);
      } else {
        console.error('Erreur mise à jour statut');
        alert('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur réseau');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const appointmentToDelete = rendezvous.find(rdv => rdv.id === appointmentId);
    
    if (!appointmentToDelete) return;
    
    const patientInfo = appointmentToDelete.patient;
    const patientName = patientInfo 
      ? `${patientInfo.prenomP} ${patientInfo.nomP}`
      : `Patient #${appointmentToDelete.patientId}`;
    
    const confirmationMessage = `Êtes-vous sûr de vouloir supprimer ce rendez-vous ?
    
Patient : ${patientName}
Date : ${formatSimpleDate(appointmentToDelete.date)}
Heure : ${formatTime(appointmentToDelete.heure)}
Dentiste : Dr. ${dentiste?.prenomD} ${dentiste?.nomD}

Cette action supprimera définitivement le rendez-vous.`;
    
    if (!window.confirm(confirmationMessage)) {
      return;
    }
    
    setDeletingId(appointmentId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/rendezvous/${appointmentId}/annuler`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadRendezvousWithPatients(dentiste.idD);
        alert(`Rendez-vous du ${formatSimpleDate(appointmentToDelete.date)} a été supprimé avec succès.`);
      } else {
        alert("Erreur lors de la suppression du rendez-vous");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression du rendez-vous");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (newStatus === 'Annulé') {
      await handleCancelAppointment(appointmentId);
      return;
    }

    const confirmationMessages = {
      'Confirmé': 'Confirmer ce rendez-vous ?',
      'En cours': 'Marquer ce rendez-vous comme "En cours" ?',
      'Terminé': 'Marquer ce rendez-vous comme "Terminé" ?'
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

  const formatSimpleDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
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

  const PhotoDisplay = ({ patient, type = 'patient', size = 'md' }) => {
    const [imgError, setImgError] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(null);

    useEffect(() => {
      let photoPath = null;
      
      if (type === 'patient' && patient?.photoP) {
        photoPath = patient.photoP;
      } else if (type === 'dentiste' && dentiste?.photoD) {
        photoPath = dentiste.photoD;
      }

      if (photoPath) {
        const url = getPhotoUrl(photoPath, type);
        setPhotoUrl(url);
      } else {
        setPhotoUrl(null);
      }
    }, [patient, type, dentiste]);

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

    const displayPrenom = patient?.prenomP || dentiste?.prenomD || '';
    const displayNom = patient?.nomP || dentiste?.nomD || '';

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

  const AppointmentCard = ({ appointment }) => {
    const patientInfo = appointment.patient;
    
    return (
      <div className="appointment-card">
      
    
        <div className="appointment-header">
          <div className="patient-info">
            <PhotoDisplay 
              patient={patientInfo}
              type="patient"
              size="md"
            />
            <div className="patient-details">
              {patientInfo ? (
                <>
                  <h6 className="patient-name">
                    {patientInfo.prenomP} {patientInfo.nomP}
                  </h6>
                  <div className="patient-meta">
                    <span className="patient-email">
                      <i className="bi bi-envelope me-1"></i>
                      {patientInfo.emailP || 'Email non spécifié'}
                    </span>
                    <span className="patient-phone">
                      <i className="bi bi-telephone me-1"></i>
                      {patientInfo.telP || 'Téléphone non spécifié'}
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
                      Informations du patient non disponibles
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="appointment-meta">
            <div className="appointment-time">
              <i className="bi bi-calendar me-1"></i>
              {formatSimpleDate(appointment.date)}
            </div>
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
                
                <button 
                  className="btn-action cancel"
                  onClick={() => handleStatusChange(appointment.id, 'Annulé')}
                  disabled={deletingId === appointment.id}
                >
                  {deletingId === appointment.id ? (
                    <>
                      <span className="spinner spinner-sm me-1"></span>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle me-1"></i>
                      Annuler
                    </>
                  )}
                </button>
              </>
            )}
            
            {(appointment.statut === 'Terminé' || appointment.statut === 'Annulé') && (
              <button 
                className="btn-action details"
                onClick={() => console.log("Voir détails:", appointment)}
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
        {/* SIDEBAR DENTISTE AVEC LES DEUX NOUVEAUX BOUTONS */}
        <div className="dentiste-sidebar">
          <div className="dentiste-profile">
            <PhotoDisplay 
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

          {/* BOUTONS D'ACTION */}
          <div className="action-buttons">
            <button 
              className="btn-primary"
              onClick={() => navigate('/publication')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nouvelle publication
            </button>
            
            {/* NOUVEAU BOUTON - AJOUTER UN SERVICE */}
            <button 
              className="btn-primary"
              onClick={() => navigate('/service')}
            >
              <i className="bi bi-plus-square me-2"></i>
              Ajouter un service
            </button>
            
            {/* NOUVEAU BOUTON - AJOUTER UN RENDEZ-VOUS */}
            <button 
              className="btn-primary"
              onClick={() => navigate('/rendezvous')}
            >
              <i className="bi bi-calendar-plus me-2"></i>
              Ajouter un RDV
            </button>
            
            <button 
              className="btn-secondary"
              onClick={() => navigate('/patient')}
            >
              <i className="bi bi-people me-2"></i>
              Voir mes patients
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
                className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setFilter('cancelled')}
              >
                <i className="bi bi-x-circle me-1"></i>
                Annulés
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