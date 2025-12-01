// src/services/productionViewService.ts
import prisma from "../config/db";

/**
 * Get comprehensive production view data
 * Returns all sub-batches organized by departments and completion status
 */
export const getProductionViewData = async () => {
  try {
    // 1. Fetch all departments
    const departments = await prisma.departments.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    // 2. Fetch all sub-batches with their details
    const allSubBatches = await prisma.sub_batches.findMany({
      include: {
        batch: true,
        size_details: true,
        attachments: true,
      },
      orderBy: {
        start_date: 'desc'
      }
    });

    // 3. Fetch current department assignments (active sub-batches in departments)
    const departmentSubBatches = await prisma.department_sub_batches.findMany({
      where: {
        is_current: true,
      },
      include: {
        sub_batch: {
          include: {
            batch: true,
            size_details: true,
            attachments: true,
          }
        },
        department: true,
        assigned_worker: true,
        parent_card: true, // ✅ Include parent card to show remaining from main card
        // ✅ Include altered and rejected entries FROM this department_sub_batch
        altered_source: true,  // sub_batch_altered where source_department_sub_batch_id = this.id
        rejected_source: true, // sub_batch_rejected where source_department_sub_batch_id = this.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 4. Fetch completed sub-batches (status = COMPLETED)
    const completedSubBatches = await prisma.sub_batches.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        batch: true,
        size_details: true,
        attachments: true,
      },
      orderBy: {
        completed_at: 'desc'
      }
    });

    // 5. Organize sub-batches by department
    const departmentColumns = departments.map(dept => {
      // Find all sub-batches currently in this department
      const subBatchesInDept = departmentSubBatches
        .filter(dsb => dsb.department_id === dept.id && dsb.sub_batch !== null)
        .map(dsb => {
          // ✅ Calculate total altered and rejected from this department_sub_batch
          const totalAltered = (dsb as any).altered_source?.reduce((sum: number, a: any) => sum + (a.quantity || 0), 0) || 0;
          const totalRejected = (dsb as any).rejected_source?.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0) || 0;

          return {
            id: dsb.sub_batch!.id,
            name: dsb.sub_batch!.name,
            start_date: dsb.sub_batch!.start_date,
            due_date: dsb.sub_batch!.due_date,
            estimated_pieces: dsb.sub_batch!.estimated_pieces,
            expected_items: dsb.sub_batch!.expected_items,
            status: dsb.sub_batch!.status,
            batch_name: dsb.sub_batch!.batch?.name || null,
            batch_id: dsb.sub_batch!.batch_id,
            department_stage: dsb.stage, // NEW_ARRIVAL, IN_PROGRESS, COMPLETED
            quantity_remaining: dsb.quantity_remaining,
            quantity_received: dsb.quantity_received, // ✅ Include received for calculations
            assigned_worker_id: dsb.assigned_worker_id,
            assigned_worker_name: dsb.assigned_worker?.name || null,
            size_details: dsb.sub_batch!.size_details,
            attachments: dsb.sub_batch!.attachments,
            createdAt: dsb.createdAt,
            remarks: dsb.remarks,
            // ✅ Parent card data for showing "Remaining from Main Card"
            parent_card_id: dsb.parent_card?.id || null,
            parent_card_quantity_remaining: dsb.parent_card?.quantity_remaining || null,
            // ✅ NEW: Altered and Rejected totals for Kanban card display
            total_altered: totalAltered,
            total_rejected: totalRejected,
          };
        });

      return {
        department_id: dept.id,
        department_name: dept.name,
        task_count: subBatchesInDept.length,
        sub_batches: subBatchesInDept,
      };
    });

    // 6. Format all sub-batches for left sidebar
    const formattedAllSubBatches = allSubBatches.map(sb => ({
      id: sb.id,
      name: sb.name,
      start_date: sb.start_date,
      due_date: sb.due_date,
      estimated_pieces: sb.estimated_pieces,
      expected_items: sb.expected_items,
      status: sb.status,
      batch_name: sb.batch?.name || null,
      batch_id: sb.batch_id,
      completed_at: sb.completed_at,
    }));

    // 7. Format completed sub-batches
    const formattedCompletedSubBatches = completedSubBatches.map(sb => ({
      id: sb.id,
      name: sb.name,
      start_date: sb.start_date,
      due_date: sb.due_date,
      estimated_pieces: sb.estimated_pieces,
      expected_items: sb.expected_items,
      status: sb.status,
      batch_name: sb.batch?.name || null,
      batch_id: sb.batch_id,
      completed_at: sb.completed_at,
      size_details: sb.size_details,
      attachments: sb.attachments,
    }));

    // 8. Return organized data
    return {
      all_sub_batches: formattedAllSubBatches,
      department_columns: departmentColumns,
      completed_sub_batches: formattedCompletedSubBatches,
      total_departments: departments.length,
      total_sub_batches: allSubBatches.length,
      total_completed: completedSubBatches.length,
      total_in_production: departmentSubBatches.length,
    };
  } catch (error) {
    console.error('Error fetching production view data:', error);
    throw new Error('Failed to fetch production view data');
  }
};

/**
 * Get production view data with date filtering
 */
export const getProductionViewDataWithFilter = async (
  startDate?: Date,
  endDate?: Date,
  departmentId?: number
) => {
  try {
    const baseData = await getProductionViewData();

    // Apply filters if provided
    let filteredData = { ...baseData };

    if (startDate || endDate) {
      // Filter all sub-batches by date range
      filteredData.all_sub_batches = baseData.all_sub_batches.filter(sb => {
        const sbStartDate = new Date(sb.start_date);
        if (startDate && sbStartDate < startDate) return false;
        if (endDate && sbStartDate > endDate) return false;
        return true;
      });

      // Filter completed sub-batches by completion date
      filteredData.completed_sub_batches = baseData.completed_sub_batches.filter(sb => {
        if (!sb.completed_at) return false;
        const completedDate = new Date(sb.completed_at);
        if (startDate && completedDate < startDate) return false;
        if (endDate && completedDate > endDate) return false;
        return true;
      });
    }

    if (departmentId) {
      // Filter to show only specific department
      filteredData.department_columns = baseData.department_columns.filter(
        dc => dc.department_id === departmentId
      );
    }

    // Recalculate totals after filtering
    filteredData.total_sub_batches = filteredData.all_sub_batches.length;
    filteredData.total_completed = filteredData.completed_sub_batches.length;

    return filteredData;
  } catch (error) {
    console.error('Error fetching filtered production view data:', error);
    throw new Error('Failed to fetch filtered production view data');
  }
};
