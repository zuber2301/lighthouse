/**
 * Event Wizard API Service
 * Handles all API calls for the event creation wizard
 */

const API_BASE_URL = '/api/v1/events/wizard';

export const eventWizardAPI = {
  /**
   * Step 1: Validate budget loading
   */
  async validateBudget(payload) {
    const response = await fetch(`${API_BASE_URL}/step1/budget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate budget');
    }

    return response.json();
  },

  /**
   * Step 2: Validate event information
   */
  async validateEventInfo(payload) {
    const response = await fetch(`${API_BASE_URL}/step2/event-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate event information');
    }

    return response.json();
  },

  /**
   * Step 3A: Validate Annual Day options
   */
  async validateAnnualDayOptions(payload) {
    const response = await fetch(`${API_BASE_URL}/step3/options/annual-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate annual day options');
    }

    return response.json();
  },

  /**
   * Step 3B: Validate Gifting options
   */
  async validateGiftingOptions(payload) {
    const response = await fetch(`${API_BASE_URL}/step3/options/gifting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate gifting options');
    }

    return response.json();
  },

  /**
   * Upload gift image
   */
  async uploadGiftImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-gift-image`, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header, browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    return response.json();
  },

  /**
   * Step 4: Validate scheduling configuration (Gifting mode only)
   */
  async validateScheduling(payload) {
    const response = await fetch(`${API_BASE_URL}/step4/scheduling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate scheduling');
    }

    return response.json();
  },

  /**
   * Final submission: Create event with all configuration
   */
  async submitEvent(payload) {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create event');
    }

    return response.json();
  },

  /**
   * Get event preview/details
   */
  async getEventPreview(eventId) {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/preview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch event preview');
    }

    return response.json();
  },

  /**
   * Prepare payload for step validation based on step number
   */
  async validateCurrentStep(stepNumber, formData) {
    const eventType = formData.event_type;

    switch (stepNumber) {
      case 1: {
        // Budget step
        return this.validateBudget({
          event_budget_amount: parseFloat(formData.event_budget_amount || 0),
          cost_type: formData.cost_type,
          budget_description: formData.budget_description || ''
        });
      }

      case 2: {
        // Event info step
        return this.validateEventInfo({
          name: formData.name,
          description: formData.description || '',
          event_type: eventType,
          event_date: formData.event_date,
          registration_start_date: formData.registration_start_date,
          registration_end_date: formData.registration_end_date
        });
      }

      case 3: {
        // Options step
        if (eventType === 'ANNUAL_DAY') {
          return this.validateAnnualDayOptions({
            tracks: formData.tracks || [],
            volunteer_tasks: formData.volunteer_tasks || []
          });
        } else {
          return this.validateGiftingOptions({
            gift_items: formData.gift_items || []
          });
        }
      }

      case 4: {
        // Scheduling step (Gifting only)
        if (eventType === 'GIFTING') {
          return this.validateScheduling({
            pickup_locations: formData.pickup_locations || [],
            slot_generation_config: formData.slot_generation_config || {}
          });
        }
        return Promise.resolve({ status: 'COMPLETED' });
      }

      default:
        throw new Error(`Unknown step: ${stepNumber}`);
    }
  }
};

/**
 * Helper to get step-specific payload for final submission
 */
export const prepareSubmissionPayload = (formData) => {
  const payload = {
    // Step 1: Budget
    event_budget_amount: parseFloat(formData.event_budget_amount || 0),
    cost_type: formData.cost_type,
    budget_description: formData.budget_description || '',

    // Step 2: Event Info
    name: formData.name,
    description: formData.description || '',
    event_type: formData.event_type,
    event_date: formData.event_date,
    registration_start_date: formData.registration_start_date,
    registration_end_date: formData.registration_end_date
  };

  // Step 3: Options (mode-specific)
  if (formData.event_type === 'ANNUAL_DAY') {
    payload.tracks = formData.tracks || [];
    payload.volunteer_tasks = formData.volunteer_tasks || [];
  } else {
    payload.gift_items = formData.gift_items || [];
  }

  // Step 4: Scheduling (Gifting only)
  if (formData.event_type === 'GIFTING') {
    payload.pickup_locations = formData.pickup_locations || [];
    payload.slot_generation_config = formData.slot_generation_config || {};
  }

  return payload;
};
