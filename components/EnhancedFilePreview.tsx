'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';
import Button from './ui/Button';

interface EnhancedFilePreviewProps {
  fileUrl: string;
  fileName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function EnhancedFilePreview({ 
  fileUrl, 
  fileName, 
  isOpen = true,
  onClose 
}: EnhancedFilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');
  const [displayName, setDisplayName] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!fileUrl) {
      setLoading(false);
      return;
    }

    // Extract filename
    let name = fileName;
    if (!name && fileUrl) {
      if (fileUrl.startsWith('http')) {
        const urlParts = fileUrl.split('/');
        name = urlParts[urlParts.length - 1].split('?')[0];
        name = decodeURIComponent(name);
      } else if (fileUrl.startsWith('data:')) {
        if (fileUrl.startsWith('data:image/')) {
          const mimeType = fileUrl.match(/data:image\/([^;]+)/)?.[1] || 'jpg';
          name = `Gambar.${mimeType}`;
        } else if (fileUrl.startsWith('data:application/pdf')) {
          name = 'Dokumen.pdf';
        } else {
          name = 'File';
        }
      }
    }
    setDisplayName(name || 'File');

    // Determine file type
    if (fileUrl.startsWith('data:image/') || fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i)) {
      setFileType('image');
    } else if (fileUrl.startsWith('data:application/pdf') || fileUrl.match(/\.pdf(\?|$)/i)) {
      setFileType('pdf');
    } else {
      setFileType('unknown');
    }

    setLoading(false);
  }, [fileUrl, fileName]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose || (() => {})} title={displayName}>
      <div className="w-full" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {fileType === 'image' && (
              <>
                <Button size="sm" variant="secondary" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOutIcon />
                </Button>
                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button size="sm" variant="secondary" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomInIcon />
                </Button>
                <Button size="sm" variant="secondary" onClick={handleZoomReset}>
                  <ResetIcon />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button size="sm" variant="secondary" onClick={handleRotate}>
                  <RotateIcon />
                </Button>
              </>
            )}
            <span className="text-sm text-gray-600 ml-2 truncate max-w-md">
              {displayName}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleDownload}>
              <DownloadIcon className="mr-1" />
              Download
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px', maxHeight: '70vh' }}>
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {fileType === 'image' && (
                <div className="flex items-center justify-center p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
                  <img
                    src={fileUrl}
                    alt={displayName}
                    className="max-w-full h-auto"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-in-out',
                      transformOrigin: 'center center'
                    }}
                    onError={() => setError('Gagal memuat gambar')}
                  />
                </div>
              )}

              {fileType === 'pdf' && (
                <div className="w-full" style={{ height: '70vh' }}>
                  <iframe
                    src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={displayName}
                    onError={() => setError('Gagal memuat PDF')}
                  />
                </div>
              )}

              {fileType === 'unknown' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileIcon className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Preview tidak tersedia untuk tipe file ini</p>
                  <Button onClick={handleDownload}>
                    <DownloadIcon className="mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Icons
function ZoomInIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
