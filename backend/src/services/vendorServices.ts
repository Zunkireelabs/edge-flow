import prisma from "../config/db";

interface VendorData {
  name: string;
  vat_pan: string;
  address: string;
  phone: string;
  comment?: string;
  roll_ids?: number[]; // optional array of existing roll IDs
  batch_ids?: number[]; // optional array of existing batch IDs
}

export const createVendor = async (data: VendorData) => {
  const vendorData: any = {
    name: data.name,
    vat_pan: data.vat_pan,
    address: data.address,
    phone: data.phone,
    comment: data.comment,
  };

  if (data.roll_ids && data.roll_ids.length > 0) {
    vendorData.rolls = { connect: data.roll_ids.map((id) => ({ id })) };
  }

  if (data.batch_ids && data.batch_ids.length > 0) {
    vendorData.batches = { connect: data.batch_ids.map((id) => ({ id })) };
  }

  return await prisma.vendors.create({
    data: vendorData,
    include: { rolls: true, batches: true },
  });
};

export const getAllVendors = async () => {
  return await prisma.vendors.findMany({
    include: { rolls: true, batches: true },
  });
};

export const getVendorById = async (id: number) => {
  const vendor = await prisma.vendors.findUnique({
    where: { id },
    include: { rolls: true, batches: true },
  });
  if (!vendor) throw new Error("Vendor not found");
  return vendor;
};

export const updateVendor = async (id: number, data: Partial<VendorData>) => {
  const updateData: any = { ...data };

  if (data.roll_ids && data.roll_ids.length > 0) {
    updateData.rolls = { connect: data.roll_ids.map((id) => ({ id })) };
    delete updateData.roll_ids;
  }

  if (data.batch_ids && data.batch_ids.length > 0) {
    updateData.batches = { connect: data.batch_ids.map((id) => ({ id })) };
    delete updateData.batch_ids;
  }

  return await prisma.vendors.update({
    where: { id },
    data: updateData,
    include: { rolls: true, batches: true },
  });
};

export const deleteVendor = async (id: number) => {
  return await prisma.vendors.delete({ where: { id } });
};
