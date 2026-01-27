/**
 * Phase 4: Approval Inbox Component
 * Shows pending approval requests for tenant leads (David)
 * Features:
 * - View all pending requests with impact hours
 * - Approve/decline with notes
 * - QR code display on approval
 * - Alternative options on decline
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const RequestsTab = () => {
  const { eventId } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'decline'
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/approvals/pending', {
        headers: {
          'X-Tenant-ID': sessionStorage.getItem('tenant_id'),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch requests');

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setLoadingAction(true);
      const response = await fetch(`/approvals/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': sessionStorage.getItem('tenant_id'),
        },
        body: JSON.stringify({
          decision: 'APPROVE',
          notes: actionNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed to approve request');

      const approvedRequest = await response.json();

      // Show QR code modal
      setSelectedRequest(approvedRequest);
      setActionType('approved');
      setShowModal(true);

      // Refresh list
      await fetchPendingRequests();
      setActionNotes('');
    } catch (err) {
      setError(err.message);
      console.error('Error approving request:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      setLoadingAction(true);
      const response = await fetch(`/approvals/${requestId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': sessionStorage.getItem('tenant_id'),
        },
        body: JSON.stringify({
          decision: 'DECLINE',
          notes: actionNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed to decline request');

      const result = await response.json();

      // Show alternatives modal
      setSelectedRequest(result);
      setActionType('declined');
      setShowModal(true);

      // Refresh list
      await fetchPendingRequests();
      setActionNotes('');
    } catch (err) {
      setError(err.message);
      console.error('Error declining request:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Loading approval requests...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Approval Inbox</h2>
        <p className="text-gray-600 mt-1">
          Review and approve work-hour commitments for your team
        </p>
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Pending Requests</p>
            <p className="text-3xl font-bold text-blue-600">{requests.length}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Total Impact Hours</p>
            <p className="text-3xl font-bold text-orange-600">
              {requests.reduce((sum, r) => sum + parseFloat(r.total_impact_hours), 0).toFixed(1)}h
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No pending approval requests</p>
          <p className="text-gray-500 text-sm mt-2">Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onDecline={handleDecline}
              onViewDetails={() => {
                setSelectedRequest(request);
                setActionType('view');
                setShowModal(true);
              }}
              loading={loadingAction}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRequest && (
        <RequestModal
          request={selectedRequest}
          actionType={actionType}
          onClose={() => {
            setShowModal(false);
            setSelectedRequest(null);
            setActionNotes('');
          }}
          onApprove={handleApprove}
          onDecline={handleDecline}
          actionNotes={actionNotes}
          onNotesChange={setActionNotes}
          loading={loadingAction}
        />
      )}
    </div>
  );
};

// Request Card Component
const RequestCard = ({ request, onApprove, onDecline, onViewDetails, loading }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* User and Event Info */}
          <div className="mb-3">
            <p className="font-semibold text-gray-900">{request.user_name}</p>
            <p className="text-sm text-gray-600">{request.user_email}</p>
          </div>

          {/* Request Details */}
          <div className="mb-3">
            <p className="text-sm text-gray-700">
              wants to join <span className="font-medium">{request.event_name}</span>
            </p>
            <p className="text-sm text-gray-700">
              Track: <span className="font-medium">{request.option_name}</span>
            </p>
          </div>

          {/* Impact Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">
              {request.impact_hours_per_week}h/week × {request.impact_duration_weeks} weeks
            </span>
            <span className="text-sm font-semibold text-orange-600">
              = {request.total_impact_hours}h total
            </span>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-500">
            Requested {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="ml-4 flex gap-2">
          <button
            onClick={() => onApprove(request.id)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
          >
            Approve
          </button>
          <button
            onClick={() => onDecline(request.id)}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
          >
            Decline
          </button>
          <button
            onClick={() => onViewDetails()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Request Modal Component
const RequestModal = ({
  request,
  actionType,
  onClose,
  onApprove,
  onDecline,
  actionNotes,
  onNotesChange,
  loading,
}) => {
  const showApprovalUI = actionType === 'view' || actionType === null;
  const showApprovedUI = actionType === 'approved';
  const showDeclinedUI = actionType === 'declined';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold">
            {showApprovalUI && 'Approval Request Details'}
            {showApprovedUI && '✓ Request Approved!'}
            {showDeclinedUI && 'Request Declined'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Approval View */}
          {showApprovalUI && (
            <>
              {/* Request Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">User</p>
                    <p className="font-medium">{request.user_name}</p>
                    <p className="text-gray-500">{request.user_email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Event</p>
                    <p className="font-medium">{request.event_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Track/Option</p>
                    <p className="font-medium">{request.option_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Impact</p>
                    <p className="font-medium">{request.total_impact_hours}h total</p>
                    <p className="text-gray-500">
                      {request.impact_hours_per_week}h/week × {request.impact_duration_weeks} weeks
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDecline(request.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                >
                  Decline Request
                </button>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                >
                  Approve Request
                </button>
              </div>
            </>
          )}

          {/* Approved View - QR Code */}
          {showApprovedUI && (
            <div className="text-center">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-600 mb-2">Approved!</h4>
                <p className="text-gray-600">
                  {request.user_name} is approved for {request.option_name}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                {request.qr_code_url && (
                  <img
                    src={request.qr_code_url}
                    alt="QR Code"
                    className="w-56 h-56 border-4 border-gray-200 rounded-lg"
                  />
                )}
              </div>

              {/* QR Token */}
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">QR Code Token</p>
                <p className="font-mono text-sm break-all text-gray-800">
                  {request.qr_token}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h5 className="font-semibold text-blue-900 mb-2">Next Steps</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ An email with the QR code has been sent to {request.user_name}</li>
                  <li>✓ User should save/print the QR code for the event</li>
                  <li>✓ QR code will be scanned at pickup location</li>
                  <li>✓ Budget of ${request.estimated_cost} has been committed</li>
                </ul>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium w-full"
              >
                Close
              </button>
            </div>
          )}

          {/* Declined View - Alternatives */}
          {showDeclinedUI && (
            <div>
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">Request Declined</h4>
                <p className="text-red-800 text-sm">
                  {request.decline_reason || 'The request has been declined.'}
                </p>
              </div>

              {/* Alternatives */}
              {request.alternatives && request.alternatives.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Suggested Alternatives
                  </h4>
                  <div className="space-y-3">
                    {request.alternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <p className="font-medium text-gray-900">{alt.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {alt.description}
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          {alt.available_slots} slots available
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700">
                  An email notification has been sent to <strong>{request.user_name}</strong> with:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mt-2 ml-4">
                  <li>✓ Decline reason</li>
                  <li>✓ Alternative event options</li>
                  <li>✓ Link to Event Studio</li>
                </ul>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium w-full"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsTab;
