/**
 * Direct PDF Viewer Component - SIMPLE SOLUTION
 * 
 * Converts PDF blob to data URL for reliable display
 * This bypasses blob URL compatibility issues with object/embed elements
 */

import React, { useEffect, useRef, useState } from 'react';

interface DirectPDFViewerProps {
  pdfUrl: string | null;
  className?: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: string) => void;
}

export const DirectPDFViewer: React.FC<DirectPDFViewerProps> = ({
  pdfUrl,
  className = '',
  onLoadSuccess,
  onLoadError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  /**
   * Convert blob URL to data URL for reliable display
   */
  const convertBlobToDataUrl = async (blobUrl: string): Promise<string> => {
    try {
      console.log('🔄 Direct PDF Viewer: Converting blob to data URL...');
      
      // Fetch the blob
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📄 Direct PDF Viewer: Blob details:', {
        size: blob.size,
        type: blob.type
      });
      
      if (blob.size === 0) {
        throw new Error('PDF blob is empty');
      }
      
      // Convert to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            console.log('✅ Direct PDF Viewer: Data URL created successfully');
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert blob to data URL'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });
      
    } catch (error) {
      console.error('❌ Direct PDF Viewer: Blob conversion failed:', error);
      throw error;
    }
  };

  /**
   * Handle PDF URL changes
   */
  useEffect(() => {
    if (pdfUrl) {
      console.log('🔄 Direct PDF Viewer: Processing PDF URL:', pdfUrl.substring(0, 50) + '...');
      setIsLoading(true);
      setError(null);
      setDataUrl(null);
      
      convertBlobToDataUrl(pdfUrl)
        .then((dataUrl) => {
          setDataUrl(dataUrl);
          setIsLoading(false);
          onLoadSuccess?.();
          console.log('✅ Direct PDF Viewer: PDF ready for display');
        })
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF';
          setError(errorMessage);
          setIsLoading(false);
          onLoadError?.(errorMessage);
        });
    } else {
      setDataUrl(null);
      setIsLoading(false);
      setError(null);
    }
  }, [pdfUrl, onLoadSuccess, onLoadError]);

  if (!pdfUrl) {
    return (
      <div className={`direct-pdf-viewer ${className} flex items-center justify-center py-20 bg-gray-50`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">No PDF to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`direct-pdf-viewer ${className} relative`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Processing PDF...</p>
            <p className="text-xs text-gray-500 mt-1">Converting for display</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
          <div className="text-center text-red-600">
            <p className="text-sm font-medium">PDF Display Error</p>
            <p className="text-xs mt-1">{error}</p>
            <div className="mt-3 space-y-2">
              <a 
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Open in New Tab
              </a>
              <a 
                href={pdfUrl}
                download="cv-preview.pdf"
                className="block px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PDF Content */}
      {dataUrl && !isLoading && !error && (
        <div className="w-full h-full min-h-[600px]">
          <iframe
            src={dataUrl}
            width="100%"
            height="100%"
            style={{ 
              minHeight: '600px',
              border: 'none',
              background: 'white'
            }}
            title="CV Preview - Direct PDF Display"
            onLoad={() => {
              console.log('✅ Direct PDF Viewer: iframe loaded successfully');
            }}
            onError={() => {
              console.error('❌ Direct PDF Viewer: iframe failed to load');
              setError('Failed to display PDF in iframe');
            }}
          />
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && dataUrl && (
        <div className="absolute bottom-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
          PDF Ready ({dataUrl.length > 1000 ? `${Math.round(dataUrl.length/1024)}KB` : `${dataUrl.length}B`})
        </div>
      )}
    </div>
  );
};

export default DirectPDFViewer;
