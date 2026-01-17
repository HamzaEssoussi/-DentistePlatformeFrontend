import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AideSoignant.css';

const AideSoignant = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomD: '',
    prenomD: '',
    emailD: '',
    mdpD: '',
    specialiteD: '',
    telD: '',
    sexeD: 'M'
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const specialites = [
    'Dentisterie générale',
    'Orthodontie',
    'Parodontologie',
    'Chirurgie dentaire',
    'Endodontie',
    'Pédodontie',
    'Implantologie',
    'Esthétique dentaire',
    'Prothèse dentaire'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 5MB");
        return;
      }
      
      // Vérifier le type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        setError("Seules les images JPEG et PNG sont acceptées");
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
    setError('');
    setIsLoading(true);
    
    // Validation simple
    if (!formData.nomD || !formData.prenomD || !formData.emailD || !formData.mdpD || 
        !formData.specialiteD || !formData.telD || !formData.sexeD) {
      setError("Veuillez remplir tous les champs obligatoires");
      setIsLoading(false);
      return;
    }
    
    if (formData.mdpD.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }
    
    try {
      let photoPath = null;
      if (photo) {
        photoPath = await uploadPhotoToServer(photo);
        if (!photoPath) {
          console.log("Photo non uploadée, mais dentiste sera créé sans photo");
        }
      }
      
      const dentisteData = {
        nomD: formData.nomD,
        prenomD: formData.prenomD,
        emailD: formData.emailD,
        mdpD: formData.mdpD,
        specialiteD: formData.specialiteD,
        telD: formData.telD,
        sexeD: formData.sexeD,
        photoD: photoPath
      };
      
      console.log("=== DONNÉES DENTISTE ENVOYÉES VERS BACKEND ===");
      console.log("Données:", dentisteData);
      
      const response = await fetch('http://localhost:8080/dentiste/api/dentistes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dentisteData)
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
        setSuccessMessage("✅ Dentiste créé avec succès!");
        
        // Réinitialiser le formulaire
        setFormData({
          nomD: '',
          prenomD: '',
          emailD: '',
          mdpD: '',
          specialiteD: '',
          telD: '',
          sexeD: 'M'
        });
        setPhoto(null);
        setPhotoPreview(null);
        
        // Rediriger après 3 secondes
        setTimeout(() => {
          navigate('/dentistes');
        }, 3000);
        
      } else {
        setError(`❌ Erreur: ${responseData.error || responseData.message || responseText}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError("❌ Erreur réseau: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleReset = () => {
    setFormData({
      nomD: '',
      prenomD: '',
      emailD: '',
      mdpD: '',
      specialiteD: '',
      telD: '',
      sexeD: 'M'
    });
    setPhoto(null);
    setPhotoPreview(null);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="aidesoignant-page-glass">
      {/* BACKGROUND */}
      <div 
        className="publication-bg"
        style={{
          backgroundImage: `url('istockphoto-1196021900-612x612.jpg')`
        }} 
      ></div>
      <div className="aidesoignant-container-glass">
        {/* Header Glass */}
        <div className="aidesoignant-header-glass">
          <div className="header-content-glass">
            <h1 className="header-title-glass">
              <i className="bi bi-person-plus me-2"></i>
              Créer un Nouveau Dentiste
            </h1>
            <p className="header-subtitle-glass">
              Ajoutez un nouveau professionnel dentaire à la plateforme
            </p>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="success-message-glass">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
            <p className="mt-2">Redirection dans 3 secondes...</p>
          </div>
        )}

        {error && (
          <div className="error-message-glass">
            <i className="bi bi-x-circle me-2"></i>
            {error}
          </div>
        )}

        <div className="aidesoignant-form-container-glass">
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
                    <small className="upload-hint-glass">JPG, PNG - max 5MB</small>
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
                  <li>Photo professionnelle</li>
                  <li>Visage clairement visible</li>
                  <li>Fond neutre recommandé</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulaire à droite */}
          <div className="form-content-glass">
            <form onSubmit={handleSubmit} className="aidesoignant-form-glass">
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
                    <label className="form-label-glass required">Nom *</label>
                    <input
                      type="text"
                      className="form-input-glass"
                      name="nomD"
                      value={formData.nomD}
                      onChange={handleChange}
                      placeholder="Nom du dentiste"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass required">Prénom *</label>
                    <input
                      type="text"
                      className="form-input-glass"
                      name="prenomD"
                      value={formData.prenomD}
                      onChange={handleChange}
                      placeholder="Prénom du dentiste"
                      required
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass required">Sexe *</label>
                    <div className="radio-group-glass">
                      <div className="radio-option-glass">
                        <input
                          type="radio"
                          name="sexeD"
                          id="sexeM"
                          value="M"
                          checked={formData.sexeD === 'M'}
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
                          name="sexeD"
                          id="sexeF"
                          value="F"
                          checked={formData.sexeD === 'F'}
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
                    <label className="form-label-glass required">Spécialité *</label>
                    <select
                      className="form-select-glass"
                      name="specialiteD"
                      value={formData.specialiteD}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionnez une spécialité</option>
                      {specialites.map(specialite => (
                        <option key={specialite} value={specialite}>
                          {specialite}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass">
                    <i className="bi bi-telephone me-2"></i>
                    Informations de contact
                  </h4>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label-glass required">Email *</label>
                    <input
                      type="email"
                      className="form-input-glass"
                      name="emailD"
                      value={formData.emailD}
                      onChange={handleChange}
                      placeholder="exemple@clinique.com"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-glass required">Téléphone *</label>
                    <input
                      type="tel"
                      className="form-input-glass"
                      name="telD"
                      value={formData.telD}
                      onChange={handleChange}
                      placeholder="Ex: +216 12 345 678"
                      required
                    />
                    <small className="form-hint-glass">
                      <i className="bi bi-phone me-1"></i>
                      Format international recommandé
                    </small>
                  </div>
                </div>
              </div>

              {/* Informations de connexion */}
              <div className="form-section-glass">
                <div className="section-header-glass">
                  <h4 className="section-title-glass">
                    <i className="bi bi-shield-lock me-2"></i>
                    Informations de connexion
                  </h4>
                </div>
                <div className="mb-3">
                  <label className="form-label-glass required">Mot de passe *</label>
                  <input
                    type="password"
                    className="form-input-glass"
                    name="mdpD"
                    value={formData.mdpD}
                    onChange={handleChange}
                    placeholder="Minimum 6 caractères"
                    minLength="6"
                    required
                  />
                  <small className="form-hint-glass">
                    <i className="bi bi-shield-check me-1"></i>
                    Sécurisez le compte avec un mot de passe fort
                  </small>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions-glass">
                <button 
                  type="button" 
                  className="btn-glass-secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Réinitialiser
                </button>
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
                      Créer le dentiste
                    </>
                  )}
                </button>
              </div>
              
              <div className="required-note-glass">
                <small>
                  <i className="bi bi-asterisk me-1"></i>
                  Les champs marqués d'un * sont obligatoires
                </small>
              </div>
              
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AideSoignant;