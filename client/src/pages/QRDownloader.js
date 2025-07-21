import React, { useEffect, useState } from 'react';
import { candidatesAPI } from '../services/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { QrCode, Users } from 'lucide-react';

const QRDownloader = () => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      setIsLoading(true);
      try {
        const response = await candidatesAPI.getAll({ limit: 1000 });
        setCandidates(response.data.data || []);
      } catch (error) {
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const fetchQRImage = async (candidateId) => {
    try {
      const response = await candidatesAPI.getQRImage(candidateId);
      return response.data.qrCodeImage;
    } catch {
      return null;
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    const zip = new JSZip();
    for (const candidate of candidates) {
      const qrImage = await fetchQRImage(candidate.id);
      if (qrImage) {
        const res = await fetch(qrImage);
        const blob = await res.blob();
        zip.file(`${candidate.name || candidate.email}-qr.png`, blob);
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'all-candidate-qr-codes.zip');
    setDownloading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <QrCode className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">QR Downloader</h1>
            <p className="text-purple-100">Download all candidate QR codes</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex justify-end p-4">
          <button
            onClick={handleDownloadAll}
            disabled={downloading || isLoading || candidates.length === 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 shadow-lg"
          >
            {downloading ? 'Downloading...' : 'Download All QR Codes'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">QR ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">QR Code</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8">No candidates found</td></tr>
              ) : (
                candidates.map((candidate) => (
                  <QRRow key={candidate.id} candidate={candidate} fetchQRImage={fetchQRImage} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const QRRow = ({ candidate, fetchQRImage }) => {
  const [qrImage, setQrImage] = useState(null);
  useEffect(() => {
    let mounted = true;
    fetchQRImage(candidate.id).then((img) => { if (mounted) setQrImage(img); });
    return () => { mounted = false; };
  }, [candidate.id, fetchQRImage]);
  return (
    <tr>
      <td className="px-6 py-6 whitespace-nowrap text-gray-900 font-medium">{candidate.name}</td>
      <td className="px-6 py-6 whitespace-nowrap text-gray-900">{candidate.email}</td>
      <td className="px-6 py-6 whitespace-nowrap text-blue-700 font-mono text-xs">{candidate.qr_code}</td>
      <td className="px-6 py-6 whitespace-nowrap">
        {qrImage ? (
          <img src={qrImage} alt="QR Code" className="w-20 h-20 rounded-lg border border-gray-200" />
        ) : (
          <span className="text-gray-400">Loading...</span>
        )}
      </td>
    </tr>
  );
};

export default QRDownloader; 