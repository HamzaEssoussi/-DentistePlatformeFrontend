import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Publication.css';

const API_BASE_URL = 'http://localhost:8080/dentiste/api';

const Publication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titre: '',
    datePublication: '',
    fichier: null,
    affiche: null,
    typePublication: '',
    resume: ''    
  });

  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [affichePreview, setAffichePreview] = useState(null);
  const [fichierPreview, setFichierPreview] = useState(null);

  const typesPublication = [
    'Article scientifique',
    'Étude de cas',
    'Lancement d\'un produit ou service',
    'Actualités/innovation'
  ];

  // Charger les publications existantes
  useEffect(() => {
    const loadPublications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/publications`);
        if (response.ok) {
          const data = await response.json();
          setPublications(data);
          console.log("Publications chargées:", data);
        }
      } catch (error) {
        console.error('Erreur chargement publications:', error);
        // Publications d'exemple si l'API ne répond pas
        setPublications(getExamplePublications());
      }
    };

    loadPublications();
  }, []);

  // Publications d'exemple
  const getExamplePublications = () => {
    return [
      {
        idPublication: 1,
        titrePublication: "Nouvelles avancées en implantologie dentaire",
        datePublication: "2024-01-15",
        typePublication: "Article scientifique",
        resume: "Une étude révolutionnaire sur les implants dentaires à chargement immédiat",
        affiche: "dentists-dental-office-male-female-600nw-2482836585.webp"
      },
      {
        idPublication: 2,
        titrePublication: "Étude de cas: Reconstruction complète de la mâchoire",
        datePublication: "2024-01-10",
        typePublication: "Étude de cas",
        resume: "Suivi sur 2 ans d'un patient ayant subi une reconstruction complète",
        affiche: "dentists-dental-office-male-female-600nw-2482836585.webp"
      },
      {
        idPublication: 3,
        titrePublication: "Lancement du nouveau scanner intra-oral 3D",
        datePublication: "2024-01-05",
        typePublication: "Lancement d'un produit ou service",
        resume: "Notre cabinet adopte la technologie de scanner 3D la plus avancée",
        affiche: "dentists-dental-office-male-female-600nw-2482836585.webp"
      }
    ];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fieldName === 'affiche') {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'affiche ne doit pas dépasser 5MB");
        return;
      }
      
      if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/gif')) {
        alert("Seules les images JPEG, PNG et GIF sont acceptées");
        return;
      }

      // Prévisualisation de l'affiche
      const reader = new FileReader();
      reader.onloadend = () => {
        setAffichePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }

    if (fieldName === 'fichier') {
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier ne doit pas dépasser 10MB");
        return;
      }

      setFichierPreview(file.name);
    }

    setFormData(prevState => ({
      ...prevState,
      [fieldName]: file
    }));
  };

  const uploadFileToServer = async (file, type) => {
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('type', type);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formDataToSend
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.filePath;
      }
    } catch (error) {
      console.error("Erreur upload fichier:", error);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let fichierPath = null;
      let affichePath = null;

      // Upload des fichiers
      if (formData.fichier) {
        fichierPath = await uploadFileToServer(formData.fichier, 'document');
      }
      if (formData.affiche) {
        affichePath = await uploadFileToServer(formData.affiche, 'image');
      }

      // Préparer les données pour l'API
      const publicationData = {
        titrePublication: formData.titre,
        datePublication: formData.datePublication,
        typePublication: formData.typePublication,
        resume: formData.resume,
        fichierPath: fichierPath,
        affichePath: affichePath,
        dentiste: {
          idD: JSON.parse(localStorage.getItem('user'))?.idD || 1
        }
      };

      console.log("Données envoyées:", publicationData);

      // Envoyer au backend
      const response = await fetch(`${API_BASE_URL}/publications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publicationData)
      });

      if (response.ok) {
        const newPublication = await response.json();
        alert('Publication créée avec succès!');
        
        // Ajouter à la liste
        setPublications(prev => [newPublication, ...prev]);
        
        // Réinitialiser le formulaire
        setFormData({
          titre: '',
          datePublication: '',
          fichier: null,
          affiche: null,
          typePublication: '',
          resume: ''
        });
        setAffichePreview(null);
        setFichierPreview(null);
      } else {
        const error = await response.text();
        alert(`Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la publication');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
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

  const getPublicationIcon = (type) => {
    switch(type) {
      case 'Article scientifique':
        return 'bi-journal-text';
      case 'Étude de cas':
        return 'bi-clipboard-data';
      case 'Lancement d\'un produit ou service':
        return 'bi-rocket-takeoff';
      case 'Actualités/innovation':
        return 'bi-lightbulb';
      default:
        return 'bi-file-earmark-text';
    }
  };

  return (
    <div className="publication-page-glass">
      {/* BACKGROUND */}
      <div 
        className="publication-bg"
        style={{
          backgroundImage: `url('dentists-dental-office-male-female-600nw-2482836585.webp')`
        }}
      ></div>
      
      {/* OVERLAY */}
      <div className="publication-overlay"></div>

      <div className="publication-container-glass">
        {/* Header */}
        <div className="publication-header-glass">
          <div className="header-content-glass">
            <h1 className="header-title-glass">
              <i className="bi bi-newspaper me-2"></i>
              Publications Dentaires
            </h1>
            <p className="header-subtitle-glass">
              Partagez vos connaissances et découvrez les dernières avancées en dentisterie
            </p>
          </div>
        </div>

        <div className="publication-wrapper-glass">
          {/* Section des publications existantes */}
          <div className="publications-section-glass">
            <div className="section-header-glass">
              <h3 className="section-title-glass">
                <i className="bi bi-collection me-2"></i>
                Publications existantes
              </h3>
            </div>

            <div className="publications-grid-glass">
              {publications.length > 0 ? (
                publications.map((pub) => (
                  <div key={pub.idPublication} className="publication-card-glass">
                    <div className="publication-card-header">
                      <div className="publication-type-icon">
                        <i className={`bi ${getPublicationIcon(pub.typePublication)}`}></i>
                      </div>
                      <span className="publication-type-badge">
                        {pub.typePublication}
                      </span>
                    </div>
                    
                    <div className="publication-card-body">
                      <h4 className="publication-title">
                        {pub.titrePublication || pub.titre}
                      </h4>
                      
                      <p className="publication-resume">
                        {pub.resume || pub.description || 'Aucun résumé disponible'}
                      </p>
                      
                      <div className="publication-meta">
                        <div className="meta-item">
                          <i className="bi bi-calendar me-1"></i>
                          <span>{formatDate(pub.datePublication || pub.date)}</span>
                        </div>
                        <div className="meta-item">
                          <i className="bi bi-person me-1"></i>
                          <span>Dr. {pub.dentiste?.prenomD || 'Dentiste'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="publication-card-footer">
                      <button className="btn-glass-outline">
                        <i className="bi bi-eye me-2"></i>
                        Voir détails
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-glass">
                  <i className="bi bi-newspaper empty-icon"></i>
                  <h4>Aucune publication</h4>
                  <p>Créez votre première publication dès maintenant</p>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire de création */}
          <div className="form-section-glass">
            <div className="section-header-glass">
              <h3 className="section-title-glass">
                <i className="bi bi-plus-circle me-2"></i>
                Nouvelle publication
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="publication-form-glass">
              {/* Ligne 1: Titre et Date */}
              <div className="form-row-glass">
                <div className="form-group-glass">
                  <label className="form-label-glass required">Titre</label>
                  <input
                    type="text"
                    className="form-input-glass"
                    name="titre"
                    value={formData.titre}
                    onChange={handleChange}
                    placeholder="Titre de la publication"
                    required
                  />
                </div>
                
                <div className="form-group-glass">
                  <label className="form-label-glass required">Date de publication</label>
                  <input
                    type="date"
                    className="form-input-glass"
                    name="datePublication"
                    value={formData.datePublication}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Ligne 2: Type et Résumé */}
              <div className="form-row-glass">
                <div className="form-group-glass">
                  <label className="form-label-glass required">Type de publication</label>
                  <select
                    className="form-select-glass"
                    name="typePublication"
                    value={formData.typePublication}
                    onChange={handleChange}
                    required
                  >
                    <option value="">[Choisir catégorie]</option>
                    {typesPublication.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group-glass">
                  <label className="form-label-glass">Résumé</label>
                  <textarea
                    className="form-input-glass"
                    name="resume"
                    value={formData.resume}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Résumé de la publication..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Ligne 3: Fichiers */}
              <div className="form-row-glass">
                <div className="form-group-glass">
                  <label className="form-label-glass">Document (PDF, DOC)</label>
                  <div className="file-upload-glass">
                    <label htmlFor="fichier-upload" className="file-upload-label">
                      <div className="file-upload-icon">
                        <i className="bi bi-file-earmark-arrow-up"></i>
                      </div>
                      <span className="file-upload-text">
                        {fichierPreview || 'Choisir un fichier'}
                      </span>
                      <input
                        id="fichier-upload"
                        type="file"
                        className="file-input-hidden"
                        onChange={(e) => handleFileChange(e, 'fichier')}
                        accept=".pdf,.doc,.docx"
                      />
                    </label>
                    {fichierPreview && (
                      <button 
                        type="button"
                        className="file-clear-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, fichier: null }));
                          setFichierPreview(null);
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  <small className="form-hint-glass">Max 10MB</small>
                </div>
                
                <div className="form-group-glass">
                  <label className="form-label-glass">Affiche (Image)</label>
                  <div className="file-upload-glass">
                    <label htmlFor="affiche-upload" className="file-upload-label">
                      <div className="file-upload-icon">
                        <i className="bi bi-image"></i>
                      </div>
                      <span className="file-upload-text">
                        {affichePreview ? 'Image sélectionnée' : 'Choisir une image'}
                      </span>
                      <input
                        id="affiche-upload"
                        type="file"
                        className="file-input-hidden"
                        onChange={(e) => handleFileChange(e, 'affiche')}
                        accept="image/*"
                      />
                    </label>
                    {affichePreview && (
                      <button 
                        type="button"
                        className="file-clear-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, affiche: null }));
                          setAffichePreview(null);
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  <small className="form-hint-glass">Max 5MB (JPG, PNG, GIF)</small>
                  
                  {affichePreview && (
                    <div className="image-preview-glass">
                      <img src={affichePreview} alt="Aperçu" className="preview-image" />
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons */}
              <div className="form-actions-glass">
                <button 
                  type="submit" 
                  className="btn-glass-primary"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <i className="bi bi-arrow-clockwise spin me-2"></i>
                      Publication en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Publier
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-glass-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Publication;