// src/services/categoryService.ts
import prisma from "../config/db";
import { CategoryData } from "../types/category";

export const createCategory = async (data: CategoryData) => {
  const categoryData: any = {
    category: data.category,
    pieces: data.pieces,
  };

  if (data.subBatchId) {
    categoryData.sub_batch = { connect: { id: data.subBatchId } };
  }

  return await prisma.sub_batch_size_details.create({
    data: categoryData,
    include: { sub_batch: true }, // include sub-batch info if linked
  });
};

export const getAllCategories = async () => {
  return await prisma.sub_batch_size_details.findMany({
    include: { sub_batch: true },
  });
};

export const getCategoryById = async (id: number) => {
  const category = await prisma.sub_batch_size_details.findUnique({
    where: { id },
    include: { sub_batch: true },
  });
  if (!category) throw new Error("Category not found");
  return category;
};

export const updateCategory = async (
  id: number,
  data: Partial<CategoryData>
) => {
  const updateData: any = { ...data };
  if (data.subBatchId) {
    updateData.sub_batch = { connect: { id: data.subBatchId } };
    delete updateData.subBatchId;
  }

  return await prisma.sub_batch_size_details.update({
    where: { id },
    data: updateData,
    include: { sub_batch: true },
  });
};

export const deleteCategory = async (id: number) => {
  return await prisma.sub_batch_size_details.delete({
    where: { id },
  });
};
