'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { UploadedFile } from '@/types';

interface FileListProps {
  roomId: string;
}

export function FileList({ roomId }: FileListProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => {
    if (showFiles && roomId) {
      fetchFiles();
    }
  }, [showFiles, roomId]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRoomFiles(roomId);
      setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await api.deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎬';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    return '📎';
  };

  const getAPIUrl = () => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    }
    return 'http://localhost:8080';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowFiles(!showFiles)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300"
      >
        📎 {files.length > 0 && `${files.length} files`}
      </button>

      {showFiles && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-700 rounded-lg shadow-xl border border-gray-600 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-gray-600">
            <h4 className="text-white font-semibold text-sm">Files</h4>
          </div>
          
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No files uploaded yet
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-600 group"
                >
                  <span className="text-lg">{getFileIcon(file.content_type)}</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`${getAPIUrl()}${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 truncate block"
                    >
                      {file.file_name}
                    </a>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
