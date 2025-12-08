import prisma from "../config/db";

// Create Inventory Item
export const createInventory = async (data: {
  name: string;
  unit: string;
  date?: Date;
  quantity: number;
  price: number;
  vendor: string;
  phone: string;
  remarks?: string;
  category_id?: number | null;
  min_quantity?: number;
}) => {
  return await prisma.inventory.create({
    data,
    include: {
      category: true,
    },
  });
};

// Get All Inventory Items
export const getAllInventory = async () => {
  return await prisma.inventory.findMany({
    orderBy: {
      date: "desc", // Sort by date, newest first
    },
    include: {
      category: true, // Include category relation
    },
  });
};

// Get Low Stock Items (quantity <= min_quantity)
export const getLowStockItems = async () => {
  return await prisma.inventory.findMany({
    where: {
      AND: [
        { min_quantity: { gt: 0 } }, // Only items with min_quantity set
        {
          quantity: {
            lte: prisma.inventory.fields.min_quantity,
          },
        },
      ],
    },
    include: {
      category: true,
    },
    orderBy: {
      quantity: "asc",
    },
  });
};

// Get Inventory Item by ID
export const getInventoryById = async (id: number) => {
  return await prisma.inventory.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
};

// Update Inventory Item
export const updateInventory = async (
  id: number,
  data: {
    name?: string;
    unit?: string;
    date?: Date;
    quantity?: number;
    price?: number;
    vendor?: string;
    phone?: string;
    remarks?: string;
    category_id?: number | null;
    min_quantity?: number;
  }
) => {
  return await prisma.inventory.update({
    where: { id },
    data,
    include: {
      category: true,
    },
  });
};

// Delete Inventory Item
export const deleteInventory = async (id: number) => {
  return await prisma.inventory.delete({
    where: { id },
  });
};

// Create Inventory Addition and Update Main Inventory
export const createInventoryAddition = async (data: {
  inventory_id: number;
  date?: Date;
  quantity: number;
  remarks?: string;
}) => {
  // Use a transaction to ensure both operations succeed or fail together
  return await prisma.$transaction(async (tx) => {
    // 1. Check if inventory exists
    const inventory = await tx.inventory.findUnique({
      where: { id: data.inventory_id },
    });

    if (!inventory) {
      throw new Error("Inventory item not found");
    }

    // 2. Create addition record
    const addition = await tx.inventory_addition.create({
      data: {
        inventory_id: data.inventory_id,
        date: data.date || new Date(),
        quantity: data.quantity,
        remarks: data.remarks,
      },
      include: {
        inventory: true,
      },
    });

    // 3. Update inventory quantity (add)
    await tx.inventory.update({
      where: { id: data.inventory_id },
      data: {
        quantity: {
          increment: data.quantity,
        },
      },
    });

    return addition;
  });
};

// Get All Additions
export const getAllAdditions = async () => {
  return await prisma.inventory_addition.findMany({
    include: {
      inventory: true,
    },
    orderBy: {
      date: "desc",
    },
  });
};

// Get Additions by Inventory ID
export const getAdditionsByInventoryId = async (inventoryId: number) => {
  return await prisma.inventory_addition.findMany({
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

// Get Addition by ID
export const getAdditionById = async (id: number) => {
  return await prisma.inventory_addition.findUnique({
    where: { id },
    include: {
      inventory: true,
    },
  });
};

// Delete Addition (and optionally remove quantity)
export const deleteAddition = async (id: number, removeQuantity: boolean = true) => {
  return await prisma.$transaction(async (tx) => {
    // Get the addition record first
    const addition = await tx.inventory_addition.findUnique({
      where: { id },
    });

    if (!addition) {
      throw new Error("Addition record not found");
    }

    // If removeQuantity is true, subtract the quantity back from inventory
    if (removeQuantity) {
      await tx.inventory.update({
        where: { id: addition.inventory_id },
        data: {
          quantity: {
            decrement: addition.quantity,
          },
        },
      });
    }

    // Delete the addition record
    return await tx.inventory_addition.delete({
      where: { id },
    });
  });
};
