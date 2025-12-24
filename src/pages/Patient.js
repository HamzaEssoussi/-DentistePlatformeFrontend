import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Patient.css';

const Patient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    email: '',
    mdp: '',
    dateNaissance: '',
    groupeSanguin: '',
    sexe: 'M',
    recouvrement: ''
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("La photo ne doit pas dépasser 2MB");
        return;
      }
      
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert("Seules les images JPEG et PNG sont acceptées");
        return;
      }
      
      setPhoto(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhotoToServer = async (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    try {
      const response = await fetch('http://localhost:8080/dentiste/api/upload-photo', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.filePath;
      } else {
        console.error("Erreur lors de l'upload de la photo");
        return null;
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let photoPath = null;
      if (photo) {
        photoPath = await uploadPhotoToServer(photo);
        if (!photoPath) {
          alert("Photo non uploadée, mais patient sera créé sans photo");
        }
      }
      
      const patientData = {
        nomP: formData.nom,
        prenomP: formData.prenom,
        emailP: formData.email,
        sexeP: formData.sexe,
        mdpP: formData.mdp,
        dateNP: formData.dateNaissance || null,
        groupeSanguinP: formData.groupeSanguin || null,
        recouvrementP: formData.recouvrement || null,
        photoP: photoPath,
        adresseP: formData.adresse || null
      };
      
      console.log("=== DONNÉES ENVOYÉES VERS BACKEND ===");
      console.log("Données texte:", patientData);
      
      const response = await fetch('http://localhost:8080/dentiste/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      });

      const responseText = await response.text();
      console.log("Réponse du serveur:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      if (response.ok) {
        alert("Patient créé avec succès!");
        navigate('/valider-inscription');
      } else {
        alert(`Erreur: ${responseData}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur réseau: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  return (

    <div className="patient-page-glass">
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



      <div className="patient-container-glass">
        {/* Header Glass */}
        <div className="patient-header-glass">
          <div className="header-content-glass">
            <h1 className="header-title-glass">
              <i className="bi bi-person-plus me-2"></i>
              Créer votre compte Patient
            </h1>
            <p className="header-subtitle-glass">
              Inscrivez-vous et prenez rendez-vous en ligne facilement
            </p>
          </div>
        </div>

        <div className="patient-form-container-glass">
          {/* Photo à gauche */}
          <div className="photo-sidebar-glass">
            <div className="photo-upload-card-glass">
              <h3 className="photo-title-glass">
                <i className="bi bi-camera me-2"></i>
                Photo de profil
              </h3>
              <div className="photo-upload-area-glass">
                {photoPreview ? (
                  <div className="photo-preview-glass">
                    <div className="photo-wrapper-glass">
                      <img 
                        src={photoPreview} 
                        alt="Aperçu" 
                        className="photo-image-glass"
                      />
                      <button 
                        type="button" 
                        className="remove-photo-glass"
                        onClick={removePhoto}
                        title="Supprimer la photo"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                    <div className="photo-info-glass">
                      <small>{photo.name}</small>
                      <small>{(photo.size / 1024).toFixed(1)} KB</small>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="photo-upload" className="upload-prompt-glass">
                    <div className="upload-icon-glass">
                      <i className="bi bi-cloud-arrow-up"></i>
                    </div>
                    <span className="upload-text-glass">Ajouter une photo</span>
                    <small className="upload-hint-glass">JPG, PNG - max 2MB</small>
                    <input
                      id="photo-upload"
                      type="file"
                      className="d-none"
                      accept="image/jpeg,image/png"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>
              
              <div className="photo-tips-glass">
                <h6><i className="bi bi-lightbulb me-2"></i>Conseils</h6>
                <ul>
                  <li>Photo claire et récente</li>
                  <li>Visage bien visible</li>
                  <li>Fond neutre recommandé</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulaire à droite */}
          <div className="form-content-glass">
            <form onSubmit={handleSubmit} className="patient-form-glass">
              {/* Informations personnelles */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass">
                    <i className="bi bi-person-circle me-2"></i>
                    Informations personnelles
                  </h4>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass required">Nom</label>
                    <input
                      type="text"
                      className="form-input-glass"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass required">Prénom</label>
                    <input
                      type="text"
                      className="form-input-glass"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      placeholder="Votre prénom"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Compte */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass">
                    <i className="bi bi-shield-lock me-2"></i>
                    Informations de connexion
                  </h4>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass required">Email</label>
                    <input
                      type="email"
                      className="form-input-glass"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="exemple@email.com"
                      required
                    />
                    <small className="form-hint-glass">
                      <i className="bi bi-info-circle me-1"></i>
                      Cet email sera utilisé pour vous connecter
                    </small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass required">Mot de passe</label>
                    <input
                      type="password"
                      className="form-input-glass"
                      name="mdp"
                      value={formData.mdp}
                      onChange={handleChange}
                      placeholder="Minimum 6 caractères"
                      minLength="6"
                      required
                    />
                    <small className="form-hint-glass">
                      <i className="bi bi-shield-check me-1"></i>
                      Sécurisez votre compte avec un mot de passe fort
                    </small>
                  </div>
                </div>
              </div>

              {/* Santé */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass">
                    <i className="bi bi-heart-pulse me-2"></i>
                    Informations médicales
                  </h4>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass">Date de naissance</label>
                    <input
                      type="date"
                      className="form-input-glass"
                      name="dateNaissance"
                      value={formData.dateNaissance}
                      onChange={handleChange}
                    />
                    <small className="form-hint-glass">
                      <i className="bi bi-calendar me-1"></i>
                      Facultatif
                    </small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass">Groupe sanguin</label>
                    <select
                      className="form-select-glass"
                      name="groupeSanguin"
                      value={formData.groupeSanguin}
                      onChange={handleChange}
                    >
                      <option value="">Sélectionnez votre groupe</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="O">O</option>
                      <option value="AB">AB</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Détails */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass">
                    <i className="bi bi-info-square me-2"></i>
                    Détails supplémentaires
                  </h4>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass required">Sexe</label>
                    <div className="radio-group-glass">
                      <div className="radio-option-glass">
                        <input
                          type="radio"
                          name="sexe"
                          id="sexeM"
                          value="M"
                          checked={formData.sexe === 'M'}
                          onChange={handleChange}
                          className="radio-input-glass"
                        />
                        <label htmlFor="sexeM" className="radio-label-glass">
                          <i className="bi bi-gender-male me-2"></i>
                          Masculin
                        </label>
                      </div>
                      <div className="radio-option-glass">
                        <input
                          type="radio"
                          name="sexe"
                          id="sexeF"
                          value="F"
                          checked={formData.sexe === 'F'}
                          onChange={handleChange}
                          className="radio-input-glass"
                        />
                        <label htmlFor="sexeF" className="radio-label-glass">
                          <i className="bi bi-gender-female me-2"></i>
                          Féminin
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass">Recouvrement</label>
                    <select
                      className="form-select-glass"
                      name="recouvrement"
                      value={formData.recouvrement}
                      onChange={handleChange}
                    >
                      <option value="">Type de couverture</option>
                      <option value="Médecin de la famille">Médecin de la famille</option>
                      <option value="Remboursement">Remboursement</option>
                      <option value="Santé publique">Santé publique</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label-glass">Adresse</label>
                  <input
                    type="text"
                    className="form-input-glass"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Votre adresse complète"
                  />
                  <small className="form-hint-glass">
                    <i className="bi bi-house-door me-1"></i>
                    Pour les visites à domicile si nécessaire
                  </small>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions-glass">
                <button 
                  type="submit" 
                  className="btn-glass-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="bi bi-arrow-clockwise spin me-2"></i>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      S'inscrire
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-glass-secondary"
                  onClick={() => navigate('/')}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Annuler
                </button>
              </div>
              
              <div className="required-note-glass">
                <small>
                  <i className="bi bi-asterisk me-1"></i>
                  Les champs marqués sont obligatoires
                </small>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patient;