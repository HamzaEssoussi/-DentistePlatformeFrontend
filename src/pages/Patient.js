import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Patient.css';

const Patient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    telephone: '',
    email: '',
    mdp: '',
    dateNaissance: '',
    groupeSanguin: '',
    sexe: 'M',
    recouvrement: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // MAPPAGE DES DONNÉES POUR LE BACKEND
  const patientForBackend = {
    // Champs obligatoires (selon votre entité Patient.java)
    nomP: formData.nom,
    prenomP: formData.prenom,
    emailP: formData.email,
    sexeP: formData.sexe,
    mdpP: formData.mdp,
    
    // Champs optionnels
    dateNP: formData.dateNaissance || null,
    groupeSanguinP: formData.groupeSanguin || null,
    recouvrementP: formData.recouvrement || null
  };
  
  // DEBUG: Affichez ce qui est envoyé
  console.log("=== DONNÉES ENVOYÉES VERS BACKEND ===");
  console.log(JSON.stringify(patientForBackend, null, 2));
  
  try {
    const response = await fetch('http://localhost:8080/dentiste/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientForBackend)
    });

    // NE LISEZ LA RÉPONSE QU'UNE SEULE FOIS
    const responseText = await response.text();
    console.log("Réponse du serveur:", responseText);
    
    // Essayez de parser en JSON si possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    if (response.ok) {
      alert("✅ Patient créé avec succès!");
      navigate('/valider-inscription');
    } else {
      alert(`❌ Erreur: ${responseData}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert("❌ Erreur réseau: " + error.message);
  }
};
  return (
    <div className="patient-page">
      <div className="container">
        <div className="page-header">
          <h2>Créer compte et Prenez rendez-vous en ligne</h2>
        </div>

        <form onSubmit={handleSubmit} className="patient-form">
          {/* Ligne 1: Nom et Prénom */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Nom *</label>
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
              <label className="form-label">Prénom *</label>
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

          {/* Ligne 3: Email et Mot de passe */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemple@email.com"
                required
              />
              <small className="text-muted">Cet email sera utilisé pour vous connecter</small>
            </div>
            <div className="col-md-6">
              <label className="form-label">Mot de passe *</label>
              <input
                type="password"
                className="form-control"
                name="mdp"
                value={formData.mdp}
                onChange={handleChange}
                placeholder="Minimum 6 caractères"
                minLength="6"
                required
              />
            </div>
          </div>

          {/* Ligne 4: Date de naissance et Groupe sanguin */}
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
              <label className="form-label">Groupe sanguin</label>
              <select
                className="form-select"
                name="groupeSanguin"
                value={formData.groupeSanguin}
                onChange={handleChange}
              >
                <option value="">Choisir</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="O">O</option>
                <option value="AB">AB</option>
              </select>
            </div>
          </div>

          {/* Ligne 5: Sexe et Recouvrement */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">Sexe *</label>
              <div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sexe"
                    id="sexeM"
                    value="M"
                    checked={formData.sexe === 'M'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="sexeM">
                    Masculin
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sexe"
                    id="sexeF"
                    value="F"
                    checked={formData.sexe === 'F'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="sexeF">
                    Féminin
                  </label>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Recouvrement</label>
              <select
                className="form-select"
                name="recouvrement"
                value={formData.recouvrement}
                onChange={handleChange}
              >
                <option value="">Choisir</option>
                <option value="Médecin de la famille">Médecin de la famille</option>
                <option value="Remboursement">Remboursement</option>
                <option value="Santé publique">Santé publique</option>
              </select>
            </div>
          </div>

          {/* Ligne 2: Adresse et Téléphone (déplacé en bas car optionnels) */}
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

          {/* Boutons */}
          <div className="form-actions">
            <button type="submit" className="btn btn-success btn-lg">
              <i className="fas fa-user-plus me-2"></i>
              S'inscrire
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/')}
            >
              <i className="fas fa-times me-2"></i>
              Annuler
            </button>
          </div>
          
          <div className="mt-3 text-center text-muted">
            <small>* Champs obligatoires</small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Patient;