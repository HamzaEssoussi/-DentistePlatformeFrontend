import api from './api';

const dentisteService = {
  // Créer un dentiste
  createDentiste: async (dentisteData) => {
    try {
      const response = await api.post('/dentistes', dentisteData);
      return response.data;
    } catch (error) {
      console.error('Erreur création dentiste:', error);
      throw error;
    }
  },

  // Récupérer tous les dentistes
  getAllDentistes: async () => {
    try {
      const response = await api.get('/dentistes');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération dentistes:', error);
      throw error;
    }
  },

  // Rechercher dentistes par spécialité
  getDentistesBySpecialite: async (specialite) => {
    try {
      const response = await api.get(`/dentistes/specialite/${specialite}`);
      return response.data;
    } catch (error) {
      console.error('Erreur recherche dentistes:', error);
      throw error;
    }
  }
};

export default dentisteService;