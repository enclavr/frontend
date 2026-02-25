'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Report, ReportStatus } from '@/types';

interface ReportsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportsPanel({ isOpen, onClose }: ReportsPanelProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ReportStatus | ''>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, filter]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.getReports(filter || undefined);
      setReports(response.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (reportId: string, status: ReportStatus) => {
    const notes = prompt('Review notes (optional):');
    try {
      await api.reviewReport(reportId, status, notes || undefined);
      fetchReports();
      setSelectedReport(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to review report');
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewed': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'dismissed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Harassment',
      inappropriate_content: 'Inappropriate Content',
      violence: 'Violence',
      misinformation: 'Misinformation',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">User Reports</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1 rounded text-sm ${filter === '' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-3 py-1 rounded text-sm ${filter === 'reviewed' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Reviewed
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded text-sm ${filter === 'resolved' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Resolved
          </button>
          <button
            onClick={() => setFilter('dismissed')}
            className={`px-3 py-1 rounded text-sm ${filter === 'dismissed' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Dismissed
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-gray-400 text-center py-4">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-gray-400 text-center py-4">No reports</div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {report.reported?.avatar_url ? (
                          <img src={report.reported.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          report.reported?.username?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {report.reported?.display_name || report.reported?.username || 'Unknown User'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Reported by: {report.reporter?.username || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-300">
                        {getReasonLabel(report.reason)}
                      </span>
                    </div>
                  </div>
                  {report.description && (
                    <div className="mt-2 text-gray-300 text-sm line-clamp-2">
                      {report.description}
                    </div>
                  )}
                  <div className="mt-2 text-gray-400 text-xs">
                    {new Date(report.created_at).toLocaleDateString()}
                    {report.room && <span> • Room: {report.room.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-bold text-white mb-4">Report Details</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-gray-400 text-sm">Reported User</div>
                  <div className="text-white">
                    {selectedReport.reported?.display_name || selectedReport.reported?.username}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Reason</div>
                  <div className="text-white">{getReasonLabel(selectedReport.reason)}</div>
                </div>
                {selectedReport.description && (
                  <div>
                    <div className="text-gray-400 text-sm">Description</div>
                    <div className="text-white">{selectedReport.description}</div>
                  </div>
                )}
                {selectedReport.room && (
                  <div>
                    <div className="text-gray-400 text-sm">Room</div>
                    <div className="text-white">{selectedReport.room.name}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-400 text-sm">Status</div>
                  <div className="text-white">{selectedReport.status}</div>
                </div>
                {selectedReport.review_notes && (
                  <div>
                    <div className="text-gray-400 text-sm">Review Notes</div>
                    <div className="text-white">{selectedReport.review_notes}</div>
                  </div>
                )}
              </div>

              {selectedReport.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleReview(selectedReport.id, 'resolved')}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleReview(selectedReport.id, 'reviewed')}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleReview(selectedReport.id, 'dismissed')}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedReport(null)}
                className="w-full mt-2 px-4 py-2 text-gray-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
