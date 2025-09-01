import bcrypt from "bcrypt";

// Compare plain password with hashed password
export const comparePassword = async (
  plain: string,
  hashed: string
): Promise<boolean> => {
  return await bcrypt.compare(plain, hashed);
};
