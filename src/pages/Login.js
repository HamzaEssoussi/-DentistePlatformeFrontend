// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, dentisteService } from '../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('select');
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setStep('login');
  };

  const handleBack = () => {
    setStep('select');
    setUserType('');
    setFormData({ email: '', password: '' });
    setError('');
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (userType === 'patient') {
        const response = await patientService.loginPatient(formData.email, formData.password);
        const patient = response?.data || response;

        if (!patient) throw new Error('Identifiants incorrects');
        localStorage.setItem('user', JSON.stringify({
          idP: patient.idP,
          prenomP: patient.prenomP,
          nomP: patient.nomP,
          emailP: patient.emailP,
          photoP: patient.photoP,
          type: 'patient'
        }));
        
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/PatientDashboard');
      } 
      else if (userType === 'dentiste') {
        const response = await dentisteService.loginDentiste(formData.email, formData.password);
        const dentiste = response?.data || response;
        
        if (!dentiste) throw new Error('Identifiants incorrects');

        localStorage.setItem('user', JSON.stringify({ 
          idD: dentiste.idD,
          prenomD: dentiste.prenomD,
          nomD: dentiste.nomD,
          emailD: dentiste.emailD,
          photoD: dentiste.photoD,
          specialiteD: dentiste.specialiteD,
          sexeD: dentiste.sexeD,
          telD: dentiste.TelD,
          type: 'dentiste' 
        }));
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/AideSoignantDashboard');
      } else {
        throw new Error('Type d\'utilisateur non reconnu');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
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

      {/* CONTENEUR PRINCIPAL */}
      <div className="login-main-container">
        
        {/* SECTION CONNEXION */}
        <div className="login-wrapper">
          <div className="login-image">
            <img src="/istockphoto-1311482681-612x612-removebg-preview.png" alt="Dental care" />
          </div>

          <div className="login-content">
            {step === 'select' ? (
              <div className="login-card">
                <h2>Bienvenue sur SmileEveryDay</h2>
                <p className="subtitle">Sélectionnez votre profil</p>

                <div className="profile-list">
                  <div className="profile-card" onClick={() => handleUserTypeSelect('patient')}>
                    <img src="/patient-icon.png" alt="Patient" />
                    <div>
                      <h4>Patient</h4>
                      <p>Accédez à vos rendez-vous</p>
                    </div>
                  </div>

                  <div className="profile-card" onClick={() => handleUserTypeSelect('dentiste')}>
                    <img src="/caregiver-icon.png" alt="dentiste" />
                    <div>
                      <h4>Aide-soignant</h4>
                      <p>Gestion professionnelle</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="login-card">
                <button className="back-btn" onClick={handleBack}>← Retour</button>

                <h2>Connexion</h2>
                <span className="badge">
                  {userType === 'patient' ? 'Patient' : 'dentiste'}
                </span>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleLogin}>
                  <input
                    type="email"
                    name="email"
                    autoComplete="new-email"
                    placeholder="Adresse email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />

                  <button type="submit" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* SECTION INFORMATIONS ET TÉMOIGNAGES (EN DESSOUS) */}
        <div className="info-section">
          <div className="info-container">
            {/* À PROPOS DE LA PLATEFORME */}
            <div className="info-card">
              <div className="info-header">
                <h3>Smile EveryDay</h3>
                <p className="info-subtitle">Votre santé dentaire, notre priorité</p>
              </div>
              <div className="info-content">
                <p>
                  Plateforme innovante de prise de rendez-vous dentaires qui connecte 
                  patients et professionnels de santé. Accédez à des soins dentaires 
                  de qualité avec des praticiens certifiés.
                </p>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-number">500+</span>
                    <span className="stat-label">Patients satisfaits</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">Dentistes experts</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">24/7</span>
                    <span className="stat-label">Support disponible</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TÉMOIGNAGES DES PATIENTS */}
            <div className="testimonials-section">
              <h3 className="testimonials-title">Ce que disent nos patients</h3>
              <div className="testimonials-grid">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    <img src="/patient1.png" alt="Patient" className="testimonial-avatar" />
                    <div>
                      <h4>Marie Dubois</h4>
                      <div className="rating">
                        <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
                      </div>
                    </div>
                  </div>
                  <p className="testimonial-text">
                    "Super plateforme ! J'ai pu prendre rendez-vous en 2 minutes 
                    pour une urgence dentaire. Le dentiste était très professionnel."
                  </p>
                </div>

                <div className="testimonial-card">
                  <div className="testimonial-header">
                    <img src="/patient2.png" alt="Patient" className="testimonial-avatar" />
                    <div>
                      <h4>Thomas Martin</h4>
                      <div className="rating">
                        <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
                      </div>
                    </div>
                  </div>
                  <p className="testimonial-text">
                    "L'interface est intuitive et les rappels par SMS sont très 
                    pratiques. Plus jamais je ne prendrai rendez-vous par téléphone !"
                  </p>
                </div>

                <div className="testimonial-card">
                  <div className="testimonial-header">
                    <img src="/patient3.png" alt="Patient" className="testimonial-avatar" />
                    <div>
                      <h4>Meriem</h4>
                      <div className="rating">
                        <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
                      </div>
                    </div>
                  </div>
                  <p className="testimonial-text">
                    "En tant que maman de deux enfants, pouvoir gérer tous nos 
                    rendez-vous dentaires sur une seule appli est un vrai gain de temps."
                  </p>
                </div>
              </div>
            </div>

            {/* COMMENTAIRES DES DENTISTES */}
            <div className="dentists-section">
              <h3 className="dentists-title">Nos dentistes recommandent</h3>
              <div className="dentists-grid">
                <div className="dentist-card">
                  <div className="dentist-header">
                    <img src="/dentiste1.png" alt="Dentiste" className="dentist-avatar" />
                    <div>
                      <h4>Dr. Ahmed Benali</h4>
                      <span className="dentist-specialty">Orthodontiste</span>
                    </div>
                  </div>
                  <p className="dentist-text">
                    "Cette plateforme m'a permis d'optimiser ma gestion de rendez-vous 
                    et de me concentrer sur ce qui compte vraiment : mes patients."
                  </p>
                </div>

                <div className="dentist-card">
                  <div className="dentist-header">
                    <img src="/dentiste2.png" alt="Dentiste" className="dentist-avatar" />
                    <div>
                      <h4>Dr. Claire Moreau</h4>
                      <span className="dentist-specialty">Pédodontiste</span>
                    </div>
                  </div>
                  <p className="dentist-text">
                    "Les patients arrivent mieux informés et préparés. La transparence 
                    sur les tarifs et disponibilités simplifie beaucoup les échanges."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;