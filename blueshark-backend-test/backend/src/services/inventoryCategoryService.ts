import prisma from "../config/db";

// Create Inventory Category
export const createInventoryCategory = async (data: { name: string }) => {
  return await prisma.inventory_category.create({
    data: {
      name: data.name,
    },
  });
};

// Get All Inventory Categories
export const getAllInventoryCategories = async () => {
  return await prisma.inventory_category.findMany({
    orderBy: {
      name: "asc", // Sort alphabetically
    },
    include: {
      _count: {
        select: { inventory: true }, // Include count of items in each category
      },
    },
  });
};

// Get Inventory Category by ID
export const getInventoryCategoryById = async (id: number) => {
  return await prisma.inventory_category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { inventory: true },
      },
    },
  });
};

// Update Inventory Category
export const updateInventoryCategory = async (
  id: number,
  data: { name: string }
) => {
  return await prisma.inventory_category.update({
    where: { id },
    data: {
      name: data.name,
    },
  });
};

// Delete Inventory Category
export const deleteInventoryCategory = async (id: number) => {
  // First check if any inventory items are using this category
  const itemsUsingCategory = await prisma.inventory.count({
    where: { category_id: id },
  });

  if (itemsUsingCategory > 0) {
    throw new Error(
      `Cannot delete category. ${itemsUsingCategory} inventory item(s) are using this category. Please reassign or remove them first.`
    );
  }

  return await prisma.inventory_category.delete({
    where: { id },
  });
};

// Check if category name already exists
export const categoryNameExists = async (name: string, excludeId?: number) => {
  const existing = await prisma.inventory_category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive", // Case-insensitive check
      },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!existing;
};
