import React, { useState } from 'react';
import './Publication.css';

const Publication = () => {
  const [formData, setFormData] = useState({
    titre: '',
    datePublication: '',
    fichier: null,
    affiche: null,
    typePublication: '',
    resume: ''
  });

  const typesPublication = [
    'Article scientifique',
    'Étude de cas',
    'Lancement d’un produit ou service',
    'Actualités/innovation'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    setFormData(prevState => ({
      ...prevState,
      [fieldName]: e.target.files[0]
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
      const response = await fetch('http://localhost:8080/dentiste/api/publications', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Publication créée avec succès!');
        setFormData({
          titre: '',
          datePublication: '',
          fichier: null,
          affiche: null,
          typePublication: '',
          resume: ''
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="publication-page">
      <div className="container">
        <div className="page-header">
          <h2>Publications</h2>
          <p className="subtitle">
            Découvrez les dernières avancées en dentisterie pour des soins plus précis, confortables et esthétiques.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="publication-form">
          {/* Ligne 1: Titre et Date */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Titre</label>
              <input
                type="text"
                className="form-control"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                placeholder="Saisir le titre de publication"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Date de publication</label>
              <input
                type="date"
                className="form-control"
                name="datePublication"
                value={formData.datePublication}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Ligne 2: Fichier et Affiche */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Fichier</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => handleFileChange(e, 'fichier')}
                accept=".pdf,.doc,.docx"
              />
              <div className="form-text">
                {formData.fichier ? formData.fichier.name : 'Aucun fichier choisi'}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Affiche</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => handleFileChange(e, 'affiche')}
                accept="image/*"
              />
              <div className="form-text">
                {formData.affiche ? formData.affiche.name : 'Aucun fichier choisi'}
              </div>
            </div>
          </div>

          {/* Ligne 3: Type et Résumé */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">Type de publication</label>
              <select
                className="form-select"
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
            <div className="col-md-6">
              <label className="form-label">Résumé</label>
              <textarea
                className="form-control"
                name="resume"
                value={formData.resume}
                onChange={handleChange}
                rows="4"
                placeholder="Saisir la description associée"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              Enregistrer
            </button>
            <button type="reset" className="btn btn-secondary btn-lg">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Publication;