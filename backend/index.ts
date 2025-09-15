import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth";
import dotenv from "dotenv";
import rollRoutes from "./src/routes/roll";
import batchRoutes from "./src/routes/batch";
import subBatchRoutes from "./src/routes/subBatch";
import workerRoutes from "./src/routes/worker";
import vendorRoutes from "./src/routes/vendor";
import categoryRoutes from "./src/routes/category";
import departmentRoutes from "./src/routes/department";
import supervisorRoutes from "./src/routes/supervisor";
import workerLogRoutes from "./src/routes/workerLog";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

import healthRoutes from "./src/routes/health";
app.use("/api/health", healthRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Supervisor routes
app.use("/api/supervisors", supervisorRoutes);

// Roll routes
app.use("/api/rolls", rollRoutes);

//Batch Routes
app.use("/api/batches", batchRoutes);

//Sub-Batch Routes
app.use("/api/sub-batches", subBatchRoutes);

// Worker Routes
app.use("/api/workers", workerRoutes);

//Vendor Routes
app.use("/api/vendors", vendorRoutes);

//category Routes
app.use("/api/categories", categoryRoutes);

// Department Routes
app.use("/api/departments", departmentRoutes);

//worker Log Routes
app.use("/api/worker-logs", workerLogRoutes);


// Optional test route
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
