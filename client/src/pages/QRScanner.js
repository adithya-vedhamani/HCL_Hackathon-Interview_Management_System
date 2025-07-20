import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { attendanceAPI } from '../services/api';
import { QrCode, CheckCircle, XCircle, User, Calendar, Building, Code, Camera, CameraOff, RotateCcw, Zap } from 'lucide-react';

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
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 overflow-hidden">
      <div className="h-full max-w-2xl mx-auto flex flex-col space-y-4">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-shrink-0">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-6 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-1">
                Attendance Scanner
              </h1>
              <p className="text-purple-100 text-sm">
                Scan QR codes to mark attendance with precision
              </p>
            </div>
          </div>
        </div>

        {/* Scanner Interface */}
        {!result && (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* Enhanced Camera View */}
            {scanning ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-1">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-purple-100">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Camera className="h-5 w-5 mr-2 text-purple-600" />
                    Live Camera Feed
                  </h3>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="relative flex-1">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover rounded-xl border-2 border-purple-200 shadow-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-4 border-purple-500 w-64 h-64 rounded-2xl relative shadow-2xl">
                        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-lg"></div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-lg"></div>
                        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-lg"></div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-lg"></div>
                      </div>
                    </div>
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-white mx-auto mb-4"></div>
                          <p className="text-lg font-semibold">Processing QR Code...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                          ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-1">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <CameraOff className="h-5 w-5 mr-2 text-gray-600" />
                      Camera Inactive
                    </h3>
                  </div>
                  <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 mb-4">
                      <QrCode className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-base font-medium">Camera not active</p>
                    <p className="text-gray-500 mt-1 text-sm">Click "Start Camera" to begin scanning</p>
                  </div>
                </div>
              )}

            {/* Enhanced Controls */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-shrink-0">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-purple-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-purple-600" />
                  Scanner Controls
                </h3>
              </div>
              <div className="p-4">
                <div className="flex space-x-4">
                  {!scanning ? (
                    <button
                      onClick={startCamera}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      <CameraOff className="h-5 w-5 mr-2" />
                      Stop Camera
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Manual Input */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-shrink-0">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border-b border-emerald-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Code className="h-5 w-5 mr-2 text-emerald-600" />
                  Manual QR Code Entry
                </h3>
              </div>
              <div className="p-4">
                <form onSubmit={handleManualInput} className="flex space-x-4">
                  <input
                    type="text"
                    name="qrCode"
                    placeholder="Enter QR code manually..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-gray-50 hover:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                  >
                    Scan
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Result Display */}
        {result && candidate && (
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
            {/* Enhanced Success/Error Indicator */}
            <div className={`rounded-2xl shadow-xl border overflow-hidden flex-shrink-0 ${
              result.message.includes('successful') 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
            }`}>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center mb-3">
                  {result.message.includes('successful') ? (
                    <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <p className={`text-lg font-bold ${
                  result.message.includes('successful') ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>

            {/* Enhanced Candidate Details */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-1">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-purple-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Candidate Details
                </h3>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-center space-x-4 mb-4">
                  {candidate.selfie_path ? (
                    <img
                      src={`http://localhost:5001/uploads/${candidate.selfie_path}`}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-purple-100 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center border-2 border-purple-200">
                      <User className="h-8 w-8 text-purple-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{candidate.name}</h2>
                    <p className="text-gray-600 text-sm">{candidate.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Building className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{candidate.university}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Code className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{candidate.skills}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {result.attendance.check_in_time 
                        ? `Checked in: ${new Date(result.attendance.check_in_time).toLocaleString()}`
                        : 'Not checked in yet'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-shrink-0">
              <div className="p-4">
                <button
                  onClick={resetScan}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Scan Another QR Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner; 