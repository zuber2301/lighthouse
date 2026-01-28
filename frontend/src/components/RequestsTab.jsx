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
        <p className="text-text-secondary">Loading approval requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Header Section */}
      <div className="px-8 py-10 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-main)' }}>
          Approval Inbox
        </h2>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Review and approve work-hour commitments for your team
        </p>
      </div>

      {/* Stats Section - PDF Design */}
      {requests.length > 0 && (
        <div className="px-8 py-10 grid grid-cols-3 gap-6">
          {/* Pending Requests */}
          <div
            className="p-8 rounded-lg border transition-all duration-300 hover:border-accent"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(99, 102, 241, 0.06)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.12), 0 12px 32px rgba(99, 102, 241, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(99, 102, 241, 0.06)')}
          >
            <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              PENDING REQUESTS
            </p>
            <p className="text-6xl font-black mb-2" style={{ color: 'var(--accent)' }}>
              {requests.length}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {requests.length === 1 ? 'request' : 'requests'} awaiting action
            </p>
          </div>

          {/* Total Impact Hours */}
          <div
            className="p-8 rounded-lg border transition-all duration-300 hover:border-accent-teal"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(20, 184, 166, 0.06)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.12), 0 12px 32px rgba(20, 184, 166, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(20, 184, 166, 0.06)')}
          >
            <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              TOTAL IMPACT HOURS
            </p>
            <p className="text-6xl font-black mb-2" style={{ color: 'var(--accent-teal)' }}>
              {requests.reduce((sum, r) => sum + parseFloat(r.total_impact_hours), 0).toFixed(1)}h
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              total commitment
            </p>
          </div>

          {/* Estimated Budget */}
          <div
            className="p-8 rounded-lg border transition-all duration-300 hover:border-accent-orange"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(249, 115, 22, 0.06)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.12), 0 12px 32px rgba(249, 115, 22, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(249, 115, 22, 0.06)')}
          >
            <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              ESTIMATED BUDGET
            </p>
            <p className="text-6xl font-black mb-2" style={{ color: 'var(--accent-orange)' }}>
              $
              {requests
                .reduce((sum, r) => sum + (r.estimated_cost || 0), 0)
                .toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              allocated funding
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="mx-8 mt-8 rounded-lg p-4 border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--error)',
            color: 'var(--error)',
          }}
        >
          {error}
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div
          className="mx-8 mt-8 text-center py-16 rounded-lg border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
          }}
        >
          <p className="text-lg" style={{ color: 'var(--text-main)' }}>
            No pending approval requests
          </p>
          <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
            Check back later!
          </p>
        </div>
      ) : (
        <div className="px-8 py-10 space-y-4">
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
    <div
      className="border rounded-lg p-8 transition-all duration-300 cursor-default"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* User and Event Info */}
          <div className="mb-6">
            <p className="font-black text-xl" style={{ color: '#1A1A1A' }}>
              {request.user_name}
            </p>
            <p className="text-sm mt-2" style={{ color: '#4D4D4D' }}>
              {request.user_email}
            </p>
          </div>

          {/* Request Details */}
          <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-base" style={{ color: '#4D4D4D' }}>
              wants to join <span className="font-black" style={{ color: '#1A1A1A' }}>{request.event_name}</span>
            </p>
            <p className="text-base mt-2" style={{ color: '#4D4D4D' }}>
              Track: <span className="font-black" style={{ color: '#1A1A1A' }}>{request.option_name}</span>
            </p>
          </div>

          {/* Impact Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-block text-xs font-bold px-5 py-3 rounded-md transition-all" 
              style={{
                backgroundColor: '#f3f0ff',
                color: '#6366F1',
                border: '1.5px solid #6366F1',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.12)',
              }}
            >
              <span className="font-black">{request.impact_hours_per_week}h</span>/wk × {request.impact_duration_weeks} wks
            </span>
            <span className="text-lg font-black" style={{ color: '#1A1A1A' }}>
              = <span style={{ color: 'var(--accent)' }}>{request.total_impact_hours}h</span>
            </span>
          </div>

          {/* Timestamp */}
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Requested {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="ml-8 flex gap-2 flex-shrink-0">
          <button
            onClick={() => onApprove(request.id)}
            disabled={loading}
            className="px-6 py-3 text-white rounded font-black transition-all duration-200 text-sm whitespace-nowrap"
            style={{
              backgroundColor: 'var(--success)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(22, 163, 74, 0.25)',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 8px 20px rgba(22, 163, 74, 0.35)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.25)')}
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onDecline(request.id)}
            disabled={loading}
            className="px-6 py-3 text-white rounded font-black transition-all duration-200 text-sm whitespace-nowrap"
            style={{
              backgroundColor: 'var(--error)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(220, 38, 38, 0.25)',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.35)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.25)')}
          >
            ✕ Decline
          </button>
          <button
            onClick={() => onViewDetails()}
            className="px-6 py-3 border rounded font-black transition-all duration-200 text-sm whitespace-nowrap"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: '#1A1A1A',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-light)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
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
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 border-b p-8 flex justify-between items-center"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <h3 className="text-3xl font-black" style={{ color: '#1A1A1A' }}>
            {showApprovalUI && 'Approval Request Details'}
            {showApprovedUI && <span style={{ color: 'var(--success)' }}>✓ Request Approved!</span>}
            {showDeclinedUI && <span style={{ color: 'var(--error)' }}>Request Declined</span>}
          </h3>
          <button
            onClick={onClose}
            className="text-base transition duration-200 p-2 rounded cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-main)';
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-10">
          {/* Approval View */}
          {showApprovalUI && (
            <>
              {/* Request Details */}
              <div
                className="mb-8 p-8 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <h4 className="font-black text-xl mb-6" style={{ color: '#1A1A1A' }}>
                  Request Details
                </h4>
                <div className="grid grid-cols-2 gap-8 text-base">
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>User</p>
                    <p className="font-medium mt-1" style={{ color: 'var(--text-main)' }}>
                      {request.user_name}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>{request.user_email}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>Event</p>
                    <p className="font-medium mt-1" style={{ color: 'var(--text-main)' }}>
                      {request.event_name}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>Track/Option</p>
                    <p className="font-medium mt-1" style={{ color: 'var(--text-main)' }}>
                      {request.option_name}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>Time Impact</p>
                    <p className="font-medium mt-1" style={{ color: 'var(--text-main)' }}>
                      {request.total_impact_hours}h total
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
                      {request.impact_hours_per_week}h/week × {request.impact_duration_weeks} weeks
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="mb-8">
                <label className="block text-base font-black mb-3" style={{ color: '#1A1A1A' }}>
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  className="w-full rounded-lg p-4 text-base focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    '--tw-ring-color': 'var(--accent)',
                  }}
                  rows="4"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-10">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border rounded-lg font-black transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: '#E0E0E0',
                    color: '#4D4D4D',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0F0F0';
                    e.currentTarget.style.borderColor = '#D0D0D0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = '#E0E0E0';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDecline(request.id)}
                  disabled={loading}
                  className="px-8 py-3 text-white rounded-lg font-black transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--error)',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 2px 8px rgba(220, 38, 38, 0.25)',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.35)')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.25)')}
                >
                  ✕ Decline
                </button>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={loading}
                  className="px-8 py-3 text-white rounded-lg font-black transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--success)',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 2px 8px rgba(22, 163, 74, 0.25)',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 8px 20px rgba(22, 163, 74, 0.35)')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.25)')}
                >
                  ✓ Approve
                </button>
              </div>
            </>
          )}

          {/* Approved View - QR Code */}
          {showApprovedUI && (
            <div className="text-center">
              <div className="mb-6">
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--success)' }}>
                  Approved!
                </h4>
                <p style={{ color: 'var(--text-main)' }}>
                  {request.user_name} is approved for {request.option_name}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                {request.qr_code_url && (
                  <img
                    src={request.qr_code_url}
                    alt="QR Code"
                    className="w-56 h-56 rounded-lg"
                    style={{ border: '3px solid var(--border-color)' }}
                  />
                )}
              </div>

              {/* QR Token */}
              <div
                className="mb-6 p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-2">
                  QR Code Token
                </p>
                <p className="font-mono text-base break-all" style={{ color: 'var(--text-main)' }}>
                  {request.qr_token}
                </p>
              </div>

              {/* Instructions */}
              <div
                className="rounded-lg p-4 text-left mb-6"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  opacity: 0.9,
                }}
              >
                <h5 className="font-bold mb-3" style={{ color: 'var(--text-main)' }}>
                  Next Steps
                </h5>
                <ul style={{ color: 'var(--text-secondary)' }} className="text-base space-y-2">
                  <li>✓ An email with the QR code has been sent to {request.user_name}</li>
                  <li>✓ User should save/print the QR code for the event</li>
                  <li>✓ QR code will be scanned at pickup location</li>
                  <li>✓ Budget of ${request.estimated_cost} has been committed</li>
                </ul>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="px-6 py-2 text-white rounded-lg font-medium w-full transition-all duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'var(--accent)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}

              >
                Close
              </button>
            </div>
          )}

          {/* Declined View - Alternatives */}
          {showDeclinedUI && (
            <div>
              <div
                className="mb-6 p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--error)',
                }}
              >
                <h4 className="font-bold mb-2" style={{ color: 'var(--error)' }}>
                  Request Declined
                </h4>
                <p style={{ color: 'var(--error)' }} className="text-base">
                  {request.decline_reason || 'The request has been declined.'}
                </p>
              </div>

              {/* Alternatives */}
              {request.alternatives && request.alternatives.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold mb-4" style={{ color: 'var(--text-main)' }}>
                    Suggested Alternatives
                  </h4>
                  <div className="space-y-3">
                    {request.alternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-4 border rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-color)',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'var(--card-bg)')
                        }
                      >
                        <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                          {alt.name}
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-base mt-2">
                          {alt.description}
                        </p>
                        <p style={{ color: 'var(--success)' }} className="text-base mt-2">
                          {alt.available_slots} slots available
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div
                className="rounded-lg p-4 text-left mb-6"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <p style={{ color: 'var(--text-main)' }} className="text-base">
                  An email notification has been sent to <strong>{request.user_name}</strong> with:
                </p>
                <ul style={{ color: 'var(--text-secondary)' }} className="text-base space-y-2 mt-3 ml-4">
                  <li>✓ Decline reason</li>
                  <li>✓ Alternative event options</li>
                  <li>✓ Link to Event Studio</li>
                </ul>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="px-6 py-2 text-white rounded-lg font-medium w-full transition-all duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'var(--accent)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
