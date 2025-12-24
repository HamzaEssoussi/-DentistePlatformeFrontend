// pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

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
      
      const formattedAppointments = appointmentsData.map(rdv => ({
        id: rdv.idRv || rdv.rendezvousId,
        date: rdv.dateRv,
        heure: rdv.heureRv,
        dentiste: `Dr. ${rdv.dentiste?.prenomD || ''} ${rdv.dentiste?.nomD || 'Dentiste'}`,
        type: rdv.services?.map(s => s.nomSM).join(', ') || 'Consultation',
        status: getStatusText(rdv.statutRv),
        details: rdv.detailsRv,
        heureRV: rdv.heureRv,
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      
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
    switch(status) {
      case 'confirmé':
        return <span className="badge badge-custom bg-success">Confirmé</span>;
      case 'en_attente':
        return <span className="badge badge-custom bg-warning">En attente</span>;
      case 'annulé':
        return <span className="badge badge-custom bg-danger">Annulé</span>;
      case 'terminé':
        return <span className="badge badge-custom bg-info">Terminé</span>;
      default:
        return <span className="badge badge-custom bg-secondary">{status}</span>;
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const appointmentToDelete = appointments.find(app => app.id === appointmentId);
    
    if (!appointmentToDelete) return;
    
    const confirmationMessage = `Êtes-vous sûr de vouloir supprimer ce rendez-vous ?
    
Date : ${formatSimpleDate(appointmentToDelete.date)}
Dentiste : ${appointmentToDelete.dentiste}
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

  const PhotoDisplay = ({ size = 'large', className = '' }) => {
    const [imgError, setImgError] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(null);
    
    useEffect(() => {
      if (patientInfo?.photoP) {
        const url = getPhotoUrl(patientInfo.photoP);
        setPhotoUrl(url);
      } else {
        setPhotoUrl(null);
      }
    }, [patientInfo?.photoP]);
    
    if (!photoUrl || imgError) {
      const isLarge = size === 'large';
      const initialsClass = isLarge ? 'patient-initials-large' : 'patient-initials-small';
      
      return (
        <div 
          className={`${initialsClass} ${className}`}
          title={patientInfo ? `${patientInfo.prenomP} ${patientInfo.nomP}` : ''}
        >
          {getInitials()}
        </div>
      );
    }
    
    const isLarge = size === 'large';
    const containerClass = isLarge ? 'patient-photo-large' : 'patient-photo-small';
    
    return (
      <div className={`${containerClass} ${className}`}>
        <img 
          src={photoUrl} 
          alt={`${patientInfo?.prenomP} ${patientInfo?.nomP}`}
          onError={() => setImgError(true)}
          onLoad={() => console.log(`Photo chargée avec succès (${size})!`)}
          title={patientInfo ? `${patientInfo.prenomP} ${patientInfo.nomP}` : ''}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-glass">
      {/* Navigation Glass */}
      <nav className="navbar-glass">
        <div className="navbar-container">
          <Link to="/" className="logo-text">
            Mes Informations et mes rendez-vous
          </Link>
          
          <div className="navbar-user">
            <div className="user-info-glass">
              <PhotoDisplay size="small" />
              <div className="user-details">
                <div className="user-name">{patientInfo?.prenomP} {patientInfo?.nomP}</div>
                <small className="user-role">Patient</small>
              </div>
            </div>
            
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="container-glass">
          {/* En-tête avec photo */}
          <div className="welcome-card">
            <div className="welcome-content">
              <PhotoDisplay size="large" />
              
              <div className="welcome-text">
                <h1 className="welcome-title">
                  <i className="bi bi-emoji-smile me-2"></i>
                  Bienvenue, {patientInfo?.prenomP || 'Patient'} !
                </h1>
                <p className="welcome-subtitle">
                  Gérez facilement vos rendez-vous dentaires et consultez vos informations personnelles.
                </p>
                
                <div className="welcome-actions">
                  <Link to="/rendezvous" className="btn-glass-primary">
                    <i className="bi bi-calendar-plus me-2"></i>
                    Prendre un rendez-vous
                  </Link>
                  <Link to="/patient/edit" className="btn-glass-outline">
                    <i className="bi bi-pencil me-2"></i>
                    Modifier mon profil
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="stats-grid-glass">
            <div className="stat-card-glass total">
              <div className="stat-icon">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalAppointments}</div>
                <div className="stat-label">Total RDV</div>
              </div>
            </div>
            
            <div className="stat-card-glass upcoming">
              <div className="stat-icon">
                <i className="bi bi-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.upcomingAppointments}</div>
                <div className="stat-label">RDV à venir</div>
              </div>
            </div>
            
            <div className="stat-card-glass completed">
              <div className="stat-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completedAppointments}</div>
                <div className="stat-label">RDV terminés</div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Rendez-vous */}
            <div className="dashboard-column">
              <div className="section-card-glass">
                <div className="section-header-glass">
                  <h3 className="section-title-glass">
                    <i className="bi bi-calendar-check me-2"></i>
                    Mes Rendez-vous
                  </h3>
                </div>
                
                <div className="section-body">
                  {appointments.length > 0 ? (
                    <div className="appointments-list">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="appointment-item-glass">
                          <div className="appointment-header">
                            <h6 className="appointment-type">
                              {appointment.type}
                            </h6>
                            {getStatusBadge(appointment.status)}
                          </div>
                          
                          <div className="appointment-details">
                            <div className="detail-item">
                              <i className="bi bi-person"></i>
                              <span>{appointment.dentiste}</span>
                            </div>
                            <div className="detail-item">
                              <i className="bi bi-calendar"></i>
                              <span>{formatSimpleDate(appointment.date)}</span>
                            </div>
                            <div className="detail-item">
                              <i className="bi bi-clock"></i>
                              <span>{appointment.heureRV || 'Non spécifié'}</span>
                            </div>
                          </div>
                          
                          {appointment.details && (
                            <p className="appointment-note">
                              <i className="bi bi-chat-left-text me-1"></i>
                              {appointment.details}
                            </p>
                          )}
                          
                          {(appointment.status === 'en_attente' || appointment.status === 'confirmé') && (
                            <div className="appointment-actions">
                              <button 
                                className="btn-glass-danger"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                disabled={deletingId === appointment.id}
                              >
                                {deletingId === appointment.id ? (
                                  <>
                                    <span className="spinner spinner-sm me-2"></span>
                                    Annulation...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-x-circle me-2"></i>
                                    Annuler RDV
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <i className="bi bi-calendar-x"></i>
                      <h5>Aucun rendez-vous prévu</h5>
                      <p>Prenez votre premier rendez-vous dès maintenant</p>
                      <Link to="/rendezvous" className="btn-glass-primary">
                        <i className="bi bi-plus-circle me-2"></i>
                        Prendre rendez-vous
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Publications */}
            <div className="dashboard-column">
              <div className="section-card-glass">
                <div className="section-header-glass">
                  <h3 className="section-title-glass">
                    <i className="bi bi-newspaper me-2"></i>
                    Dernières Actualités
                  </h3>
                </div>
                
                <div className="section-body">
                  {publications.length > 0 ? (
                    <div className="publications-list">
                      {publications.map((publication) => (
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
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <i className="bi bi-newspaper"></i>
                      <p>Aucune publication disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informations patient */}
          <div className="section-card-glass">
            <div className="section-header-glass">
              <h3 className="section-title-glass">
                <i className="bi bi-person-circle me-2"></i>
                Mes Informations Personnelles
              </h3>
              <Link to="/patient/edit" className="btn-glass-outline">
                <i className="bi bi-pencil me-2"></i>
                Modifier
              </Link>
            </div>
            
            <div className="section-body">
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
                
                <div className="info-item-glass">
                  <h6>Recouvrement</h6>
                  <p>{patientInfo?.RecouvrementP || 'Non spécifié'}</p>
                </div>
                
                <div className="info-item-glass">
                  <h6>Date d'inscription</h6>
                  <p>
                    {patientInfo?.dateInscription 
                      ? new Date(patientInfo.dateInscription).toLocaleDateString('fr-FR')
                      : 'Non spécifié'
                    }
                  </p>
                </div>
                
                <div className="info-item-glass">
                  <h6>Dernière consultation</h6>
                  <p>
                    {patientInfo?.derniereConsultation 
                      ? new Date(patientInfo.derniereConsultation).toLocaleDateString('fr-FR')
                      : 'Jamais'
                    }
                  </p>
                </div>
              </div>
              
              {patientInfo?.allergies && (
                <div className="alert-glass warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <div>
                    <h6>Allergies</h6>
                    <p>{patientInfo.allergies}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;