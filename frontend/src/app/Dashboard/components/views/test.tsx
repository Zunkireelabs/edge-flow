// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useState, useEffect } from 'react';
// import { Calendar, X } from 'lucide-react';
// import AddRecordModal from './AddRecordModal';
// import WorkerAssignmentTable from './WorkerAssignmentTable';

// interface TaskDetailsModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     taskData: any;
// }

// const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, taskData }) => {
//     const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
//     const [status, setStatus] = useState('Not Started');
//     const [workerRecords, setWorkerRecords] = useState<any[]>([]);
//     const [, setLoadingRecords] = useState(false);

//     // Fetch worker logs when modal opens or subBatch changes
//     useEffect(() => {
//         if (isOpen && taskData?.sub_batch?.id) {
//             fetchWorkerLogs(taskData.sub_batch.id);
//         }
//     }, [isOpen, taskData]);

//     const fetchWorkerLogs = async (subBatchId: number) => {
//         setLoadingRecords(true);
//         try {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_GET_WORKER_LOGS}?sub_batch_id=${subBatchId}`);
//             if (response.ok) {
//                 const data = await response.json();
//                 // Transform API data to match table structure
//                 const records = data.map((item: any) => ({
//                     id: item.id,
//                     worker: item.worker_name,
//                     realCategory: item.size_category || 'General',
//                     date: new Date(item.work_date).toLocaleDateString('en-US'),
//                     status: item.status || 'Pending',
//                     qtyReceived: item.quantity_received || 0,
//                     qtyWorked: item.quantity_worked || 0,
//                     unitPrice: item.unit_price || 0,
//                     rejectReturn: item.reject_return || 0,
//                     returnTo: item.return_to,
//                     rejectionReason: item.rejection_reason,
//                     alteration: item.alteration,
//                     alterationNote: item.alteration_note,
//                     particulars: item.particulars,
//                     apiData: item
//                 }));
//                 setWorkerRecords(records);
//             } else {
//                 console.error('Failed to fetch worker logs');
//             }
//         } catch (error) {
//             console.error('Error fetching worker logs:', error);
//         } finally {
//             setLoadingRecords(false);
//         }
//     };

//     if (!isOpen || !taskData) return null;

//     const handleAddRecord = () => {
//         setIsAddRecordOpen(true);
//     };

//     const handleSaveRecord = (newRecord: any) => {
//         const record = {
//             id: workerRecords.length + 1,
//             ...newRecord
//         };
//         setWorkerRecords([...workerRecords, record]);
//         setIsAddRecordOpen(false);
//     };

//     const handleDeleteRecord = (id: number) => {
//         setWorkerRecords(workerRecords.filter(record => record.id !== id));
//     };

//     const formatDate = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric'
//         });
//     };

//     return (
//         <>
//             <div className="fixed inset-0 z-50 flex items-center justify-center">
//                 <div className="absolute inset-0 bg-black/50" onClick={onClose} />
//                 <div className="bg-white rounded-lg w-fit mx-4 relative shadow-xl max-h-[100vh] overflow-hidden">
//                     {/* Header */}
//                     <div className="flex items-center justify-between p-6 border-b border-gray-400 ">
//                         <h3 className="text-lg font-bold">Task Details</h3>
//                         <button
//                             onClick={onClose}
//                             className="text-gray-500 hover:text-gray-700"
//                         >
//                             <X size={20} />
//                         </button>
//                     </div>

//                     {/* Content */}
//                     <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
//                         <div className="space-y-8">
//                             {/* Task Information */}
//                             <div className="p-6">
//                                 <h4 className="font-semibold mb-6">Task Information</h4>
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                     {/* Batch Name */}
//                                     <div>
//                                         <label className="text-medium font-semibold text-black">Batch Name</label>
//                                         <p className="text-gray-900 border border-gray-200 rounded-lg min-w-[90px] max-w-[150px] px-6 py-2 mt-1">
//                                             {taskData.sub_batch?.batch?.name}
//                                         </p>
//                                     </div>

//                                     {/* Sub Batch Name */}
//                                     <div>
//                                         <label className="text-medium font-semibold text-black">Sub Batch Name</label>
//                                         <p className="text-gray-900 border border-gray-200 rounded-lg min-w-[90px] max-w-[150px] px-6 py-2 mt-1 ">
//                                             {taskData.sub_batch?.name}
//                                         </p>
//                                     </div>

//                                     {/* Planned Start Date */}
//                                     <div>
//                                         <label className="text-medium font-semibold text-black">Planned Start Date</label>
//                                         <p className="text-gray-900 border border-gray-200 rounded-lg w-fit px-6 py-2 mt-1 flex gap-2">
//                                             {formatDate(taskData.sub_batch?.start_date)}
//                                             <Calendar size={20} />
//                                         </p>
//                                     </div>

//                                     {/* Due Date */}
//                                     <div>
//                                         <label className="text-medium font-semibold text-black">Due Date</label>
//                                         <p className="text-gray-900 border border-gray-200 rounded-lg w-fit px-6 py-2 mt-1 flex gap-2 ">
//                                             {formatDate(taskData.sub_batch?.due_date)}
//                                             <Calendar size={20} />
//                                         </p>
//                                     </div>

//                                     {/* Status */}
//                                     <div>
//                                         <h4 className="text-medium font-semibold text-black mb-2">Status</h4>
//                                         <select
//                                             value={status}
//                                             onChange={(e) => setStatus(e.target.value)}
//                                             className="text-gray-900 bg-[#D8D8D8] border-gray-200 rounded-lg px-6 py-2 min-w-[90px] max-w-[150px]"
//                                         >
//                                             <option value="Not Started">Not Started</option>
//                                             <option value="In Progress">In Progress</option>
//                                             <option value="Completed">Completed</option>
//                                         </select>
//                                     </div>

//                                     {/* Total Quantity */}
//                                     <div>
//                                         <label className="text-sm font-semibold text-black">Total Quantity</label>
//                                         <p className="text-gray-900 border border-gray-200 rounded-lg px-6 py-2 mt-2 min-w-[90px] max-w-[150px]">
//                                             {taskData.sub_batch?.estimated_pieces?.toLocaleString()}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Attachments */}
//                             <div className='border-t border-gray-400 px-8'>
//                                 <h4 className="font-semibold mt-3">Attachments</h4>
//                                 <div className="space-y-2 flex gap-4">
//                                     {taskData.sub_batch?.attachments?.map((attachment: any) => (
//                                         <div
//                                             key={attachment.id}
//                                             className="flex items-center gap-2 w-fit p-2 bg-gray-50 rounded-lg border border-gray-200 mt-2"
//                                         >
//                                             <p className="text-sm font-medium">{attachment.attachment_name}:</p>
//                                             <p className="text-sm font-medium">{attachment.quantity}</p>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             {/* Worker Assignment & Records */}
//                             <div>
//                                 <div className="border-t border-gray-400 flex items-center justify-between px-8 py-3 w-full ">
//                                     <h4 className="font-semibold">Worker Assignment & Records</h4>
//                                     <button
//                                         onClick={handleAddRecord}
//                                         className="border border-blue-600 text-blue-600 px-4 py-1 rounded-lg hover:bg-blue-700 hover:text-white text-sm transition"
//                                     >
//                                         + Add Record
//                                     </button>
//                                 </div>

//                                 <div className="overflow-x-auto min-w-[400px] max-w-[450px] ">
//                                     <WorkerAssignmentTable
//                                         records={workerRecords}
//                                         onDelete={handleDeleteRecord}
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Footer */}
//                     <div className="flex justify-between items-center p-6 border-t border-gray-400 bg-gray-50">
//                         <button
//                             onClick={onClose}
//                             className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
//                         >
//                             Cancel
//                         </button>
//                         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                             Save
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {/* Add Record Modal */}
//             <AddRecordModal
//                 isOpen={isAddRecordOpen}
//                 onClose={() => setIsAddRecordOpen(false)}
//                 onSave={handleSaveRecord}
//                 subBatch={taskData.sub_batch || null}

//             />
//         </>
//     );
// };

// export default TaskDetailsModal;
