import prisma from "../config/db";

// Create Inventory Subtraction and Update Main Inventory
export const createInventorySubtraction = async (data: {
  inventory_id: number;
  date?: Date;
  quantity: number;
  remarks?: string;
  reason?: string; // Reason code: PRODUCTION_USE, DAMAGED, SAMPLE, RETURNED, EXPIRED, OTHER
}) => {
  // Use a transaction to ensure both operations succeed or fail together
  return await prisma.$transaction(async (tx) => {
    // 1. Check if inventory exists and has enough quantity
    const inventory = await tx.inventory.findUnique({
      where: { id: data.inventory_id },
    });

    if (!inventory) {
      throw new Error("Inventory item not found");
    }

    if (inventory.quantity < data.quantity) {
      throw new Error(
        `Insufficient inventory. Available: ${inventory.quantity}, Requested: ${data.quantity}`
      );
    }

    // 2. Create subtraction record
    const subtraction = await tx.inventory_subtraction.create({
      data: {
        inventory_id: data.inventory_id,
        date: data.date || new Date(),
        quantity: data.quantity,
        remarks: data.remarks,
        reason: data.reason,
      },
      include: {
        inventory: true,
      },
    });

    // 3. Update inventory quantity (subtract)
    await tx.inventory.update({
      where: { id: data.inventory_id },
      data: {
        quantity: {
          decrement: data.quantity,
        },
      },
    });

    return subtraction;
  });
};

// Get All Subtractions
export const getAllSubtractions = async () => {
  return await prisma.inventory_subtraction.findMany({
    include: {
      inventory: true,
    },
    orderBy: {
      date: "desc",
    },
  });
};

// Get Subtractions by Inventory ID
export const getSubtractionsByInventoryId = async (inventoryId: number) => {
  return await prisma.inventory_subtraction.findMany({
    where: {
      inventory_id: inventoryId,
    },
    include: {
      inventory: true,
    },
    orderBy: {
      date: "desc",
    },
  });
};

// Get Subtraction by ID
export const getSubtractionById = async (id: number) => {
  return await prisma.inventory_subtraction.findUnique({
    where: { id },
    include: {
      inventory: true,
    },
  });
};

// Delete Subtraction (and optionally restore quantity)
export const deleteSubtraction = async (id: number, restoreQuantity: boolean = true) => {
  return await prisma.$transaction(async (tx) => {
    // Get the subtraction record first
    const subtraction = await tx.inventory_subtraction.findUnique({
      where: { id },
    });

    if (!subtraction) {
      throw new Error("Subtraction record not found");
    }

    // If restoreQuantity is true, add the quantity back to inventory
    if (restoreQuantity) {
      await tx.inventory.update({
        where: { id: subtraction.inventory_id },
        data: {
          quantity: {
            increment: subtraction.quantity,
          },
        },
      });
    }

    // Delete the subtraction record
    return await tx.inventory_subtraction.delete({
      where: { id },
    });
  });
};
