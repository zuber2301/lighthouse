/**
 * useEventWizardForm Hook
 * Manages multi-step form state with validation and persistence
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'event_wizard_form';

export const useEventWizardForm = (initialData = {}) => {
  const [formData, setFormData] = useState(() => {
    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load form from localStorage:', e);
    }
    return initialData;
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Save to localStorage whenever formData changes
  const updateFormData = useCallback((updates) => {
    setFormData((prev) => {
      const newData = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      } catch (e) {
        console.warn('Failed to save form to localStorage:', e);
      }
      return newData;
    });
  }, []);

  const clearForm = useCallback(() => {
    setFormData({});
    setErrors({});
    setTouched({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }, []);

  const validateBudget = useCallback(() => {
    const newErrors = {};

    if (!formData.event_budget_amount || formData.event_budget_amount <= 0) {
      newErrors.event_budget_amount = 'Budget amount must be greater than 0';
    }

    if (!formData.cost_type) {
      newErrors.cost_type = 'Cost type is required';
    }

    return newErrors;
  }, [formData]);

  const validateEventInfo = useCallback(() => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }

    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    }

    if (!formData.registration_start_date) {
      newErrors.registration_start_date = 'Registration start date is required';
    }

    if (!formData.registration_end_date) {
      newErrors.registration_end_date = 'Registration end date is required';
    }

    // Cross-field validation
    if (formData.registration_start_date && formData.registration_end_date) {
      const startDate = new Date(formData.registration_start_date);
      const endDate = new Date(formData.registration_end_date);
      if (endDate <= startDate) {
        newErrors.registration_end_date = 'Registration end must be after start';
      }
    }

    if (formData.registration_end_date && formData.event_date) {
      const regEndDate = new Date(formData.registration_end_date);
      const eventDate = new Date(formData.event_date);
      if (eventDate <= regEndDate) {
        newErrors.event_date = 'Event date must be after registration end';
      }
    }

    return newErrors;
  }, [formData]);

  const validateAnnualDayOptions = useCallback(() => {
    const newErrors = {};

    const tracks = formData.tracks || [];
    const tasks = formData.volunteer_tasks || [];

    if (tracks.length === 0 && tasks.length === 0) {
      newErrors.options = 'At least one track or task is required';
    }

    // Validate each track
    tracks.forEach((track, idx) => {
      if (!track.track_name || track.track_name.trim().length === 0) {
        newErrors[`track_${idx}_name`] = 'Track name is required';
      }
      if (!track.total_slots || track.total_slots <= 0) {
        newErrors[`track_${idx}_slots`] = 'Total slots must be greater than 0';
      }
    });

    // Validate each task
    tasks.forEach((task, idx) => {
      if (!task.task_name || task.task_name.trim().length === 0) {
        newErrors[`task_${idx}_name`] = 'Task name is required';
      }
      if (!task.required_volunteers || task.required_volunteers <= 0) {
        newErrors[`task_${idx}_volunteers`] = 'Required volunteers must be greater than 0';
      }
    });

    return newErrors;
  }, [formData]);

  const validateGiftingOptions = useCallback(() => {
    const newErrors = {};

    const gifts = formData.gift_items || [];

    if (gifts.length === 0) {
      newErrors.gifts = 'At least one gift item is required';
    }

    gifts.forEach((gift, idx) => {
      if (!gift.item_name || gift.item_name.trim().length === 0) {
        newErrors[`gift_${idx}_name`] = 'Gift name is required';
      }

      if (!gift.gift_image_url && !gift.image_file_key) {
        newErrors[`gift_${idx}_image`] = 'Gift image is required';
      }

      if (!gift.total_quantity || gift.total_quantity <= 0) {
        newErrors[`gift_${idx}_quantity`] = 'Quantity must be greater than 0';
      }

      if (gift.unit_cost === undefined || gift.unit_cost < 0) {
        newErrors[`gift_${idx}_cost`] = 'Unit cost cannot be negative';
      }
    });

    return newErrors;
  }, [formData]);

  const validateScheduling = useCallback(() => {
    const newErrors = {};

    const locations = formData.pickup_locations || [];
    const slotConfig = formData.slot_generation_config || {};

    if (locations.length === 0) {
      newErrors.locations = 'At least one pickup location is required';
    }

    locations.forEach((loc, idx) => {
      if (!loc.location_name || loc.location_name.trim().length === 0) {
        newErrors[`location_${idx}_name`] = 'Location name is required';
      }
    });

    if (!slotConfig.slot_duration_minutes || slotConfig.slot_duration_minutes < 5) {
      newErrors.slot_duration = 'Slot duration must be at least 5 minutes';
    }

    if (slotConfig.slot_duration_minutes > 60) {
      newErrors.slot_duration = 'Slot duration cannot exceed 60 minutes';
    }

    if (!slotConfig.persons_per_slot || slotConfig.persons_per_slot < 1) {
      newErrors.persons_per_slot = 'Persons per slot must be at least 1';
    }

    if (slotConfig.operating_start_hour === undefined || slotConfig.operating_start_hour < 0) {
      newErrors.start_hour = 'Invalid start hour';
    }

    if (slotConfig.operating_end_hour === undefined || slotConfig.operating_end_hour > 23) {
      newErrors.end_hour = 'Invalid end hour';
    }

    if (slotConfig.operating_start_hour >= slotConfig.operating_end_hour) {
      newErrors.end_hour = 'End hour must be after start hour';
    }

    return newErrors;
  }, [formData]);

  // Validate specific step
  const validateStep = useCallback((stepNumber) => {
    switch (stepNumber) {
      case 1:
        return validateBudget();
      case 2:
        return validateEventInfo();
      case 3:
        if (formData.event_type === 'ANNUAL_DAY') {
          return validateAnnualDayOptions();
        } else {
          return validateGiftingOptions();
        }
      case 4:
        if (formData.event_type === 'GIFTING') {
          return validateScheduling();
        }
        return {};
      default:
        return {};
    }
  }, [formData, validateBudget, validateEventInfo, validateAnnualDayOptions, validateGiftingOptions, validateScheduling]);

  // Validate and set errors
  const validateAndSetErrors = useCallback((stepNumber) => {
    const newErrors = validateStep(stepNumber);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateStep]);

  const markFieldAsTouched = useCallback((fieldName) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [touched, errors]);

  return {
    formData,
    updateFormData,
    clearForm,
    errors,
    setErrors,
    touched,
    markFieldAsTouched,
    getFieldError,
    validateStep,
    validateAndSetErrors,
    validateBudget,
    validateEventInfo,
    validateAnnualDayOptions,
    validateGiftingOptions,
    validateScheduling
  };
};
