// // src/services/subBatchAlteredService.ts
// import { PrismaClient } from "@prisma/client";

// export enum DepartmentStage {
//   NEW_ARRIVAL = "NEW_ARRIVAL",
//   IN_PROGRESS = "IN_PROGRESS",
//   COMPLETED = "COMPLETED",
// }



// const prisma = new PrismaClient();

// interface AlteredPieceInput {
//   sub_batch_id: number;
//   quantity: number;
//   target_department_id: number;
//   reason: string;
// }

// export const createAlteredSubBatch = async (data: AlteredPieceInput) => {
//   return await prisma.$transaction(async (tx) => {
//     // 1️⃣ Create altered record
//     const altered = await tx.sub_batch_altered.create({
//       data: {
//         sub_batch_id: data.sub_batch_id,
//         quantity: data.quantity,
//         sent_to_department_id: data.target_department_id,
//         reason: data.reason,
//       },
//     });

//     // 2️⃣ Add to department_sub_batches for target department
//     const deptSubBatch = await tx.department_sub_batches.create({
//       data: {
//         sub_batch_id: data.sub_batch_id,
//         department_id: data.target_department_id,
//         stage: DepartmentStage.NEW_ARRIVAL,
//         is_current: true,
//       },
//     });

//     // 3️⃣ Log history
//     await tx.department_sub_batch_history.create({
//       data: {
//         department_sub_batch_id: deptSubBatch.id,
//         sub_batch_id: data.sub_batch_id,
//         to_stage: DepartmentStage.NEW_ARRIVAL,
//         to_department_id: data.target_department_id,
//         reason: data.reason,
//       },
//     });

//     return altered;
//   });
// };

// export const getAllAlteredSubBatches = async () => {
//   return await prisma.sub_batch_altered.findMany({
//     include: {
//       sub_batch: true,
//       sent_to_department: true,
//     },
//   });
// };
