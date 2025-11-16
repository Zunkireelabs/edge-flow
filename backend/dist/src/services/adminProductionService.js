"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlteration = exports.createRejection = exports.getTaskDetails = exports.DepartmentStage = void 0;
// src/services/adminProductionService.ts
const db_1 = __importDefault(require("../config/db"));
var DepartmentStage;
(function (DepartmentStage) {
    DepartmentStage["NEW_ARRIVAL"] = "NEW_ARRIVAL";
    DepartmentStage["IN_PROGRESS"] = "IN_PROGRESS";
    DepartmentStage["COMPLETED"] = "COMPLETED";
})(DepartmentStage || (exports.DepartmentStage = DepartmentStage = {}));
/**
 * Get detailed task information for admin production view
 * @param subBatchId - The sub-batch ID
 * @param departmentId - The current department ID
 */
const getTaskDetails = async (subBatchId, departmentId) => {
    // Find the department_sub_batch entry for this sub-batch and department
    const deptSubBatch = await db_1.default.department_sub_batches.findFirst({
        where: {
            sub_batch_id: subBatchId,
            department_id: departmentId,
            is_current: true, // Only get the current active entry
        },
        include: {
            department: true,
            sub_batch: {
                include: {
                    roll: true,
                    batch: true,
                    attachments: true,
                    dept_links: true, // Include department sub-batch links
                    workflows: {
                        include: {
                            steps: {
                                include: {
                                    department: true,
                                },
                                orderBy: {
                                    step_index: "asc",
                                },
                            },
                        },
                    },
                },
            },
            assigned_worker: true,
            sent_to_department: true,
        },
    });
    if (!deptSubBatch) {
        throw new Error(`No active task found for sub-batch ${subBatchId} in department ${departmentId}`);
    }
    // Get the department name that sent this sub-batch
    let sentFromDepartmentName = null;
    if (deptSubBatch.sent_from_department) {
        const sentFromDept = await db_1.default.departments.findUnique({
            where: { id: deptSubBatch.sent_from_department },
            select: { name: true },
        });
        sentFromDepartmentName = sentFromDept?.name || null;
    }
    // Get work history - all worker logs for this sub-batch and department
    const workerLogs = await db_1.default.worker_logs.findMany({
        where: {
            sub_batch_id: subBatchId,
            department_id: departmentId,
        },
        include: {
            worker: true,
            rejected_entry: {
                include: {
                    sent_to_department: true,
                },
            },
            altered_entry: {
                include: {
                    sent_to_department: true,
                },
            },
        },
        orderBy: {
            work_date: "desc",
        },
    });
    // Build work history array
    const workHistory = workerLogs.map((log) => {
        // Calculate rejected and altered totals
        const totalRejected = log.rejected_entry.reduce((sum, r) => sum + r.quantity, 0);
        const totalAltered = log.altered_entry.reduce((sum, a) => sum + a.quantity, 0);
        // Combine rejection reasons
        const rejectionReasons = log.rejected_entry
            .map((r) => `${r.reason} - Returned to ${r.sent_to_department?.name || "Unknown"}`)
            .join("; ");
        // Combine alteration notes
        const alterationNotes = log.altered_entry
            .map((a) => `${a.reason} - Sent to ${a.sent_to_department?.name || "Unknown"}`)
            .join("; ");
        return {
            worker_name: log.worker_name || log.worker?.name || "Unknown",
            assigned_quantity: log.quantity_received || 0,
            produced: log.quantity_worked || 0,
            rejected: totalRejected,
            rejection_reason: rejectionReasons || null,
            altered: totalAltered,
            alteration_note: alterationNotes || null,
            date: log.work_date,
        };
    });
    // Get route steps from workflow
    const routeSteps = deptSubBatch.sub_batch?.workflows?.steps.map((step) => {
        // Check if this department has been completed
        // A department is completed if there's a dept_link with sent_to_department_id set
        const isCompleted = deptSubBatch.sub_batch?.dept_links.some((link) => link.department_id === step.department_id &&
            link.sent_to_department_id !== null) || false;
        return {
            department_id: step.department_id,
            department_name: step.department?.name || "Unknown",
            completed: isCompleted,
        };
    }) || [];
    // Get all available departments (excluding current department)
    const allDepartments = await db_1.default.departments.findMany({
        where: {
            id: {
                not: departmentId,
            },
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });
    // Calculate production summary
    const worked = workerLogs.reduce((sum, log) => sum + (log.quantity_worked || 0), 0);
    const altered = workerLogs.reduce((sum, log) => {
        return sum + log.altered_entry.reduce((s, a) => s + a.quantity, 0);
    }, 0);
    const rejected = workerLogs.reduce((sum, log) => {
        return sum + log.rejected_entry.reduce((s, r) => s + r.quantity, 0);
    }, 0);
    const remaining = deptSubBatch.quantity_remaining || 0;
    // Get assigned workers (currently only supports one worker per task)
    const assignedWorkers = deptSubBatch.assigned_worker
        ? [
            {
                id: deptSubBatch.assigned_worker.id,
                worker_name: deptSubBatch.assigned_worker.name,
                quantity: deptSubBatch.quantity_remaining || 0,
                date: deptSubBatch.createdAt,
            },
        ]
        : [];
    // Determine linen information
    const linenName = deptSubBatch.sub_batch?.roll?.name ||
        deptSubBatch.sub_batch?.batch?.name ||
        "Unknown";
    const linenCode = `${deptSubBatch.sub_batch?.roll?.id || deptSubBatch.sub_batch?.batch?.id || "N/A"}`;
    return {
        success: true,
        data: {
            // Task Information
            department_name: deptSubBatch.department?.name || "Unknown",
            roll_name: deptSubBatch.sub_batch?.roll?.name || null,
            batch_name: deptSubBatch.sub_batch?.batch?.name || null,
            sub_batch_name: deptSubBatch.sub_batch?.name || "Unknown",
            estimated_start_date: deptSubBatch.sub_batch?.start_date,
            due_date: deptSubBatch.sub_batch?.due_date,
            total_quantity: deptSubBatch.total_quantity || 0,
            sent_from_department: sentFromDepartmentName,
            status: deptSubBatch.stage, // NEW_ARRIVAL, IN_PROGRESS, COMPLETED
            // Work History
            work_history: workHistory,
            // Route Details
            linen_name: linenName,
            linen_code: linenCode,
            route_steps: routeSteps,
            // Attachments
            attachments: deptSubBatch.sub_batch?.attachments.map((att) => ({
                name: att.attachment_name,
                quantity: att.quantity,
            })) || [],
            // Production Summary
            worked,
            altered,
            rejected,
            remaining,
            // Currently assigned workers
            assigned_workers: assignedWorkers,
            // Available departments to send to
            available_departments: allDepartments,
            // IDs for API operations
            sub_batch_id: deptSubBatch.sub_batch_id,
            department_sub_batch_id: deptSubBatch.id,
        },
    };
};
exports.getTaskDetails = getTaskDetails;
/**
 * Create rejection from admin production view
 * @param data - Rejection input data
 */
const createRejection = async (data) => {
    return await db_1.default.$transaction(async (tx) => {
        // 1️⃣ Find the current active department_sub_batch entry
        const sourceEntry = await tx.department_sub_batches.findFirst({
            where: {
                sub_batch_id: data.sub_batch_id,
                department_id: data.from_department_id,
                is_current: true,
            },
        });
        if (!sourceEntry) {
            throw new Error(`No active entry found for sub-batch ${data.sub_batch_id} in department ${data.from_department_id}`);
        }
        if ((sourceEntry.quantity_remaining || 0) < data.quantity) {
            throw new Error(`Insufficient quantity. Available: ${sourceEntry.quantity_remaining}, requested: ${data.quantity}`);
        }
        // 2️⃣ Reduce quantity_remaining from source entry
        await tx.department_sub_batches.update({
            where: {
                id: sourceEntry.id,
            },
            data: {
                quantity_remaining: { decrement: data.quantity },
            },
        });
        // 3️⃣ Create new department_sub_batches record for rejected pieces
        const newDeptSubBatch = await tx.department_sub_batches.create({
            data: {
                sub_batch_id: data.sub_batch_id,
                department_id: data.return_to_department_id,
                stage: DepartmentStage.NEW_ARRIVAL,
                is_current: true,
                quantity_remaining: data.quantity,
                total_quantity: sourceEntry.total_quantity,
                remarks: "REJECTED",
                reject_reason: data.reason,
                sent_from_department: data.from_department_id,
            },
        });
        // 4️⃣ Create sub_batch_rejected record
        const rejected = await tx.sub_batch_rejected.create({
            data: {
                sub_batch_id: data.sub_batch_id,
                quantity: data.quantity,
                reason: data.reason,
                sent_to_department_id: data.return_to_department_id,
                source_department_sub_batch_id: sourceEntry.id,
                created_department_sub_batch_id: newDeptSubBatch.id,
            },
        });
        // 5️⃣ Log history
        await tx.department_sub_batch_history.create({
            data: {
                department_sub_batch_id: newDeptSubBatch.id,
                sub_batch_id: data.sub_batch_id,
                from_stage: null,
                to_stage: DepartmentStage.NEW_ARRIVAL,
                to_department_id: data.return_to_department_id,
                reason: data.reason,
            },
        });
        return {
            rejection_id: rejected.id,
            sub_batch_id: rejected.sub_batch_id,
            from_department_id: data.from_department_id,
            return_to_department_id: rejected.sent_to_department_id,
            quantity: rejected.quantity,
            reason: rejected.reason,
            created_at: newDeptSubBatch.createdAt,
        };
    });
};
exports.createRejection = createRejection;
/**
 * Create alteration from admin production view
 * @param data - Alteration input data
 */
const createAlteration = async (data) => {
    return await db_1.default.$transaction(async (tx) => {
        // 1️⃣ Find the current active department_sub_batch entry
        const sourceEntry = await tx.department_sub_batches.findFirst({
            where: {
                sub_batch_id: data.sub_batch_id,
                department_id: data.from_department_id,
                is_current: true,
            },
        });
        if (!sourceEntry) {
            throw new Error(`No active entry found for sub-batch ${data.sub_batch_id} in department ${data.from_department_id}`);
        }
        if ((sourceEntry.quantity_remaining || 0) < data.quantity) {
            throw new Error(`Insufficient quantity. Available: ${sourceEntry.quantity_remaining}, requested: ${data.quantity}`);
        }
        // 2️⃣ Reduce quantity_remaining from source entry
        await tx.department_sub_batches.update({
            where: {
                id: sourceEntry.id,
            },
            data: {
                quantity_remaining: { decrement: data.quantity },
            },
        });
        // 3️⃣ Create new department_sub_batches record for altered pieces
        const newDeptSubBatch = await tx.department_sub_batches.create({
            data: {
                sub_batch_id: data.sub_batch_id,
                department_id: data.return_to_department_id,
                stage: DepartmentStage.NEW_ARRIVAL,
                is_current: true,
                quantity_remaining: data.quantity,
                total_quantity: sourceEntry.total_quantity,
                remarks: "ALTERED",
                alter_reason: data.note,
                sent_from_department: data.from_department_id,
            },
        });
        // 4️⃣ Create sub_batch_altered record
        const altered = await tx.sub_batch_altered.create({
            data: {
                sub_batch_id: data.sub_batch_id,
                quantity: data.quantity,
                reason: data.note,
                sent_to_department_id: data.return_to_department_id,
                source_department_sub_batch_id: sourceEntry.id,
                created_department_sub_batch_id: newDeptSubBatch.id,
            },
        });
        // 5️⃣ Log history
        await tx.department_sub_batch_history.create({
            data: {
                department_sub_batch_id: newDeptSubBatch.id,
                sub_batch_id: data.sub_batch_id,
                to_stage: DepartmentStage.NEW_ARRIVAL,
                to_department_id: data.return_to_department_id,
                reason: data.note,
            },
        });
        return {
            alteration_id: altered.id,
            sub_batch_id: altered.sub_batch_id,
            from_department_id: data.from_department_id,
            return_to_department_id: altered.sent_to_department_id,
            quantity: altered.quantity,
            note: altered.reason,
            created_at: newDeptSubBatch.createdAt,
        };
    });
};
exports.createAlteration = createAlteration;
