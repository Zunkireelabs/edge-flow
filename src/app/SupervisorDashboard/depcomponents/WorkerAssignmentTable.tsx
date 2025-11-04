import React, { useState } from 'react';
import { MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';

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

interface WorkerAssignmentTableProps {
  records: WorkerRecord[];
  onDelete: (id: number) => void;
  onEdit?: (record: WorkerRecord) => void;
  onPreview?: (record: WorkerRecord) => void;
  loading?: boolean;
}

const WorkerAssignmentTable: React.FC<WorkerAssignmentTableProps> = ({ 
  records, 
  onDelete, 
  onEdit, 
  onPreview 
}) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleMenuAction = (action: string, record: WorkerRecord) => {
    setOpenMenuId(null);
    switch (action) {
      case 'preview':
        onPreview?.(record);
        break;
      case 'edit':
        onEdit?.(record);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this record?')) {
          onDelete(record.id);
        }
        break;
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
        <p>No worker assignments yet</p>
        <p className="text-sm">Click Add Record to assign workers</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full table-auto">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Worker</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Date</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Size/Category</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Particulars</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Qty received</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Qty Worked</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Unit Price</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Rejected</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Returned department</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Reason for Rejection</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Alteration</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Alteration Note</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">Status</th>
            <th className="p-3 text-center text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="p-3 text-sm text-gray-900">{record.worker}</td>
              <td className="p-3 text-sm text-gray-600">{record.date}</td>
              <td className="p-3 text-sm text-gray-600">{record.realCategory}</td>
              <td className="p-3 text-sm text-gray-600">{record.particulars || '-'}</td>
              <td className="p-3 text-sm text-gray-600">{record.qtyReceived || 0}</td>
              <td className="p-3 text-sm text-gray-600">{record.qtyWorked || 0}</td>
              <td className="p-3 text-sm text-gray-600">{record.unitPrice || 0}</td>
              <td className="p-3 text-sm text-gray-600">{record.rejectReturn || 0}</td>
              <td className="p-3 text-sm text-gray-600">{record.returnTo || '-'}</td>
              <td className="p-3 text-sm text-gray-600">{record.rejectionReason || '-'}</td>
              <td className="p-3 text-sm text-gray-600">{record.alteration || 0}</td>
              <td className="p-3 text-sm text-gray-600">{record.alterationNote || '-'}</td>
              <td className="p-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  record.status === 'On Time' 
                    ? 'bg-green-100 text-green-800'
                    : record.status === 'Delayed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {record.status}
                </span>
              </td>
              <td className="p-3 text-center">
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === record.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded shadow-lg z-20 border">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                        onClick={() => handleMenuAction('preview', record)}
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                        onClick={() => handleMenuAction('edit', record)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-red-600"
                        onClick={() => handleMenuAction('delete', record)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WorkerAssignmentTable;
