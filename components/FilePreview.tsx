'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Spinner from './ui/Spinner';

interface FilePreviewProps {
  fileUrl: string | null;
  fileName?: string;
  onClose: () => void;
}

export default function FilePreview({ fileUrl, fileName, onClose }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    if (!fileUrl) {
      setLoading(false);
      return;
    }

    // Extract filename from URL if not provided
    let name = fileName;
    if (!name && fileUrl) {
      if (fileUrl.startsWith('http')) {
        // Extract from MinIO URL
        const urlParts = fileUrl.split('/');
        name = urlParts[urlParts.length - 1].split('?')[0];
        // Decode URL encoding
        name = decodeURIComponent(name);
      } else if (fileUrl.startsWith('data:')) {
        // For base64, use generic name based on type
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
    if (fileUrl.startsWith('data:image/') || fileUrl.match(/\.(jpg|jpeg|png|gif)(\?|$)/i)) {
      setFileType('image');
    } else if (fileUrl.startsWith('data:application/pdf') || fileUrl.endsWith('.pdf')) {
      setFileType('pdf');
    } else {
      setFileType('unknown');
    }

    setLoading(false);
  }, [fileUrl, fileName]);

  if (!fileUrl) {
    return null;
  }

  return (
    <Modal isOpen={!!fileUrl} onClose={onClose} title={displayName}>
      <div className="w-full max-w-4xl">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {fileType === 'image' && (
              <div className="relative w-full">
                <img
                  src={fileUrl}
                  alt={displayName}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  onError={() => setError('Gagal memuat gambar')}
                />
              </div>
            )}

            {fileType === 'pdf' && (
              <div className="w-full h-[70vh]">
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title={displayName}
                  onError={() => setError('Gagal memuat PDF')}
                />
              </div>
            )}

            {fileType === 'unknown' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 mb-4">Preview tidak tersedia untuk tipe file ini</p>
                <a
                  href={fileUrl}
                  download={displayName}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download File
                </a>
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500 truncate max-w-md">
            <span className="font-medium">{displayName}</span>
          </div>
          <div className="flex gap-2">
            {(fileType === 'image' || fileType === 'pdf') && (
              <a
                href={fileUrl}
                download={displayName}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
