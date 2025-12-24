import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/dentiste/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Service pour les patients
export const patientService = {
  // Récupérer tous les patients
  getAllPatients: async () => {
    try {
      const response = await api.get('/patients');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      throw error;
    }
  },

  // Récupérer un patient par ID
  getPatientById: async (id) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du patient ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau patient
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/patients', patientData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du patient:', error);
      throw error;
    }
  },

  // Mettre à jour un patient
  updatePatient: async (id, patientData) => {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du patient ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un patient
  deletePatient: async (id) => {
    try {
      await api.delete(`/patients/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du patient ${id}:`, error);
      throw error;
    }
  },

  // Authentification d'un patient
  loginPatient: async (email, password) => {
    try {
      // Récupérer tous les patients
      const patients = await api.get('/patients').then(res => res.data);
      
      // Rechercher le patient avec l'email et le mot de passe
      const patient = patients.find(p => 
        p.emailP === email && p.mdpP === password
      );
      
      return patient;
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      throw error;
    }
  }
};

// Service pour les aides-soignants (à adapter selon vos besoins)
export const dentisteService = {
  // Récupérer un dentiste par ID
  getDentisteById: async (id) => {
    try {
      const response = await api.get(`/dentistes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du dentiste ${id}:`, error);
      throw error;
    }
  },
  loginDentiste: async (emailD, passwordD) => {
    try {

      const dentistes = await api.get('/dentistes').then(res => res.data);
      const dentiste = dentistes.find(d => 
        d.emailD === emailD && d.mdpD === passwordD
      );
      
      return dentiste;
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      throw error;
    }
  }
};

export default api;