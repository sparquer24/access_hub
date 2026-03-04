import api from './api';

const FACE_API_BASE = '/api/v1';

export const faceService = {
  /**
   * Enroll face for recognition (works for both employees and visitors)
   * Unified API endpoint for face enrollment
   * @param {string} entityId - Entity ID (Employee ID or Visitor ID)
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise}
   */
  enrollFace: async (entityId, imageBase64) => {
    try {
      const endpoint = `${FACE_API_BASE}/face/enroll`;

      const response = await api.post(endpoint, {
        entity_id: entityId,
        img_b64: imageBase64,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};