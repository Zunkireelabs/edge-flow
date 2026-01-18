import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Database Backup and Reset Script
 *
 * Purpose: Clear all production data for fresh start
 * Preserves: admin@gmail.com user credentials
 *
 * FB-004: Client request to clear all data
 * Date: 2026-01-18
 */

interface BackupData {
  timestamp: string;
  tables: {
    [tableName: string]: unknown[];
  };
}

async function exportAllData(): Promise<BackupData> {
  console.log('📦 Exporting all data to backup...\n');

  const backup: BackupData = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  // Export all tables
  console.log('   Exporting User...');
  backup.tables.User = await prisma.user.findMany();
  console.log(`   ✓ User: ${backup.tables.User.length} records`);

  console.log('   Exporting Supervisor...');
  backup.tables.Supervisor = await prisma.supervisor.findMany();
  console.log(`   ✓ Supervisor: ${backup.tables.Supervisor.length} records`);

  console.log('   Exporting departments...');
  backup.tables.departments = await prisma.departments.findMany();
  console.log(`   ✓ departments: ${backup.tables.departments.length} records`);

  console.log('   Exporting vendors...');
  backup.tables.vendors = await prisma.vendors.findMany();
  console.log(`   ✓ vendors: ${backup.tables.vendors.length} records`);

  console.log('   Exporting clients...');
  backup.tables.clients = await prisma.clients.findMany();
  console.log(`   ✓ clients: ${backup.tables.clients.length} records`);

  console.log('   Exporting categories...');
  backup.tables.categories = await prisma.categories.findMany();
  console.log(`   ✓ categories: ${backup.tables.categories.length} records`);

  console.log('   Exporting workflow_templates...');
  backup.tables.workflow_templates = await prisma.workflow_templates.findMany();
  console.log(`   ✓ workflow_templates: ${backup.tables.workflow_templates.length} records`);

  console.log('   Exporting workflow_steps...');
  backup.tables.workflow_steps = await prisma.workflow_steps.findMany();
  console.log(`   ✓ workflow_steps: ${backup.tables.workflow_steps.length} records`);

  console.log('   Exporting rolls...');
  backup.tables.rolls = await prisma.rolls.findMany();
  console.log(`   ✓ rolls: ${backup.tables.rolls.length} records`);

  console.log('   Exporting batches...');
  backup.tables.batches = await prisma.batches.findMany();
  console.log(`   ✓ batches: ${backup.tables.batches.length} records`);

  console.log('   Exporting batch_rolls...');
  backup.tables.batch_rolls = await prisma.batch_rolls.findMany();
  console.log(`   ✓ batch_rolls: ${backup.tables.batch_rolls.length} records`);

  console.log('   Exporting batch_sizes...');
  backup.tables.batch_sizes = await prisma.batch_sizes.findMany();
  console.log(`   ✓ batch_sizes: ${backup.tables.batch_sizes.length} records`);

  console.log('   Exporting sub_batches...');
  backup.tables.sub_batches = await prisma.sub_batches.findMany();
  console.log(`   ✓ sub_batches: ${backup.tables.sub_batches.length} records`);

  console.log('   Exporting sub_batch_size_details...');
  backup.tables.sub_batch_size_details = await prisma.sub_batch_size_details.findMany();
  console.log(`   ✓ sub_batch_size_details: ${backup.tables.sub_batch_size_details.length} records`);

  console.log('   Exporting sub_batch_attachments...');
  backup.tables.sub_batch_attachments = await prisma.sub_batch_attachments.findMany();
  console.log(`   ✓ sub_batch_attachments: ${backup.tables.sub_batch_attachments.length} records`);

  console.log('   Exporting sub_batch_workflows...');
  backup.tables.sub_batch_workflows = await prisma.sub_batch_workflows.findMany();
  console.log(`   ✓ sub_batch_workflows: ${backup.tables.sub_batch_workflows.length} records`);

  console.log('   Exporting sub_batch_workflow_steps...');
  backup.tables.sub_batch_workflow_steps = await prisma.sub_batch_workflow_steps.findMany();
  console.log(`   ✓ sub_batch_workflow_steps: ${backup.tables.sub_batch_workflow_steps.length} records`);

  console.log('   Exporting sub_batch_rejected...');
  backup.tables.sub_batch_rejected = await prisma.sub_batch_rejected.findMany();
  console.log(`   ✓ sub_batch_rejected: ${backup.tables.sub_batch_rejected.length} records`);

  console.log('   Exporting sub_batch_altered...');
  backup.tables.sub_batch_altered = await prisma.sub_batch_altered.findMany();
  console.log(`   ✓ sub_batch_altered: ${backup.tables.sub_batch_altered.length} records`);

  console.log('   Exporting department_sub_batches...');
  backup.tables.department_sub_batches = await prisma.department_sub_batches.findMany();
  console.log(`   ✓ department_sub_batches: ${backup.tables.department_sub_batches.length} records`);

  console.log('   Exporting department_sub_batch_history...');
  backup.tables.department_sub_batch_history = await prisma.department_sub_batch_history.findMany();
  console.log(`   ✓ department_sub_batch_history: ${backup.tables.department_sub_batch_history.length} records`);

  console.log('   Exporting workers...');
  backup.tables.workers = await prisma.workers.findMany();
  console.log(`   ✓ workers: ${backup.tables.workers.length} records`);

  console.log('   Exporting worker_logs...');
  backup.tables.worker_logs = await prisma.worker_logs.findMany();
  console.log(`   ✓ worker_logs: ${backup.tables.worker_logs.length} records`);

  console.log('   Exporting department_workers...');
  backup.tables.department_workers = await prisma.department_workers.findMany();
  console.log(`   ✓ department_workers: ${backup.tables.department_workers.length} records`);

  console.log('   Exporting inventory_category...');
  backup.tables.inventory_category = await prisma.inventory_category.findMany();
  console.log(`   ✓ inventory_category: ${backup.tables.inventory_category.length} records`);

  console.log('   Exporting inventory...');
  backup.tables.inventory = await prisma.inventory.findMany();
  console.log(`   ✓ inventory: ${backup.tables.inventory.length} records`);

  console.log('   Exporting inventory_subtraction...');
  backup.tables.inventory_subtraction = await prisma.inventory_subtraction.findMany();
  console.log(`   ✓ inventory_subtraction: ${backup.tables.inventory_subtraction.length} records`);

  console.log('   Exporting inventory_addition...');
  backup.tables.inventory_addition = await prisma.inventory_addition.findMany();
  console.log(`   ✓ inventory_addition: ${backup.tables.inventory_addition.length} records`);

  return backup;
}

async function deleteAllData(): Promise<void> {
  console.log('\n🗑️  Deleting all data (respecting FK constraints)...\n');

  // Phase 1: Leaf tables (no incoming FK references)
  console.log('   Phase 1: Deleting leaf tables...');

  const inventorySubtractionCount = await prisma.inventory_subtraction.deleteMany();
  console.log(`   ✓ inventory_subtraction: ${inventorySubtractionCount.count} deleted`);

  const inventoryAdditionCount = await prisma.inventory_addition.deleteMany();
  console.log(`   ✓ inventory_addition: ${inventoryAdditionCount.count} deleted`);

  const deptHistoryCount = await prisma.department_sub_batch_history.deleteMany();
  console.log(`   ✓ department_sub_batch_history: ${deptHistoryCount.count} deleted`);

  const subBatchWorkflowStepsCount = await prisma.sub_batch_workflow_steps.deleteMany();
  console.log(`   ✓ sub_batch_workflow_steps: ${subBatchWorkflowStepsCount.count} deleted`);

  const batchSizesCount = await prisma.batch_sizes.deleteMany();
  console.log(`   ✓ batch_sizes: ${batchSizesCount.count} deleted`);

  // Phase 2: Tables referencing worker_logs
  console.log('\n   Phase 2: Deleting tables referencing worker_logs...');

  const rejectedCount = await prisma.sub_batch_rejected.deleteMany();
  console.log(`   ✓ sub_batch_rejected: ${rejectedCount.count} deleted`);

  const alteredCount = await prisma.sub_batch_altered.deleteMany();
  console.log(`   ✓ sub_batch_altered: ${alteredCount.count} deleted`);

  // Phase 3: Worker logs and department workers
  console.log('\n   Phase 3: Deleting worker logs and department workers...');

  const workerLogsCount = await prisma.worker_logs.deleteMany();
  console.log(`   ✓ worker_logs: ${workerLogsCount.count} deleted`);

  const deptWorkersCount = await prisma.department_workers.deleteMany();
  console.log(`   ✓ department_workers: ${deptWorkersCount.count} deleted`);

  // Phase 4: Sub-batch related tables
  console.log('\n   Phase 4: Deleting sub-batch related tables...');

  const attachmentsCount = await prisma.sub_batch_attachments.deleteMany();
  console.log(`   ✓ sub_batch_attachments: ${attachmentsCount.count} deleted`);

  const sizeDetailsCount = await prisma.sub_batch_size_details.deleteMany();
  console.log(`   ✓ sub_batch_size_details: ${sizeDetailsCount.count} deleted`);

  const subBatchWorkflowsCount = await prisma.sub_batch_workflows.deleteMany();
  console.log(`   ✓ sub_batch_workflows: ${subBatchWorkflowsCount.count} deleted`);

  // Phase 5: Break self-reference in department_sub_batches, then delete
  console.log('\n   Phase 5: Breaking self-references and deleting department_sub_batches...');

  // First, nullify the parent references to break circular dependency
  await prisma.department_sub_batches.updateMany({
    where: { parent_department_sub_batch_id: { not: null } },
    data: { parent_department_sub_batch_id: null }
  });
  console.log('   ✓ Nullified parent_department_sub_batch_id references');

  const deptSubBatchesCount = await prisma.department_sub_batches.deleteMany();
  console.log(`   ✓ department_sub_batches: ${deptSubBatchesCount.count} deleted`);

  // Phase 6: Workflow steps
  console.log('\n   Phase 6: Deleting workflow steps...');

  const workflowStepsCount = await prisma.workflow_steps.deleteMany();
  console.log(`   ✓ workflow_steps: ${workflowStepsCount.count} deleted`);

  // Phase 7: Sub-batches
  console.log('\n   Phase 7: Deleting sub-batches...');

  const subBatchesCount = await prisma.sub_batches.deleteMany();
  console.log(`   ✓ sub_batches: ${subBatchesCount.count} deleted`);

  // Phase 8: Batch related tables
  console.log('\n   Phase 8: Deleting batch related tables...');

  const batchRollsCount = await prisma.batch_rolls.deleteMany();
  console.log(`   ✓ batch_rolls: ${batchRollsCount.count} deleted`);

  const batchesCount = await prisma.batches.deleteMany();
  console.log(`   ✓ batches: ${batchesCount.count} deleted`);

  // Phase 9: Rolls
  console.log('\n   Phase 9: Deleting rolls...');

  const rollsCount = await prisma.rolls.deleteMany();
  console.log(`   ✓ rolls: ${rollsCount.count} deleted`);

  // Phase 10: Workers and Supervisors
  console.log('\n   Phase 10: Deleting workers and supervisors...');

  const workersCount = await prisma.workers.deleteMany();
  console.log(`   ✓ workers: ${workersCount.count} deleted`);

  const supervisorsCount = await prisma.supervisor.deleteMany();
  console.log(`   ✓ Supervisor: ${supervisorsCount.count} deleted`);

  // Phase 11: Departments and workflow templates
  console.log('\n   Phase 11: Deleting departments and workflow templates...');

  const departmentsCount = await prisma.departments.deleteMany();
  console.log(`   ✓ departments: ${departmentsCount.count} deleted`);

  const workflowTemplatesCount = await prisma.workflow_templates.deleteMany();
  console.log(`   ✓ workflow_templates: ${workflowTemplatesCount.count} deleted`);

  // Phase 12: Vendors, clients, categories
  console.log('\n   Phase 12: Deleting vendors, clients, categories...');

  const vendorsCount = await prisma.vendors.deleteMany();
  console.log(`   ✓ vendors: ${vendorsCount.count} deleted`);

  const clientsCount = await prisma.clients.deleteMany();
  console.log(`   ✓ clients: ${clientsCount.count} deleted`);

  const categoriesCount = await prisma.categories.deleteMany();
  console.log(`   ✓ categories: ${categoriesCount.count} deleted`);

  // Phase 13: Inventory
  console.log('\n   Phase 13: Deleting inventory...');

  const inventoryCount = await prisma.inventory.deleteMany();
  console.log(`   ✓ inventory: ${inventoryCount.count} deleted`);

  const inventoryCategoryCount = await prisma.inventory_category.deleteMany();
  console.log(`   ✓ inventory_category: ${inventoryCategoryCount.count} deleted`);

  // Phase 14: Users (keep admin@gmail.com)
  console.log('\n   Phase 14: Deleting users (preserving admin@gmail.com)...');

  const usersCount = await prisma.user.deleteMany({
    where: {
      email: { not: 'admin@gmail.com' }
    }
  });
  console.log(`   ✓ User: ${usersCount.count} deleted (admin@gmail.com preserved)`);
}

async function verifyAdminExists(): Promise<boolean> {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' }
  });
  return admin !== null;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   BlueShark Database Backup and Reset Script');
  console.log('   FB-004: Clear all data for fresh start');
  console.log('   Date: 2026-01-18');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Verify admin exists before proceeding
    console.log('🔍 Step 1: Verifying admin@gmail.com exists...');
    const adminExists = await verifyAdminExists();
    if (!adminExists) {
      console.error('❌ ERROR: admin@gmail.com not found! Aborting to prevent lockout.');
      process.exit(1);
    }
    console.log('   ✓ admin@gmail.com found\n');

    // Step 2: Export all data to backup
    console.log('🔍 Step 2: Creating backup...');
    const backup = await exportAllData();

    // Step 3: Save backup to file
    console.log('\n💾 Step 3: Saving backup to file...');
    const backupDir = path.resolve(__dirname, '../../../docs/backups');
    const backupFile = path.join(backupDir, '2026-01-18-pre-reset-backup.json');

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`   ✓ Backup saved to: ${backupFile}`);

    // Calculate total records
    let totalRecords = 0;
    for (const table of Object.keys(backup.tables)) {
      totalRecords += (backup.tables[table] as unknown[]).length;
    }
    console.log(`   ✓ Total records backed up: ${totalRecords}`);

    // Step 4: Delete all data
    console.log('\n🔍 Step 4: Deleting all data...');
    await deleteAllData();

    // Step 5: Verify admin still exists
    console.log('\n🔍 Step 5: Verifying admin@gmail.com still exists...');
    const adminStillExists = await verifyAdminExists();
    if (!adminStillExists) {
      console.error('❌ CRITICAL ERROR: admin@gmail.com was deleted! Check backup file.');
      process.exit(1);
    }
    console.log('   ✓ admin@gmail.com verified\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   ✅ DATABASE RESET COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Backup file: ${backupFile}`);
    console.log(`   Total records backed up: ${totalRecords}`);
    console.log('   Admin login: admin@gmail.com / admin');
    console.log('');
    console.log('   Next steps:');
    console.log('   1. Verify login at https://edge-flow-gamma.vercel.app');
    console.log('   2. Dashboard should show 0 counts');
    console.log('   3. Notify client that reset is complete');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR during backup/reset:', error);
    console.error('\n⚠️  If data was partially deleted, restore from backup file.');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
