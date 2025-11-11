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

  // Console log all worker records data
  console.log('======= WORKER ASSIGNMENT TABLE DATA =======');
  console.log('Total Records:', records.length);
  console.log('All Worker Records:', records);
  records.forEach((record, index) => {
    console.log(`Record ${index + 1}:`, {
      id: record.id,
      worker: record.worker,
      date: record.date,
      realCategory: record.realCategory,
      particulars: record.particulars,
      qtyReceived: record.qtyReceived,
      qtyWorked: record.qtyWorked,
      unitPrice: record.unitPrice,
      rejectReturn: record.rejectReturn,
      returnTo: record.returnTo,
      rejectionReason: record.rejectionReason,
      alteration: record.alteration,
      alterationNote: record.alterationNote,
      status: record.status
    });
  });
  console.log('===========================================');

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
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[120px] whitespace-nowrap">Worker</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[100px] whitespace-nowrap">Date</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[120px] whitespace-nowrap">Size/Category</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[120px] whitespace-nowrap">Particulars</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[100px] whitespace-nowrap">Qty Received</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[100px] whitespace-nowrap">Qty Worked</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[100px] whitespace-nowrap">Unit Price</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[90px] whitespace-nowrap">Rejected</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[140px] whitespace-nowrap">Returned Dept</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[150px] whitespace-nowrap">Rejection Reason</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[90px] whitespace-nowrap">Alteration</th>
            <th className="p-3 text-left text-sm font-medium text-gray-700 min-w-[150px] whitespace-nowrap">Alteration Note</th>
            <th className="p-3 text-center text-sm font-medium text-gray-700 min-w-[80px] whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map((record) => {
            const hasRejectionOrAlteration = (record.rejectReturn ?? 0) > 0 || (record.alteration ?? 0) > 0;
            const rowBgClass = hasRejectionOrAlteration ? 'bg-[#FEF2F2]' : 'bg-[#ECFDF5]';

            return (
            <tr key={record.id} className={rowBgClass}>
              <td className="p-3 text-sm text-gray-900 min-w-[120px] whitespace-nowrap">{record.worker}</td>
              <td className="p-3 text-sm text-gray-600 min-w-[100px] whitespace-nowrap">{record.date}</td>
              <td className="p-3 text-sm text-gray-600 min-w-[120px]">{record.realCategory}</td>
              <td className="p-3 text-sm text-gray-600 min-w-[120px]">{record.particulars || '-'}</td>
              <td className="p-3 text-sm text-gray-600 min-w-[100px] text-right">{record.qtyReceived ?? 0}</td>
              <td className="p-3 text-sm text-gray-600 min-w-[100px] text-right">{record.qtyWorked ?? 0}</td>
              <td className="p-3 text-sm text-gray-600 min-w-[100px] text-right">${record.unitPrice ?? 0}</td>
              <td className={`p-3 text-sm min-w-[90px] text-right font-semibold ${
                (record.rejectReturn ?? 0) > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {record.rejectReturn ?? 0}
              </td>
              <td className="p-3 text-sm text-gray-600 min-w-[140px]">{record.returnTo || '-'}</td>
              <td className="p-3 text-sm text-gray-600 min-w-[150px]">{record.rejectionReason || '-'}</td>
              <td className={`p-3 text-sm min-w-[90px] text-right font-semibold ${
                (record.alteration ?? 0) > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {record.alteration ?? 0}
              </td>
              <td className="p-3 text-sm text-gray-600 min-w-[150px]">{record.alterationNote || '-'}</td>
              <td className="p-3 text-center min-w-[80px]">
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WorkerAssignmentTable;
