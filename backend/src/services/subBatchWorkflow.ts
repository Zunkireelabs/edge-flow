import prisma, { Prisma, workflow_steps } from "../config/db";

export const getSubBatchWorkflowStatus = async (subBatchId: number) => {
  const workflow = await prisma.sub_batch_workflows.findUnique({
    where: { sub_batch_id: subBatchId },
    include: {
      steps: {
        orderBy: { step_index: "asc" },
        include: { department: true },
      },
    },
  });

  if (!workflow) throw new Error("Workflow not found for this sub-batch");

  const deptSubBatches = await prisma.department_sub_batches.findMany({
    where: { sub_batch_id: subBatchId },
  });

  const statusFlow = workflow.steps.map((step) => {
    const record = deptSubBatches.find(
      (d) => d.department_id === step.department_id
    );

    return {
      step_index: step.step_index,
      department_id: step.department_id,
      department_name: step.department?.name || "Unknown Department",
      stage: record?.stage || null,
      is_current: record?.is_current || false,
      remarks: record?.remarks || null,
    };
  });

  // find current department
  const currentDept = statusFlow.find((s) => s.is_current);

  // build department flow string
  const departmentFlowString = statusFlow
    .map((s) => `Department${s.department_id} (${s.department_name})`)
    .join(" -> ");

  return {
    sub_batch_id: subBatchId,
    current_step_index: workflow.current_step_index,
    currentDepartmentMessage: currentDept
      ? `It is in department ${currentDept.department_id} (${currentDept.department_name})`
      : "No current department assigned",
    departmentFlow: departmentFlowString,
    statusFlow,
  };
};
