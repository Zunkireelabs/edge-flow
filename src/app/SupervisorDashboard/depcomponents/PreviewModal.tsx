import React from 'react';
import { X } from 'lucide-react';

interface WorkerRecord {
  id: number;
  worker: string;
  realCategory: string;
  particulars?: string;
  date: string;
  status: string;
  qtyReceived?: number;
  qtyWorked?: number;
  unitPrice?: number;
  rejectReturn?: number;
  returnTo?: string;
  rejectionReason?: string;
  alteration?: number;
  alterationNote?: string;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: WorkerRecord | null;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Worker Record Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Worker Name</label>
              <div className="text-gray-900">{record.worker}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
              <div className="text-gray-900">{record.date}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Size/Category</label>
              <div className="text-gray-900">{record.realCategory || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                record.status === 'On Time' 
                  ? 'bg-green-100 text-green-800'
                  : record.status === 'Delayed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {record.status}
              </span>
            </div>
          </div>

          {/* Particulars */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Particulars</label>
            <div className="text-gray-900">{record.particulars || 'N/A'}</div>
          </div>

          {/* Quantities and Pricing */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">Quantities & Pricing</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Qty Received</label>
                <div className="text-gray-900">{record.qtyReceived || 0}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Qty Worked</label>
                <div className="text-gray-900">{record.qtyWorked || 0}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Price</label>
                <div className="text-gray-900">${record.unitPrice || 0}</div>
              </div>
            </div>
          </div>

          {/* Rejection & Return */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">Rejection & Return</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rejected Qty</label>
                <div className="text-gray-900">{record.rejectReturn || 0}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Returned To</label>
                <div className="text-gray-900">{record.returnTo || 'N/A'}</div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rejection Reason</label>
              <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {record.rejectionReason || 'No reason provided'}
              </div>
            </div>
          </div>

          {/* Alteration */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">Alteration</h4>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alteration Qty</label>
              <div className="text-gray-900">{record.alteration || 0}</div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alteration Note</label>
              <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {record.alterationNote || 'No notes provided'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;