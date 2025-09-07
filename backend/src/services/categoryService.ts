import prisma from "../config/db";

interface CategoryData {
  category_name: string;
}

export const createCategory = async (data: CategoryData) => {
  const categoryName = data.category_name.trim().toLowerCase(); // normalize for case-insensitive check

  // Check if category already exists
  const existing = await prisma.categories.findFirst({
    where: { category_name: { equals: categoryName, mode: "insensitive" } }, // case-insensitive
  });

  if (existing) {
    throw new Error("Category already exists");
  }

  return await prisma.categories.create({
    data: { category_name: categoryName },
  });
};

export const getAllCategories = async () => {
  return await prisma.categories.findMany();
};

export const getCategoryById = async (id: number) => {
  const category = await prisma.categories.findUnique({ where: { id } });
  if (!category) throw new Error("Category not found");
  return category;
};

export const updateCategory = async (
  id: number,
  data: Partial<CategoryData>
) => {
  if (data.category_name) {
    const categoryName = data.category_name.trim().toLowerCase();

    const existing = await prisma.categories.findFirst({
      where: {
        category_name: { equals: categoryName, mode: "insensitive" },
        NOT: { id },
      },
    });

    if (existing) {
      throw new Error("Category already exists");
    }

    return await prisma.categories.update({
      where: { id },
      data: { category_name: categoryName },
    });
  }

  return await prisma.categories.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: number) => {
  return await prisma.categories.delete({ where: { id } });
};
