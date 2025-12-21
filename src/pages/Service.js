import React, { useState } from 'react';
import './Service.css';

const Service = () => {
  const [formData, setFormData] = useState({
    nomSM: '',
    tarifSM: '',
    typeSM: '',
    descriptionSM: '',
    nbSeances: '',
    photoService: null
  });

  const serviceTypes = [
    'Dentisterie générale',
    'Diagnostic et soins courants',
    'Parodontologie',
    'Radiologie et imagerie dentaire',
    'Actes chirurgicaux',
    'Endodontie',
    'Esthétique dentaire',
    'Implantologie'
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
      photoService: e.target.files[0]
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
      const response = await fetch('http://localhost:8080/dentiste/api/services', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Service créé avec succès!');
        setFormData({
          nomSM: '',
          tarifSM: '',
          typeSM: '',
          descriptionSM: '',
          nbSeances: '',
          photoService: null
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="service-page">
      <div className="container">
        <div className="page-header">
          <h2>Des sourires éclatants pour tous, soins généraux, au service de votre santé bucco-dentaire</h2>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          {/* Ligne 1: Nom et Prix */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Nom</label>
              <input
                type="text"
                className="form-control"
                name="nomSM"
                value={formData.nomSM}
                onChange={handleChange}
                placeholder="Saisir le nom de service"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Prix</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="tarifSM"
                value={formData.tarifSM}
                onChange={handleChange}
                placeholder="Saisir le prix de service"
                required
              />
            </div>
          </div>

          {/* Ligne 2: Nombre de séances et Photo */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Nombre des séances</label>
              <input
                type="number"
                className="form-control"
                name="nbSeances"
                value={formData.nbSeances}
                onChange={handleChange}
                placeholder="Saisir le nombre de séances"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Affiche</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
          </div>

          {/* Ligne 3: Type et Description */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                name="typeSM"
                value={formData.typeSM}
                onChange={handleChange}
                required
              >
                <option value="">[Choisir catégorie]</option>
                {serviceTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="descriptionSM"
                value={formData.descriptionSM}
                onChange={handleChange}
                rows="4"
                placeholder="Saisir la description de service"
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

export default Service;