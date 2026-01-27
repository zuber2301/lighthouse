/**
 * Step 2: Basic Event Information
 */

import React from 'react';

export default function BasicInfoStep({ data = {}, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value
    });
  };

  const eventType = data.event_type;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-blue-900 mb-2">📋 Event Details</h3>
        <p className="text-sm text-blue-800">
          Provide basic information about your event and select the event type.
        </p>
      </div>

      {/* Event Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={data.name || ''}
          onChange={handleChange}
          placeholder="e.g., Annual Day 2024, Summer Gifting Program"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Event Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          name="description"
          value={data.description || ''}
          onChange={handleChange}
          placeholder="Provide details about your event..."
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Event Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Event Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => handleChange({ target: { name: 'event_type', value: 'ANNUAL_DAY' } })}
            className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
              eventType === 'ANNUAL_DAY'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">🎭</div>
            <h4 className="font-bold text-gray-900 mb-1">Annual Day</h4>
            <p className="text-sm text-gray-600">
              Celebration with performance tracks and volunteer tasks
            </p>
          </div>

          <div
            onClick={() => handleChange({ target: { name: 'event_type', value: 'GIFTING' } })}
            className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
              eventType === 'GIFTING'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">🎁</div>
            <h4 className="font-bold text-gray-900 mb-1">Gifting Program</h4>
            <p className="text-sm text-gray-600">
              Distribute gifts with scheduled pickup locations
            </p>
          </div>
        </div>
      </div>

      {/* Event Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          name="event_date"
          value={data.event_date || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Registration Window */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Starts <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="registration_start_date"
            value={data.registration_start_date || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Ends <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="registration_end_date"
            value={data.registration_end_date || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Summary */}
      {data.name && eventType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-2">Event Preview</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Type:</strong> {eventType === 'ANNUAL_DAY' ? '🎭 Annual Day' : '🎁 Gifting Program'}</p>
            {data.event_date && (
              <p><strong>Date:</strong> {new Date(data.event_date).toLocaleDateString()} at {new Date(data.event_date).toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
