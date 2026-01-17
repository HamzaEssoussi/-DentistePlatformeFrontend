// pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; // Changé de Dashboard.css à Patient.css

const API_BASE_URL = 'http://localhost:8080/dentiste/api';
const FILE_BASE_URL = 'http://localhost:8080/dentiste/api/files';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [publications, setPublications] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0
  });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        
        if (!isAuthenticated || !storedUser || storedUser.type !== 'patient') {
          navigate('/connexion');
          return;
        }
        
        console.log("Utilisateur connecté:", storedUser);
        
        // Récupérer les informations complètes du patient
        if (storedUser.idP) {
          try {
            const patientResponse = await axios.get(`${API_BASE_URL}/patients/${storedUser.idP}`);
            const patientData = patientResponse.data;
            
            console.log(" Données patient reçues:", patientData);
            
            // Mettre à jour le stockage local
            const updatedUser = {
              ...storedUser,
              ...patientData,
              type: 'patient'
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setPatientInfo(patientData);
            setUser(updatedUser);
          } catch (patientError) {
            console.error("Erreur chargement patient:", patientError);
            setPatientInfo(storedUser);
          }
        }
        
        // Charger les rendez-vous
        await loadAppointments(storedUser.idP);
        
        // Charger les publications
        await loadPublications();
        
        setLoading(false);
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [navigate]);

  const loadAppointments = async (patientId) => {
    try {
      const appointmentsResponse = await axios.get(`${API_BASE_URL}/rendezvous/patient/${patientId}`);
      const appointmentsData = appointmentsResponse.data || [];
      
      console.log("Rendez-vous reçus:", appointmentsData);
      
      const formattedAppointments = appointmentsData.map(rdv => {
        // Récupérer les détails complets pour le nouveau design
        const dentiste = rdv.dentiste || {};
        const services = rdv.services || [];
        
        return {
          id: rdv.idRv || rdv.rendezvousId,
          date: rdv.dateRv,
          heure: rdv.heureRv,
          dentisteNom: `Dr. ${dentiste.prenomD || ''} ${dentiste.nomD || 'Dentiste'}`,
          dentisteSpecialite: dentiste.specialiteD || 'Dentiste généraliste',
          dentistePhoto: dentiste.photoD,
          type: services.map(s => s.nomSM).join(', ') || 'Consultation',
          status: getStatusText(rdv.statutRv),
          details: rdv.detailsRv,
          heureRV: rdv.heureRv,
          servicesList: services,
          dentisteEmail: dentiste.emailD,
          dentisteTelephone: dentiste.telephoneD
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAppointments(formattedAppointments);
      
      const upcoming = formattedAppointments.filter(app => 
        app.status === 'en_attente' || app.status === 'confirmé'
      ).length;
      
      const completed = formattedAppointments.filter(app => 
        app.status === 'terminé'
      ).length;
      
      setStats({
        totalAppointments: formattedAppointments.length,
        upcomingAppointments: upcoming,
        completedAppointments: completed
      });
      
    } catch (appointmentsError) {
      console.error("Erreur chargement rendez-vous:", appointmentsError);
      setAppointments([]);
    }
  };

  const loadPublications = async () => {
    try {
      const publicationsResponse = await axios.get(`${API_BASE_URL}/publications`);
      const publicationsData = publicationsResponse.data || [];
      
      const formattedPublications = publicationsData.map(pub => ({
        id: pub.idPublication,
        title: pub.titrePublication,
        content: pub.contenuPublication,
        date: pub.datePublication,
        auteur: `Dr. ${pub.auteur?.prenom || ''} ${pub.auteur?.nom || ''}`,
        categorie: pub.categorie
      })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
      
      setPublications(formattedPublications);
      
    } catch (publicationsError) {
      console.error("Erreur chargement publications:", publicationsError);
      setPublications([]);
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'en_attente';
    
    switch(status.toLowerCase()) {
      case 'planifié':
      case 'en_attente':
        return 'en_attente';
      case 'confirmé':
        return 'confirmé';
      case 'annulé':
        return 'annulé';
      case 'terminé':
        return 'terminé';
      default:
        return 'en_attente';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/connexion');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
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

  const getStatusBadge = (status) => {
    const statusClasses = {
      'confirmé': 'status-confirmed',
      'en_attente': 'status-planned',
      'annulé': 'status-cancelled',
      'terminé': 'status-completed'
    };
    
    const statusText = {
      'confirmé': 'Confirmé',
      'en_attente': 'Planifié',
      'annulé': 'Annulé',
      'terminé': 'Terminé'
    };
    
    const className = statusClasses[status] || 'status-planned';
    const text = statusText[status] || status;
    
    return <span className={`status-badge ${className}`}>{text}</span>;
  };

  const handleCancelAppointment = async (appointmentId) => {
    const appointmentToDelete = appointments.find(app => app.id === appointmentId);
    
    if (!appointmentToDelete) return;
    
    const confirmationMessage = `Êtes-vous sûr de vouloir supprimer ce rendez-vous ?
    
Date : ${formatSimpleDate(appointmentToDelete.date)}
Dentiste : ${appointmentToDelete.dentisteNom}
Service : ${appointmentToDelete.type}

Cette action supprimera définitivement le rendez-vous.`;
    
    if (!window.confirm(confirmationMessage)) {
      return;
    }
    
    setDeletingId(appointmentId);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/rendezvous/${appointmentId}/annuler`);
      
      if (response.status === 200) {
        setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        
        const wasUpcoming = appointmentToDelete.status === 'confirmé' || 
                           appointmentToDelete.status === 'en_attente';
        
        setStats(prev => ({
          ...prev,
          totalAppointments: prev.totalAppointments - 1,
          upcomingAppointments: wasUpcoming ? prev.upcomingAppointments - 1 : prev.upcomingAppointments
        }));
        
        alert(`Rendez-vous du ${formatSimpleDate(appointmentToDelete.date)} a été supprimé avec succès.`);
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression du rendez-vous");
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = () => {
    if (!patientInfo) return '??';
    const firstInitial = patientInfo.prenomP ? patientInfo.prenomP.charAt(0).toUpperCase() : '';
    const lastInitial = patientInfo.nomP ? patientInfo.nomP.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath || photoPath.trim() === '') {
      return null;
    }
    
    let url = photoPath.trim();
    url = url.replace(/\\/g, '/').replace(/\/\//g, '/');
    
    if (url.startsWith('/uploads/patients/')) {
      const filename = url.split('/').pop();
      return `${FILE_BASE_URL}/uploads/patients/${filename}`;
    }
    else if (!url.includes('/')) {
      return `${FILE_BASE_URL}/uploads/patients/${url}`;
    }
    else if (url.startsWith('http')) {
      return url;
    }
    else {
      return `${FILE_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
    }
  };

  const PhotoDisplay = ({ size = 'large', className = '', type = 'patient' }) => {
    const [imgError, setImgError] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(null);
    
    useEffect(() => {
      if (type === 'patient' && patientInfo?.photoP) {
        const url = getPhotoUrl(patientInfo.photoP);
        setPhotoUrl(url);
      } else if (type === 'dentiste') {
        // Pour les dentistes dans les rendez-vous
        const dentiste = appointments.find(a => a.dentistePhoto)?.dentistePhoto;
        if (dentiste) {
          const url = dentiste.startsWith('/uploads/dentistes/') 
            ? `${FILE_BASE_URL}${dentiste}`
            : dentiste;
          setPhotoUrl(url);
        }
      }
    }, [patientInfo?.photoP, type, appointments]);
    
    if (!photoUrl || imgError) {
      const isLarge = size === 'large';
      const initials = type === 'patient' ? getInitials() : 'DR';
      const initialsClass = isLarge ? 'patient-initials-large' : 'patient-initials-small';
      const gradient = type === 'patient' 
        ? 'var(--purple-gradient)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      
      return (
        <div 
          className={`${initialsClass} ${className}`}
          style={{ background: gradient }}
          title={type === 'patient' ? `${patientInfo?.prenomP} ${patientInfo?.nomP}` : 'Dentiste'}
        >
          {initials}
        </div>
      );
    }
    
    const isLarge = size === 'large';
    const containerClass = isLarge ? 'patient-photo-large' : 'patient-photo-small';
    
    return (
      <div className={`${containerClass} ${className}`}>
        <img 
          src={photoUrl} 
          alt={type === 'patient' ? `${patientInfo?.prenomP} ${patientInfo?.nomP}` : 'Dentiste'}
          onError={() => setImgError(true)}
          onLoad={() => console.log(`Photo chargée avec succès (${size})!`)}
          title={type === 'patient' ? `${patientInfo?.prenomP} ${patientInfo?.nomP}` : 'Dentiste'}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="patient-loading">
        <div className="spinner-glass">
          <div className="spinner-inner"></div>
        </div>
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="patient-page">
      {/* Video Background - Optionnel */}
      <video className="video-bg" autoPlay muted loop>
        <source src="/videos/dental-bg.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      {/* Background Image */}
      <div 
        className="publication-bg"
        style={{
          backgroundImage: `url('dentists-dental-office-male-female-600nw-2482836585.webp')`
        }}
      ></div>

      {/* WRAPPER GLASS - NOUVELLE STRUCTURE */}
      <div className="patient-wrapper">
        
        {/* SIDEBAR PATIENT */}
        <div className="patient-sidebar">
          <div className="patient-profile">
            <PhotoDisplay size="large" type="patient" />
            <h2 className="patient-name">{patientInfo?.prenomP} {patientInfo?.nomP}</h2>
            <div className="patient-info">
              <span>Patient</span>
              <span>Inscrit depuis: {patientInfo?.dateInscription 
                ? new Date(patientInfo.dateInscription).toLocaleDateString('fr-FR')
                : 'Date inconnue'}
              </span>
            </div>
          </div>

          <div className="patient-contact">
            <div className="contact-item">
              <i className="bi bi-envelope"></i>
              <span>{patientInfo?.emailP || 'Non spécifié'}</span>
            </div>
            
            <div className="contact-item">
              <i className="bi bi-calendar"></i>
              <span>Né le: {patientInfo?.dateNP 
                ? new Date(patientInfo.dateNP).toLocaleDateString('fr-FR')
                : 'Non spécifié'}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={() => navigate('/rendezvous')}>
              <i className="bi bi-calendar-plus me-2"></i>
              Nouveau RDV
            </button>
            <button className="btn-secondary" onClick={() => navigate('/patient/edit')}>
              <i className="bi bi-pencil me-2"></i>
              Modifier Profil
            </button>
            <button className="btn-secondary" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Déconnexion
            </button>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="patient-content">
          {/* En-tête */}
          <div className="patient-header">
            <h1>
              <i className="bi bi-speedometer2 me-2"></i>
              Mon Tableau de Bord
            </h1>
          </div>

          {/* Statistiques */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalAppointments}</div>
                <div className="stat-label">Total RDV</div>
              </div>
            </div>
            
            <div className="stat-card upcoming">
              <div className="stat-icon">
                <i className="bi bi-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.upcomingAppointments}</div>
                <div className="stat-label">RDV à venir</div>
              </div>
            </div>
            
            <div className="stat-card completed">
              <div className="stat-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completedAppointments}</div>
                <div className="stat-label">RDV terminés</div>
              </div>
            </div>
          </div>

          {/* Section Rendez-vous */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <i className="bi bi-calendar-check me-2"></i>
                Mes Rendez-vous
              </h3>
              <button className="btn-action details" onClick={() => navigate('/rendezvous')}>
                <i className="bi bi-plus-circle me-2"></i>
                Prendre RDV
              </button>
            </div>

            <div className="appointments-list">
              {appointments.length > 0 ? (
                appointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="dentiste-info">
                        <PhotoDisplay size="small" type="dentiste" />
                        <div className="dentiste-details">
                          <h4 className="dentiste-name">{appointment.dentisteNom}</h4>
                          <div className="dentiste-meta">
                            <span className="dentiste-speciality">
                              <i className="bi bi-briefcase me-1"></i>
                              {appointment.dentisteSpecialite}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="appointment-meta">
                        <div className="appointment-time">
                          <i className="bi bi-clock me-2"></i>
                          {appointment.heureRV} - {formatSimpleDate(appointment.date)}
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>

                    <div className="appointment-body">
                      {appointment.details && (
                        <div className="appointment-notes">
                          <i className="bi bi-chat-left-text me-2"></i>
                          <span>{appointment.details}</span>
                        </div>
                      )}

                      {appointment.servicesList && appointment.servicesList.length > 0 && (
                        <div className="services-list">
                          <h6><i className="bi bi-list-task me-2"></i>Services</h6>
                          <div className="services-tags">
                            {appointment.servicesList.map((service, index) => (
                              <span key={index} className="service-tag">
                                {service.nomSM}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(appointment.status === 'en_attente' || appointment.status === 'confirmé') && (
                        <div className="appointment-actions">
                          <button 
                            className="btn-action cancel"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={deletingId === appointment.id}
                          >
                            {deletingId === appointment.id ? (
                              <>
                                <span className="spinner-inner spinner-sm me-2"></span>
                                Annulation...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-x-circle me-2"></i>
                                Annuler RDV
                              </>
                            )}
                          </button>
                          
                          <button className="btn-action details">
                            <i className="bi bi-info-circle me-2"></i>
                            Détails
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="bi bi-calendar-x empty-icon"></i>
                  <h3>Aucun rendez-vous prévu</h3>
                  <p>Prenez votre premier rendez-vous dès maintenant</p>
                  <button className="btn-primary" onClick={() => navigate('/rendezvous')}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Prendre rendez-vous
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section Informations Personnelles */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <i className="bi bi-person-circle me-2"></i>
                Mes Informations Personnelles
              </h3>
              <button className="btn-action details" onClick={() => navigate('/patient/edit')}>
                <i className="bi bi-pencil me-2"></i>
                Modifier
              </button>
            </div>

            <div className="info-grid-glass">
              <div className="info-item-glass">
                <h6>Nom complet</h6>
                <p>{patientInfo?.nomP || 'Non spécifié'} {patientInfo?.prenomP || ''}</p>
              </div>
              
              <div className="info-item-glass">
                <h6>Email</h6>
                <p>{patientInfo?.emailP || 'Non spécifié'}</p>
              </div>
              
              <div className="info-item-glass">
                <h6>Date de naissance</h6>
                <p>
                  {patientInfo?.dateNP
                    ? new Date(patientInfo.dateNP).toLocaleDateString('fr-FR')
                    : 'Non spécifié'
                  }
                </p>
              </div>
              
              <div className="info-item-glass">
                <h6>Groupe sanguin</h6>
                <p>{patientInfo?.groupeSanguinP || 'Non spécifié'}</p>
              </div>
              
              <div className="info-item-glass">
                <h6>Sexe</h6>
                <p>
                  {patientInfo?.sexeP === 'M' ? 'Masculin' : 
                   patientInfo?.sexeP === 'F' ? 'Féminin' : 'Non spécifié'}
                </p>
              </div>
              
              
      
              
              
            </div>
            
            
          </div>

          {/* Section Actualités */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <i className="bi bi-newspaper me-2"></i>
                Dernières Actualités
              </h3>
              <button className="btn-action details" onClick={() => navigate('/publication')}>
                <i className="bi bi-eye me-2"></i>
                Voir tout
              </button>
            </div>

            <div className="publications-list">
              {publications.length > 0 ? (
                publications.map((publication) => (
                  <div key={publication.id} className="publication-item">
                    <div className="publication-header">
                      <h6 className="publication-title">{publication.title}</h6>
                      {publication.categorie && (
                        <span className="tag">{publication.categorie}</span>
                      )}
                    </div>
                    
                    <p className="publication-content">
                      {publication.content && publication.content.length > 120 
                        ? `${publication.content.substring(0, 120)}...`
                        : publication.content || 'Pas de contenu'}
                    </p>
                    
                    <div className="publication-footer">
                      <small className="publication-author">
                        <i className="bi bi-person me-1"></i>
                        {publication.auteur || 'Auteur inconnu'}
                      </small>
                      <small className="publication-date">
                        <i className="bi bi-calendar me-1"></i>
                        {formatSimpleDate(publication.date)}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="bi bi-newspaper empty-icon"></i>
                  <p>Aucune publication disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;