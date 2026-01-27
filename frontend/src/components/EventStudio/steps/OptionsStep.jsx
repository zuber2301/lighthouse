/**
 * Step 3: Event Options
 * Handles both Annual Day (tracks + volunteer tasks) and Gifting (gift items) modes
 */

import React, { useState } from 'react';

export default function OptionsStep({ data = {}, eventType, onChange, onImageUpload }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddTrack = () => {
    const tracks = data.tracks || [];
    tracks.push({
      track_name: '',
      total_slots: 1,
      duration_minutes: 30,
      description: ''
    });
    onChange({ ...data, tracks });
  };

  const handleRemoveTrack = (index) => {
    const tracks = [...(data.tracks || [])];
    tracks.splice(index, 1);
    onChange({ ...data, tracks });
  };

  const handleTrackChange = (index, field, value) => {
    const tracks = [...(data.tracks || [])];
    tracks[index][field] = value;
    onChange({ ...data, tracks });
  };

  const handleAddTask = () => {
    const tasks = data.volunteer_tasks || [];
    tasks.push({
      task_name: '',
      required_volunteers: 1,
      duration_minutes: 60,
      description: ''
    });
    onChange({ ...data, volunteer_tasks: tasks });
  };

  const handleRemoveTask = (index) => {
    const tasks = [...(data.volunteer_tasks || [])];
    tasks.splice(index, 1);
    onChange({ ...data, volunteer_tasks: tasks });
  };

  const handleTaskChange = (index, field, value) => {
    const tasks = [...(data.volunteer_tasks || [])];
    tasks[index][field] = value;
    onChange({ ...data, volunteer_tasks: tasks });
  };

  const handleAddGift = () => {
    const gifts = data.gift_items || [];
    gifts.push({
      item_name: '',
      total_quantity: 1,
      unit_cost: 0,
      gift_image_url: '',
      image_file_key: '',
      description: ''
    });
    onChange({ ...data, gift_items: gifts });
  };

  const handleRemoveGift = (index) => {
    const gifts = [...(data.gift_items || [])];
    gifts.splice(index, 1);
    onChange({ ...data, gift_items: gifts });
  };

  const handleGiftChange = (index, field, value) => {
    const gifts = [...(data.gift_items || [])];
    gifts[index][field] = value;
    onChange({ ...data, gift_items: gifts });
  };

  const handleImageUpload = async (giftIndex, file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await onImageUpload(file);
      
      const gifts = [...(data.gift_items || [])];
      gifts[giftIndex].gift_image_url = result.url;
      gifts[giftIndex].image_file_key = result.file_key;
      onChange({ ...data, gift_items: gifts });
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalGifts = () => {
    return (data.gift_items || []).reduce((sum, gift) => sum + parseInt(gift.total_quantity || 0), 0);
  };

  const calculateTotalGiftsValue = () => {
    return (data.gift_items || []).reduce(
      (sum, gift) => sum + (parseFloat(gift.unit_cost || 0) * parseInt(gift.total_quantity || 0)),
      0
    );
  };

  if (eventType === 'ANNUAL_DAY') {
    return (
      <div className="space-y-8">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-purple-900 mb-2">🎭 Annual Day Options</h3>
          <p className="text-sm text-purple-800">
            Add performance tracks and volunteer tasks for your event.
          </p>
        </div>

        {/* Performance Tracks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900">Performance Tracks</h4>
            <button
              onClick={handleAddTrack}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              + Add Track
            </button>
          </div>

          {(data.tracks || []).map((track, index) => (
            <div key={index} className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between mb-4">
                <h5 className="font-bold text-gray-900">Track #{index + 1}</h5>
                <button
                  onClick={() => handleRemoveTrack(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={track.track_name}
                  onChange={(e) => handleTrackChange(index, 'track_name', e.target.value)}
                  placeholder="Track name (e.g., Dance, Music, Drama)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <textarea
                  value={track.description}
                  onChange={(e) => handleTrackChange(index, 'description', e.target.value)}
                  placeholder="Track description"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Slots
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={track.total_slots}
                      onChange={(e) => handleTrackChange(index, 'total_slots', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={track.duration_minutes}
                      onChange={(e) => handleTrackChange(index, 'duration_minutes', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Volunteer Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900">Volunteer Tasks</h4>
            <button
              onClick={handleAddTask}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              + Add Task
            </button>
          </div>

          {(data.volunteer_tasks || []).map((task, index) => (
            <div key={index} className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between mb-4">
                <h5 className="font-bold text-gray-900">Task #{index + 1}</h5>
                <button
                  onClick={() => handleRemoveTask(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={task.task_name}
                  onChange={(e) => handleTaskChange(index, 'task_name', e.target.value)}
                  placeholder="Task name (e.g., Stage Setup, Ushering)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <textarea
                  value={task.description}
                  onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                  placeholder="Task description"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Volunteers
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={task.required_volunteers}
                      onChange={(e) => handleTaskChange(index, 'required_volunteers', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={task.duration_minutes}
                      onChange={(e) => handleTaskChange(index, 'duration_minutes', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-bold text-green-900 mb-2">Summary</h4>
          <div className="space-y-1 text-sm text-green-800">
            <p><strong>Performance Tracks:</strong> {(data.tracks || []).length}</p>
            <p><strong>Total Slots:</strong> {(data.tracks || []).reduce((sum, t) => sum + t.total_slots, 0)}</p>
            <p><strong>Volunteer Tasks:</strong> {(data.volunteer_tasks || []).length}</p>
            <p><strong>Total Volunteers Needed:</strong> {(data.volunteer_tasks || []).reduce((sum, t) => sum + t.required_volunteers, 0)}</p>
          </div>
        </div>
      </div>
    );
  }

  // GIFTING Mode
  return (
    <div className="space-y-8">
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-pink-900 mb-2">🎁 Gifting Options</h3>
        <p className="text-sm text-pink-800">
          Add gift items with images and costs. Images will be displayed to participants.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900">Gift Items</h4>
        <button
          onClick={handleAddGift}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          + Add Gift
        </button>
      </div>

      {(data.gift_items || []).map((gift, index) => (
        <div key={index} className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-4">
            <h5 className="font-bold text-gray-900">Gift #{index + 1}</h5>
            <button
              onClick={() => handleRemoveGift(index)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={gift.item_name}
              onChange={(e) => handleGiftChange(index, 'item_name', e.target.value)}
              placeholder="Gift name (e.g., Corporate Mug, Backpack)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <textarea
              value={gift.description}
              onChange={(e) => handleGiftChange(index, 'description', e.target.value)}
              placeholder="Gift description"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gift Image <span className="text-red-500">*</span>
              </label>
              {gift.gift_image_url ? (
                <div className="relative mb-3">
                  <img
                    src={gift.gift_image_url}
                    alt="Gift preview"
                    className="w-32 h-32 object-cover rounded border border-gray-300"
                  />
                  <button
                    onClick={() => handleGiftChange(index, 'gift_image_url', '')}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(index, file);
                  }
                }}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">Max 5MB, JPEG/PNG/WebP</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={gift.total_quantity}
                  onChange={(e) => handleGiftChange(index, 'total_quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={gift.unit_cost}
                  onChange={(e) => handleGiftChange(index, 'unit_cost', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-2 rounded text-sm">
              <strong>Subtotal:</strong> ₹{((gift.unit_cost || 0) * (gift.total_quantity || 0)).toFixed(2)}
            </div>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-bold text-green-900 mb-2">Summary</h4>
        <div className="space-y-1 text-sm text-green-800">
          <p><strong>Total Gift Items:</strong> {(data.gift_items || []).length}</p>
          <p><strong>Total Gifts (all quantities):</strong> {calculateTotalGifts()}</p>
          <p><strong>Total Gift Value:</strong> ₹{calculateTotalGiftsValue().toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
