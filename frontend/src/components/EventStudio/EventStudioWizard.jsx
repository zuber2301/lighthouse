/**
 * Event Studio Wizard - Main Container Component
 * Multi-step wizard for creating events (Annual Day or Gifting)
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Step components
import BudgetStep from './steps/BudgetStep';
import BasicInfoStep from './steps/BasicInfoStep';
import OptionsStep from './steps/OptionsStep';
import SchedulingStep from './steps/SchedulingStep';
import ReviewStep from './steps/ReviewStep';

// Utilities
import { useEventWizardForm } from '../../hooks/useEventWizardForm';
import { eventWizardAPI, prepareSubmissionPayload } from '../../services/eventWizardAPI';

export default function EventStudioWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { formData, updateFormData, validateAndSetErrors } = useEventWizardForm();

  // Step configuration - dynamically built based on event type
  const getSteps = () => {
    const baseSteps = [
      {
        number: 1,
        title: 'Budget Loading',
        description: 'Define the Event Wallet',
        icon: '💰'
      },
      {
        number: 2,
        title: 'Event Details',
        description: 'Basic information and type',
        icon: '📋'
      },
      {
        number: 3,
        title: 'Configure Options',
        description: formData.event_type === 'ANNUAL_DAY' 
          ? 'Add tracks and volunteer tasks'
          : 'Upload gift items',
        icon: formData.event_type === 'ANNUAL_DAY' ? '🎭' : '🎁'
      }
    ];

    // Add mode-specific steps
    if (formData.event_type === 'GIFTING') {
      baseSteps.push({
        number: 4,
        title: 'Scheduling',
        description: 'Pickup locations and time slots',
        icon: '⏰'
      });
      baseSteps.push({
        number: 5,
        title: 'Review',
        description: 'Review and create event',
        icon: '✓'
      });
    } else {
      baseSteps.push({
        number: 4,
        title: 'Review',
        description: 'Review and create event',
        icon: '✓'
      });
    }

    return baseSteps;
  };

  const steps = getSteps();
  const maxStep = steps.length;

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BudgetStep
            data={formData}
            onChange={updateFormData}
          />
        );
      case 2:
        return (
          <BasicInfoStep
            data={formData}
            onChange={updateFormData}
          />
        );
      case 3:
        return (
          <OptionsStep
            eventType={formData.event_type}
            data={formData}
            onChange={updateFormData}
            onImageUpload={handleImageUpload}
          />
        );
      case 4:
        if (formData.event_type === 'GIFTING') {
          return (
            <SchedulingStep
              data={formData}
              onChange={updateFormData}
            />
          );
        } else {
          return (
            <ReviewStep
              data={formData}
              eventType={formData.event_type}
              isSubmitting={loading}
              onSubmit={handleSubmitWizard}
            />
          );
        }
      case 5:
        return (
          <ReviewStep
            data={formData}
            eventType={formData.event_type}
            isSubmitting={loading}
            onSubmit={handleSubmitWizard}
          />
        );
      default:
        return null;
    }
  };

  // Handle image upload for gifts
  const handleImageUpload = async (file) => {
    try {
      const result = await eventWizardAPI.uploadGiftImage(file);
      return result;
    } catch (err) {
      throw new Error(err.message || 'Failed to upload image');
    }
  };

  // Validate and move to next step
  const handleNext = async () => {
    setError(null);
    
    try {
      setLoading(true);
      
      // Validate using API
      await eventWizardAPI.validateCurrentStep(currentStep, formData);
      
      if (currentStep < maxStep) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      setError(err.message || `Step ${currentStep} validation failed. Please check your inputs.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Final submission
  const handleSubmitWizard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare payload with all form data
      const payload = prepareSubmissionPayload(formData);

      const response = await eventWizardAPI.submitEvent(payload);
      
      setSuccessMessage(`✓ Event "${response.name}" created successfully! Redirecting...`);
      
      // Redirect to event details page
      setTimeout(() => {
        navigate(`/events/${response.event_id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎪 Event Studio Wizard
          </h1>
          <p className="text-lg text-gray-600">
            Create and configure your {formData.event_type === 'ANNUAL_DAY' ? 'Annual Day Event' : formData.event_type === 'GIFTING' ? 'Gifting Program' : 'Event'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                    currentStep >= step.number
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step.number < currentStep ? '✓' : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Step Labels */}
          <div className="flex items-center justify-between text-sm">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`text-center ${
                  currentStep === step.number ? 'text-indigo-600 font-bold' : 'text-gray-600'
                }`}
              >
                <div>{step.icon}</div>
                <div className="text-xs mt-1">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ {successMessage}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              currentStep === 1 || loading
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            ← Previous
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {maxStep}
            </p>
          </div>

          <button
            onClick={currentStep === maxStep ? handleSubmitWizard : handleNext}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              loading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading && '⏳ '}
            {currentStep === maxStep ? 'Create Event' : 'Next →'}
          </button>
        </div>

        {/* Form Status */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p>
            <strong>Tip:</strong> Your progress is automatically saved. You can close
            this window and return to continue later.
          </p>
        </div>
      </div>
    </div>
  );
}
