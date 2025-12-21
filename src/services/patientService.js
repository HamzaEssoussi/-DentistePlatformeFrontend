import api from './api';

const patientService = {
  // Créer un patient
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/patients', patientData);
      return response.data;
    } catch (error) {
      console.error('Erreur création patient:', error);
      throw error;
    }
  },

  // Récupérer tous les patients
  getAllPatients: async () => {
    try {
      const response = await api.get('/patients');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération patients:', error);
      throw error;
    }
  },

  // Récupérer un patient par ID
  getPatientById: async (id) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération patient:', error);
      throw error;
    }
  },

  // Mettre à jour un patient
  updatePatient: async (id, patientData) => {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour patient:', error);
      throw error;
    }
  },

  // Supprimer un patient
  deletePatient: async (id) => {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression patient:', error);
      throw error;
    }
  }
};

export default patientService;