import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { attendanceAPI } from '../services/api';
import { QrCode, CheckCircle, XCircle, User, Calendar, Building, Code } from 'lucide-react';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleScan = async (qrCode) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await attendanceAPI.scan(qrCode);
      setCandidate(response.data.candidate);
      setResult(response.data);
      toast.success(response.data.message);
      
      // Stop camera after successful scan
      stopCamera();
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error.response?.data?.error || 'Invalid QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = async (e) => {
    e.preventDefault();
    const qrCode = e.target.qrCode.value.trim();
    if (qrCode) {
      await handleScan(qrCode);
    }
  };

  const resetScan = () => {
    setResult(null);
    setCandidate(null);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Attendance Scanner
          </h1>
          <p className="text-gray-600">
            Scan QR codes to mark attendance
          </p>
        </div>

        {/* Scanner Interface */}
        {!result && (
          <div className="space-y-6">
            {/* Camera View */}
            {scanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-blue-500 w-48 h-48 rounded-lg relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="spinner mx-auto mb-2"></div>
                      <p>Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Camera not active</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex space-x-4">
              {!scanning ? (
                <button
                  onClick={startCamera}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Stop Camera
                </button>
              )}
            </div>

            {/* Manual Input */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Manual QR Code Entry</h3>
              <form onSubmit={handleManualInput} className="flex space-x-2">
                <input
                  type="text"
                  name="qrCode"
                  placeholder="Enter QR code manually"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Scan
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && candidate && (
          <div className="space-y-6">
            {/* Success/Error Indicator */}
            <div className={`text-center p-4 rounded-lg ${
              result.message.includes('successful') 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center justify-center mb-2">
                {result.message.includes('successful') ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <p className={`font-medium ${
                result.message.includes('successful') ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {result.message}
              </p>
            </div>

            {/* Candidate Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-4 mb-4">
                {candidate.selfie_path ? (
                  <img
                    src={`http://localhost:5000/uploads/${candidate.selfie_path}`}
                    alt={candidate.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{candidate.name}</h2>
                  <p className="text-gray-600">{candidate.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>{candidate.university}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Code className="h-4 w-4" />
                  <span>{candidate.skills}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {result.attendance.check_in_time 
                      ? `Checked in: ${new Date(result.attendance.check_in_time).toLocaleString()}`
                      : 'Not checked in yet'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={resetScan}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Scan Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner; 