/**
 * Step 4: Scheduling (Gifting Mode Only)
 * Configure pickup locations and time slot generation
 */

import React, { useState } from 'react';

export default function SchedulingStep({ data = {}, onChange }) {
  const [expandedLocation, setExpandedLocation] = useState(null);

  const handleAddLocation = () => {
    const locations = data.pickup_locations || [];
    locations.push({
      location_name: '',
      location_code: '',
      floor_number: '',
      building: '',
      capacity: 20
    });
    onChange({ ...data, pickup_locations: locations });
  };

  const handleRemoveLocation = (index) => {
    const locations = [...(data.pickup_locations || [])];
    locations.splice(index, 1);
    onChange({ ...data, pickup_locations: locations });
  };

  const handleLocationChange = (index, field, value) => {
    const locations = [...(data.pickup_locations || [])];
    locations[index][field] = field === 'capacity' ? parseInt(value) : value;
    onChange({ ...data, pickup_locations: locations });
  };

  const handleSlotConfigChange = (field, value) => {
    const slotConfig = data.slot_generation_config || {};
    onChange({
      ...data,
      slot_generation_config: {
        ...slotConfig,
        [field]: field === 'slot_duration_minutes' || field === 'persons_per_slot' || field === 'operating_start_hour' || field === 'operating_end_hour'
          ? parseInt(value)
          : value
      }
    });
  };

  const slotConfig = data.slot_generation_config || {
    slot_duration_minutes: 15,
    persons_per_slot: 20,
    operating_start_hour: 10,
    operating_end_hour: 18
  };

  const calculateExpectedSlots = () => {
    const duration = slotConfig.slot_duration_minutes;
    const totalHours = slotConfig.operating_end_hour - slotConfig.operating_start_hour;
    return Math.floor((totalHours * 60) / duration);
  };

  const expectedSlots = calculateExpectedSlots();
  const totalCapacity = expectedSlots * slotConfig.persons_per_slot;
  const locationsCount = (data.pickup_locations || []).length;
  const totalCapacityAllLocations = totalCapacity * locationsCount;

  return (
    <div className="space-y-8">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-orange-900 mb-2">⏰ Scheduling Configuration</h3>
        <p className="text-sm text-orange-800">
          Define pickup locations and time slot settings for your gifting program.
        </p>
      </div>

      {/* Time Slot Configuration */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">⏱️ Time Slot Settings</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slot Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <select
              value={slotConfig.slot_duration_minutes}
              onChange={(e) => handleSlotConfigChange('slot_duration_minutes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">How long each pickup slot lasts</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Persons Per Slot <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={slotConfig.persons_per_slot}
              onChange={(e) => handleSlotConfigChange('persons_per_slot', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max people per time slot</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operating Hours Start <span className="text-red-500">*</span>
            </label>
            <select
              value={slotConfig.operating_start_hour}
              onChange={(e) => handleSlotConfigChange('operating_start_hour', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operating Hours End <span className="text-red-500">*</span>
            </label>
            <select
              value={slotConfig.operating_end_hour}
              onChange={(e) => handleSlotConfigChange('operating_end_hour', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>

        {/* Slot Configuration Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h5 className="font-bold text-blue-900 mb-2">Slot Generation Preview</h5>
          <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <p className="text-gray-600">Operating Hours</p>
              <p className="font-bold">{slotConfig.operating_start_hour.toString().padStart(2, '0')}:00 - {slotConfig.operating_end_hour.toString().padStart(2, '0')}:00</p>
              <p className="text-xs text-gray-600">({slotConfig.operating_end_hour - slotConfig.operating_start_hour}h)</p>
            </div>
            <div>
              <p className="text-gray-600">Slots Per Location</p>
              <p className="font-bold">{expectedSlots} slots</p>
            </div>
            <div>
              <p className="text-gray-600">Capacity Per Location</p>
              <p className="font-bold">{totalCapacity} people</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Locations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900">Pickup Locations</h4>
          <button
            onClick={handleAddLocation}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            + Add Location
          </button>
        </div>

        {(data.pickup_locations || []).map((location, index) => (
          <div key={index} className="bg-white border border-gray-300 rounded-lg mb-4 overflow-hidden">
            <div
              onClick={() => setExpandedLocation(expandedLocation === index ? null : index)}
              className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
            >
              <div>
                <h5 className="font-bold text-gray-900">
                  {location.location_name || `Location ${index + 1}`}
                </h5>
                {location.location_code && (
                  <p className="text-sm text-gray-600">{location.location_code} • {location.building}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {expectedSlots} slots × {slotConfig.persons_per_slot} people
                </span>
                <span className="text-sm font-bold text-indigo-600">{expandedLocation === index ? '▼' : '▶'}</span>
              </div>
            </div>

            {expandedLocation === index && (
              <div className="border-t border-gray-300 p-4 bg-gray-50 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location.location_name}
                    onChange={(e) => handleLocationChange(index, 'location_name', e.target.value)}
                    placeholder="e.g., Conference Room 402, Main Lobby"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Code
                    </label>
                    <input
                      type="text"
                      value={location.location_code}
                      onChange={(e) => handleLocationChange(index, 'location_code', e.target.value)}
                      placeholder="e.g., CONF-402"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor Number
                    </label>
                    <input
                      type="text"
                      value={location.floor_number}
                      onChange={(e) => handleLocationChange(index, 'floor_number', e.target.value)}
                      placeholder="e.g., 4"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Building
                    </label>
                    <input
                      type="text"
                      value={location.building}
                      onChange={(e) => handleLocationChange(index, 'building', e.target.value)}
                      placeholder="e.g., Corporate Tower A"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Physical Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={location.capacity}
                      onChange={(e) => handleLocationChange(index, 'capacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used for scheduling validation</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedLocation(null)}
                    className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => handleRemoveLocation(index)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Remove Location
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-bold text-green-900 mb-2">📊 Scheduling Summary</h4>
        <div className="space-y-2 text-sm text-green-800">
          <p><strong>Pickup Locations:</strong> {locationsCount}</p>
          <p><strong>Slots Per Location:</strong> {expectedSlots}</p>
          <p><strong>Total Time Slots:</strong> {expectedSlots * locationsCount}</p>
          <p><strong>Total Capacity:</strong> {totalCapacityAllLocations} people</p>
          <div className="mt-3 p-2 bg-green-100 rounded text-xs">
            <p>With {locationsCount} location(s), {expectedSlots} slots per location, and {slotConfig.persons_per_slot} people per slot,</p>
            <p>you can accommodate up to <strong>{totalCapacityAllLocations}</strong> gift pickups.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
