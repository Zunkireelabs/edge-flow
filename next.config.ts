import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === 'production';
const API_BASE = isProd
  ? 'https://edge-flow-backend.onrender.com/api'
  : 'http://localhost:5000/api';
const LOGIN_BASE = isProd
  ? 'https://edge-flow-backend.onrender.com'
  : 'http://localhost:5000';

const nextConfig: NextConfig = {
  env: {
    // Login API Url
    NEXT_PUBLIC_API_LOGIN_URL_ADMIN: LOGIN_BASE,
    NEXT_PUBLIC_API_LOGIN_URL_SUPERVISOR: LOGIN_BASE,

    // Base API URL
    NEXT_PUBLIC_API_URL: API_BASE,

    // Supervisor
    NEXT_PUBLIC_CREATE_SUPERVISOR: `${API_BASE}/supervisors`,
    NEXT_PUBLIC_GET_SUPERVISOR: `${API_BASE}/supervisors`,
    NEXT_PUBLIC_DELETE_SUPERVISOR: `${API_BASE}/supervisors`,

    // Rolls
    NEXT_PUBLIC_CREATE_ROLLS: `${API_BASE}/rolls`,
    NEXT_PUBLIC_GET_ROLLS: `${API_BASE}/rolls`,
    NEXT_PUBLIC_GET_ROLL_BY_ID: `${API_BASE}/rolls`,
    NEXT_PUBLIC_UPDATE_ROLL: `${API_BASE}/rolls`,
    NEXT_PUBLIC_DELETE_ROLL: `${API_BASE}/rolls`,

    // Batches
    NEXT_PUBLIC_CREATE_BATCH: `${API_BASE}/batches`,
    NEXT_PUBLIC_GET_BATCHES: `${API_BASE}/batches`,
    NEXT_PUBLIC_GET_BATCH_BY_ID: `${API_BASE}/batches`,
    NEXT_PUBLIC_UPDATE_BATCH: `${API_BASE}/batches`,
    NEXT_PUBLIC_DELETE_BATCH: `${API_BASE}/batches`,

    // SubBatches
    NEXT_PUBLIC_CREATE_SUBBATCH: `${API_BASE}/sub-batches`,
    NEXT_PUBLIC_GET_SUBBATCHES: `${API_BASE}/sub-batches`,
    NEXT_PUBLIC_GET_SUBBATCH_BY_ID: `${API_BASE}/sub-batches`,
    NEXT_PUBLIC_UPDATE_SUBBATCH: `${API_BASE}/sub-batches`,
    NEXT_PUBLIC_DELETE_SUBBATCH: `${API_BASE}/sub-batches`,

    // Categories
    NEXT_PUBLIC_GET_CATEGORY: `${API_BASE}/categories`,
    NEXT_PUBLIC_POST_CATEGORY: `${API_BASE}/categories`,

    // Send to production
    NEXT_PUBLIC_POST_DEPARTMENT: `${API_BASE}/sub-batches/send-to-production`,

    // Departments
    NEXT_PUBLIC_CREATE_DEPARTMENTS: `${API_BASE}/departments`,
    NEXT_PUBLIC_UPDATE_DEPARTMENTS: `${API_BASE}/departments`,
    NEXT_PUBLIC_GET_DEPARTMENTS: `${API_BASE}/departments`,
    NEXT_PUBLIC_DELETE_DEPARTMENTS: `${API_BASE}/departments`,

    // Workers
    NEXT_PUBLIC_CREATE_WORKER: `${API_BASE}/workers`,
    NEXT_PUBLIC_GET_WORKERS: `${API_BASE}/workers`,
    NEXT_PUBLIC_GET_WORKER_BY_ID: `${API_BASE}/workers`,
    NEXT_PUBLIC_UPDATE_WORKER: `${API_BASE}/workers`,
    NEXT_PUBLIC_DELETE_WORKER: `${API_BASE}/workers`,

    // Vendors
    NEXT_PUBLIC_API_VENDOR: `${API_BASE}/vendors`,

    // Supervisor sub-batches
    NEXT_PUBLIC_GET_SUBBATCH_SUPERVISOR: `${API_BASE}/supervisors/sub-batches`,

    // Worker Logs
    NEXT_PUBLIC_CREATE_WORKER_LOGS: `${API_BASE}/worker-logs/logs`,
    NEXT_PUBLIC_GET_WORKER_LOGS: `${API_BASE}/worker-logs`,
    NEXT_PUBLIC_UPDATE_WORKER_LOG: `${API_BASE}/worker-logs`,
    NEXT_PUBLIC_DELETE_WORKER_LOG: `${API_BASE}/worker-logs`,

    // Department operations
    NEXT_PUBLIC_SEND_TO_ANOTHER_DEPARTMENT: `${API_BASE}/sub-batches/advance-department`,
    NEXT_PUBLIC_SUB_BATCH_HISTORY: `${API_BASE}/department-sub-batches/sub-batch-history`,

    // Inventory
    NEXT_PUBLIC_CREATE_INVENTORY: `${API_BASE}/inventory`,
    NEXT_PUBLIC_GET_INVENTORY: `${API_BASE}/inventory`,
    NEXT_PUBLIC_GET_INVENTORY_BY_ID: `${API_BASE}/inventory`,
    NEXT_PUBLIC_UPDATE_INVENTORY: `${API_BASE}/inventory`,
    NEXT_PUBLIC_DELETE_INVENTORY: `${API_BASE}/inventory`,

    // Inventory Subtraction
    NEXT_PUBLIC_CREATE_INVENTORY_SUBTRACTION: `${API_BASE}/inventory-subtraction`,
    NEXT_PUBLIC_GET_INVENTORY_SUBTRACTION: `${API_BASE}/inventory-subtraction`,
    NEXT_PUBLIC_GET_INVENTORY_SUBTRACTION_BY_ID: `${API_BASE}/inventory-subtraction`,
    NEXT_PUBLIC_GET_INVENTORY_SUBTRACTION_BY_INVENTORY: `${API_BASE}/inventory-subtraction/inventory`,
    NEXT_PUBLIC_DELETE_INVENTORY_SUBTRACTION: `${API_BASE}/inventory-subtraction`,

    // Inventory Addition
    NEXT_PUBLIC_CREATE_INVENTORY_ADDITION: `${API_BASE}/inventory/additions`,
    NEXT_PUBLIC_GET_INVENTORY_ADDITION: `${API_BASE}/inventory/additions`,
    NEXT_PUBLIC_GET_INVENTORY_ADDITION_BY_ID: `${API_BASE}/inventory/additions`,
    NEXT_PUBLIC_GET_INVENTORY_ADDITION_BY_INVENTORY: `${API_BASE}/inventory/additions/inventory`,
    NEXT_PUBLIC_DELETE_INVENTORY_ADDITION: `${API_BASE}/inventory/additions`,

    // Inventory Categories
    NEXT_PUBLIC_GET_INVENTORY_CATEGORIES: `${API_BASE}/inventory-categories`,
    NEXT_PUBLIC_CREATE_INVENTORY_CATEGORY: `${API_BASE}/inventory-categories`,
    NEXT_PUBLIC_UPDATE_INVENTORY_CATEGORY: `${API_BASE}/inventory-categories`,
    NEXT_PUBLIC_DELETE_INVENTORY_CATEGORY: `${API_BASE}/inventory-categories`,
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "zunkiree",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with Turbo)
  automaticVercelMonitors: true,
});
