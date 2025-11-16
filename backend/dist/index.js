"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./src/routes/auth"));
const dotenv_1 = __importDefault(require("dotenv"));
const roll_1 = __importDefault(require("./src/routes/roll"));
const batch_1 = __importDefault(require("./src/routes/batch"));
const subBatch_1 = __importDefault(require("./src/routes/subBatch"));
const worker_1 = __importDefault(require("./src/routes/worker"));
const vendor_1 = __importDefault(require("./src/routes/vendor"));
const category_1 = __importDefault(require("./src/routes/category"));
const department_1 = __importDefault(require("./src/routes/department"));
const departmentSubBatch_1 = __importDefault(require("./src/routes/departmentSubBatch"));
const supervisor_1 = __importDefault(require("./src/routes/supervisor"));
const workerLog_1 = __importDefault(require("./src/routes/workerLog"));
const subBatchRejected_1 = __importDefault(require("./src/routes/subBatchRejected"));
const subBatchAltered_1 = __importDefault(require("./src/routes/subBatchAltered"));
const subBatchWorkflow_1 = __importDefault(require("./src/routes/subBatchWorkflow"));
const wage_1 = __importDefault(require("./src/routes/wage"));
const productionView_1 = __importDefault(require("./src/routes/productionView"));
const inventory_1 = __importDefault(require("./src/routes/inventory"));
const inventorySubtraction_1 = __importDefault(require("./src/routes/inventorySubtraction"));
const adminProduction_1 = __importDefault(require("./src/routes/adminProduction"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const health_1 = __importDefault(require("./src/routes/health"));
app.use("/api/health", health_1.default);
// Auth routes
app.use("/api/auth", auth_1.default);
// Supervisor routes
app.use("/api/supervisors", supervisor_1.default);
// Roll routes
app.use("/api/rolls", roll_1.default);
//Batch Routes
app.use("/api/batches", batch_1.default);
//Sub-Batch Routes
app.use("/api/sub-batches", subBatch_1.default);
// Worker Routes
app.use("/api/workers", worker_1.default);
//Vendor Routes
app.use("/api/vendors", vendor_1.default);
//category Routes
app.use("/api/categories", category_1.default);
// Department Routes
app.use("/api/departments", department_1.default);
// Department Sub-Batch Routes
app.use("/api/department-sub-batches", departmentSubBatch_1.default);
//worker Log Routes
app.use("/api/worker-logs", workerLog_1.default);
// sub-batch rejected and altered routes
app.use("/api/sub-batch-rejected", subBatchRejected_1.default);
app.use("/api/sub-batch-altered", subBatchAltered_1.default);
// sub-batch Workflow Routes
app.use("/api/sub-batches/workflow", subBatchWorkflow_1.default);
// Wage Calculation Routes
app.use("/api/wages", wage_1.default);
// Production View Routes
app.use("/api/production-view", productionView_1.default);
// Inventory Routes
app.use("/api/inventory", inventory_1.default);
// Inventory Subtraction Routes
app.use("/api/inventory-subtraction", inventorySubtraction_1.default);
// Admin Production Routes
app.use("/api/admin/production", adminProduction_1.default);
// Optional test route
app.get("/", (req, res) => {
    res.send("Backend server is running!");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
