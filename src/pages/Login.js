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
      // CORRECTION: Utilisez le même type que dans handleUserTypeSelect
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
      // CORRECTION: Utilisez 'aide-soignant' comme dans handleUserTypeSelect
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

      {/* CONTENU */}
      <div className="login-wrapper">
        <div className="login-image">
          <img src="/istockphoto-1311482681-612x612-removebg-preview.png" alt="Dental care" />
        </div>

        <div className="login-content">
          {step === 'select' ? (
            <div className="login-card">
              <h2>Bienvenue sur PerfectSmile</h2>
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
    </div>
  );
};

export default Login;