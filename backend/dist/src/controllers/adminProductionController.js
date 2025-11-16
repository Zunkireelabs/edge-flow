"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAlteration = exports.rejectSubBatch = exports.getTaskDetails = void 0;
const adminProductionService = __importStar(require("../services/adminProductionService"));
/**
 * Get task details for admin production view
 * GET /api/admin/production/task-details/:subBatchId?department_id={departmentId}
 */
const getTaskDetails = async (req, res) => {
    try {
        const subBatchId = Number(req.params.subBatchId);
        const departmentId = Number(req.query.department_id);
        // Validation
        if (isNaN(subBatchId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sub-batch ID",
            });
        }
        if (isNaN(departmentId)) {
            return res.status(400).json({
                success: false,
                message: "department_id query parameter is required and must be a number",
            });
        }
        const result = await adminProductionService.getTaskDetails(subBatchId, departmentId);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || "Error fetching task details",
        });
    }
};
exports.getTaskDetails = getTaskDetails;
/**
 * Reject sub-batch from admin production view
 * POST /api/admin/production/reject
 */
const rejectSubBatch = async (req, res) => {
    try {
        const { sub_batch_id, from_department_id, return_to_department_id, quantity, reason } = req.body;
        // Validation
        if (!sub_batch_id || !from_department_id || !return_to_department_id || !quantity || !reason) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: sub_batch_id, from_department_id, return_to_department_id, quantity, reason",
            });
        }
        const result = await adminProductionService.createRejection({
            sub_batch_id: Number(sub_batch_id),
            from_department_id: Number(from_department_id),
            return_to_department_id: Number(return_to_department_id),
            quantity: Number(quantity),
            reason,
        });
        res.status(201).json({
            success: true,
            message: "Rejection recorded successfully",
            data: result,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || "Error recording rejection",
        });
    }
};
exports.rejectSubBatch = rejectSubBatch;
/**
 * Add alteration from admin production view
 * POST /api/admin/production/alteration
 */
const addAlteration = async (req, res) => {
    try {
        const { sub_batch_id, from_department_id, return_to_department_id, quantity, note } = req.body;
        // Validation
        if (!sub_batch_id || !from_department_id || !return_to_department_id || !quantity || !note) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: sub_batch_id, from_department_id, return_to_department_id, quantity, note",
            });
        }
        const result = await adminProductionService.createAlteration({
            sub_batch_id: Number(sub_batch_id),
            from_department_id: Number(from_department_id),
            return_to_department_id: Number(return_to_department_id),
            quantity: Number(quantity),
            note,
        });
        res.status(201).json({
            success: true,
            message: "Alteration recorded successfully",
            data: result,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || "Error recording alteration",
        });
    }
};
exports.addAlteration = addAlteration;
