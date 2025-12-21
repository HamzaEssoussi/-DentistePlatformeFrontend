import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AideSoignant.css';

const AideSoignant = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    telephone: '',
    email: '',
    mdp: '',
    dateNaissance: '',
    diplome: '',
    photo: null
  });

  const diplomes = [
    'Aide en chirurgie bucco-dentaire',
    'Assistance en parodontologie',
    'Aide en pédodontie',
    'Assistance en implantologie'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prevState => ({
      ...prevState,
      photo: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch('http://dentiste/api/dentiste', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Inscription réussie !');
        navigate('/');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="aidesoignant-page">
      <div className="container">
        <div className="page-header">
          <h2>Rejoignez notre équipe médicale</h2>
          <p className="subtitle">Aidez à sublimer les sourires dans nos cabinets dentaires.</p>
        </div>

        <form onSubmit={handleSubmit} className="aidesoignant-form">
          {/* Ligne 1: Nom et Prénom */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Nom</label>
              <input
                type="text"
                className="form-control"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Saisir votre nom.."
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                className="form-control"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Saisir votre prénom.."
                required
              />
            </div>
          </div>

          {/* Ligne 2: Adresse et Téléphone */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Adresse</label>
              <input
                type="text"
                className="form-control"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                placeholder="Saisir votre adresse.."
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                className="form-control"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="Saisir votre téléphone.."
              />
            </div>
          </div>

          {/* Ligne 3: Email et Mot de passe */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Saisir votre E-mail.."
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                name="mdp"
                value={formData.mdp}
                onChange={handleChange}
                placeholder="Saisir votre mot de passe.."
                required
              />
            </div>
          </div>

          {/* Ligne 4: Date de naissance et Diplôme */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Date de naissance</label>
              <input
                type="date"
                className="form-control"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Diplôme</label>
              <select
                className="form-select"
                name="diplome"
                value={formData.diplome}
                onChange={handleChange}
                required
              >
                <option value="">[Choisir]</option>
                {diplomes.map((diplome, index) => (
                  <option key={index} value={diplome}>{diplome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ligne 5: Photo */}
          <div className="row mb-4">
            <div className="col-md-12">
              <label className="form-label">Photo</label>
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                  accept="image/*"
                  id="photoInput"
                />
                <label className="input-group-text" htmlFor="photoInput">
                  <i className="fas fa-camera"></i>
                </label>
              </div>
              <div className="form-text">
                {formData.photo ? formData.photo.name : 'Aucun fichier choisi'}
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              Enregistrer
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/')}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AideSoignant;