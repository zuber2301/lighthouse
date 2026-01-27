/**
 * Step 5 (Gifting) / Step 4 (Annual Day): Review & Submit
 * Final review of all configuration before submission
 */

import React from 'react';

export default function ReviewStep({ data = {}, eventType, isSubmitting = false, onSubmit }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-indigo-900 mb-2">✅ Review & Submit</h3>
        <p className="text-sm text-indigo-800">
          Please review all configuration details before submitting your event.
        </p>
      </div>

      {/* Budget Summary */}
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          💰 Budget
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Budget Amount:</span>
            <span className="font-bold">{formatCurrency(data.event_budget_amount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cost Type:</span>
            <span className="font-bold">{data.cost_type || 'Not set'}</span>
          </div>
          {data.budget_description && (
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-semibold">{data.budget_description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Event Information */}
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          📋 Event Information
        </h4>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Event Name:</p>
            <p className="font-bold text-gray-900">{data.name || 'Not set'}</p>
          </div>

          <div>
            <p className="text-gray-600 mb-1">Event Type:</p>
            <p className="font-bold text-gray-900">
              {eventType === 'ANNUAL_DAY' ? '🎭 Annual Day' : '🎁 Gifting Program'}
            </p>
          </div>

          {data.description && (
            <div>
              <p className="text-gray-600 mb-1">Description:</p>
              <p className="text-gray-900">{data.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-gray-600 text-xs">Registration Starts</p>
              <p className="font-semibold text-gray-900">{formatDate(data.registration_start_date)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Registration Ends</p>
              <p className="font-semibold text-gray-900">{formatDate(data.registration_end_date)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Event Date</p>
              <p className="font-semibold text-gray-900">{formatDate(data.event_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Annual Day Options */}
      {eventType === 'ANNUAL_DAY' && (
        <div className="space-y-4">
          {/* Performance Tracks */}
          {(data.tracks || []).length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-4">🎭 Performance Tracks ({(data.tracks || []).length})</h4>
              <div className="space-y-3">
                {data.tracks.map((track, idx) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                    <p className="font-bold text-gray-900">{track.track_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{track.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {track.total_slots} slots • {track.duration_minutes} min each
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer Tasks */}
          {(data.volunteer_tasks || []).length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-4">👥 Volunteer Tasks ({(data.volunteer_tasks || []).length})</h4>
              <div className="space-y-3">
                {data.volunteer_tasks.map((task, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-bold text-gray-900">{task.task_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {task.required_volunteers} volunteers needed • {task.duration_minutes} min each
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gifting Options */}
      {eventType === 'GIFTING' && (
        <div className="space-y-4">
          {/* Gift Items */}
          {(data.gift_items || []).length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-4">🎁 Gift Items ({(data.gift_items || []).length})</h4>
              <div className="space-y-4">
                {data.gift_items.map((gift, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3 flex gap-4">
                    {gift.gift_image_url && (
                      <img
                        src={gift.gift_image_url}
                        alt={gift.item_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{gift.item_name}</p>
                      {gift.description && (
                        <p className="text-sm text-gray-600 mt-1">{gift.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          Qty: <strong>{gift.total_quantity}</strong>
                        </span>
                        <span className="text-gray-600">
                          Unit: <strong>{formatCurrency(gift.unit_cost)}</strong>
                        </span>
                        <span className="text-indigo-600 font-bold">
                          Subtotal: {formatCurrency(gift.unit_cost * gift.total_quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduling Configuration */}
          {(data.pickup_locations || []).length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-4">⏰ Pickup Locations ({(data.pickup_locations || []).length})</h4>
              
              {data.slot_generation_config && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Time Slot Configuration:</p>
                  <div className="grid grid-cols-4 gap-2 text-xs text-blue-800">
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-bold">{data.slot_generation_config.slot_duration_minutes} min</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Per Slot</p>
                      <p className="font-bold">{data.slot_generation_config.persons_per_slot} people</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Operating</p>
                      <p className="font-bold">{String(data.slot_generation_config.operating_start_hour).padStart(2, '0')}:00 - {String(data.slot_generation_config.operating_end_hour).padStart(2, '0')}:00</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {data.pickup_locations.map((loc, idx) => (
                  <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
                    <p className="font-bold text-gray-900">{loc.location_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {loc.location_code} • {loc.building} • Floor {loc.floor_number}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Section */}
      <div className="border-t-2 border-gray-300 pt-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-yellow-900 mb-2">⚠️ Before You Submit</h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Verify all dates are correct and in logical order</li>
            <li>Check that budget is sufficient for all items/options</li>
            <li>Ensure pickup locations are accessible to participants</li>
            <li>Confirm all images are uploaded (for gifting mode)</li>
          </ul>
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin">⏳</span>
              Submitting Event...
            </>
          ) : (
            <>
              ✓ Submit Event
            </>
          )}
        </button>
      </div>
    </div>
  );
}
