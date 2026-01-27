/**
 * Phase 5: Day-of-Event Logistics - Scanner Component
 * Mobile-optimized QR scanning and gift distribution
 * 
 * Features:
 * - Real-time QR code scanning
 * - Instant status feedback (green ✓ / red ✗)
 * - Live inventory tracking
 * - Collection history
 * - Fraud prevention (double-scan alerts)
 */

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

const Scanner = () => {
  const [eventId, setEventId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [recentCollections, setRecentCollections] = useState([]);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'already_collected', 'error', null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize scanner
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eid = params.get('eventId');
    if (eid) {
      setEventId(eid);
      loadDashboard(eid);
    }
  }, []);

  // Load dashboard data
  const loadDashboard = async (eid) => {
    try {
      setLoading(true);
      const response = await fetch(`/scanner/event/${eid}/dashboard`, {
        headers: {
          'X-Tenant-ID': sessionStorage.getItem('tenant_id'),
        },
      });

      if (!response.ok) throw new Error('Failed to load dashboard');

      const data = await response.json();
      setInventory(data.inventory);
      setRecentCollections(data.recent_collections || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        scanQR();
      }
    } catch (err) {
      setError('Camera access denied');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setScanning(false);
  };

  // Scan QR code
  const scanQR = async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      await processQRCode(code.data);
    } else {
      // Continue scanning
      if (scanning) {
        requestAnimationFrame(scanQR);
      }
    }
  };

  // Process scanned QR code
  const processQRCode = async (qrToken) => {
    try {
      setLoading(true);

      const response = await fetch('/scanner/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': sessionStorage.getItem('tenant_id'),
        },
        body: JSON.stringify({
          qr_token: qrToken,
          event_id: eventId,
        }),
      });

      if (!response.ok) throw new Error('Failed to process QR');

      const result = await response.json();
      setLastScanResult(result);
      setScanStatus(result.status);

      // Flash feedback
      flashFeedback(result.status);

      // Refresh inventory
      await loadDashboard(eventId);

      // Auto-reset scanner after feedback
      setTimeout(() => {
        if (scanning) {
          scanQR();
        }
      }, 2000);
    } catch (err) {
      setError(err.message);
      setScanStatus('error');
      setTimeout(() => {
        if (scanning) {
          scanQR();
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Flash feedback
  const flashFeedback = (status) => {
    // Play sound
    if (status === 'SUCCESS') {
      playSound('success');
    } else if (status === 'ALREADY_COLLECTED') {
      playSound('error');
    }
  };

  // Play sound (optional)
  const playSound = (type) => {
    // In a real app, would play actual audio
    // For demo, just use console
    console.log(`Sound: ${type}`);
  };

  // Refresh inventory
  const handleRefresh = async () => {
    await loadDashboard(eventId);
  };

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Scanner</h1>
          <p className="text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">
              {inventory?.event_name || 'Event Scanner'}
            </h1>
            <p className="text-xs text-gray-400">Mobile Check-In</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Camera Section */}
        <div className="relative bg-black m-4 rounded-lg overflow-hidden">
          {!scanning ? (
            <div className="aspect-video flex flex-col items-center justify-center bg-gray-800">
              <button
                onClick={startCamera}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
              >
                📱 Start Camera
              </button>
              <p className="text-gray-400 text-sm mt-2">Open camera and point at QR codes</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-video"
              />
              <button
                onClick={stopCamera}
                className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Stop
              </button>
            </>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Scan Result Feedback */}
        {lastScanResult && (
          <div
            className={`mx-4 mb-4 p-4 rounded-lg border-2 ${
              scanStatus === 'SUCCESS'
                ? 'bg-green-900 border-green-500 text-green-100'
                : scanStatus === 'ALREADY_COLLECTED'
                ? 'bg-red-900 border-red-500 text-red-100'
                : 'bg-yellow-900 border-yellow-500 text-yellow-100'
            }`}
          >
            <div className="flex items-start">
              <div className="text-2xl mr-3">
                {scanStatus === 'SUCCESS' && '✅'}
                {scanStatus === 'ALREADY_COLLECTED' && '⚠️'}
                {scanStatus === 'ERROR' && '❌'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1">{lastScanResult.message}</p>
                {lastScanResult.user_name && (
                  <p className="text-sm">
                    <strong>User:</strong> {lastScanResult.user_name}
                  </p>
                )}
                {lastScanResult.option_name && (
                  <p className="text-sm">
                    <strong>Track:</strong> {lastScanResult.option_name}
                  </p>
                )}
                {scanStatus === 'SUCCESS' && (
                  <p className="text-sm mt-2">
                    <strong>Remaining:</strong> {lastScanResult.remaining_stock} in stock
                  </p>
                )}
                {scanStatus === 'ALREADY_COLLECTED' && (
                  <p className="text-sm mt-2">
                    <strong>Collected:</strong> {lastScanResult.collected_at}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Stats */}
        {inventory && (
          <div className="mx-4 mb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xs">Total Available</p>
                <p className="text-2xl font-bold">{inventory.total_available}</p>
              </div>
              <div className="bg-green-900 p-3 rounded-lg border border-green-600">
                <p className="text-gray-300 text-xs">Collected</p>
                <p className="text-2xl font-bold">{inventory.total_collected}</p>
              </div>
              <div className="bg-orange-900 p-3 rounded-lg border border-orange-600">
                <p className="text-gray-300 text-xs">Remaining</p>
                <p className="text-2xl font-bold">{inventory.total_remaining}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold">Collection Progress</p>
                <p className="text-sm text-green-400">{inventory.collection_percentage}%</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-300"
                  style={{ width: `${inventory.collection_percentage}%` }}
                />
              </div>
            </div>

            {/* By Track */}
            {inventory.options.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold mb-2">By Track</h3>
                <div className="space-y-2">
                  {inventory.options.map((option) => (
                    <div
                      key={option.option_id}
                      className="bg-gray-800 p-3 rounded border border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold">{option.option_name}</p>
                        <p className="text-xs text-gray-400">
                          {option.collected}/{option.total_available}
                        </p>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {option.remaining} remaining • {option.percentage}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Collections */}
        {recentCollections.length > 0 && (
          <div className="mx-4 mb-4">
            <h3 className="text-sm font-bold mb-2">Recent Collections</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentCollections.map((collection) => (
                <div
                  key={collection.request_id}
                  className="bg-gray-800 p-3 rounded border border-gray-700 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{collection.user_name}</p>
                      <p className="text-xs text-gray-400">{collection.option_name}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(collection.collected_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-100 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mx-4 mb-4 p-3 bg-blue-900 border border-blue-600 rounded text-blue-100 text-sm">
            Processing...
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
