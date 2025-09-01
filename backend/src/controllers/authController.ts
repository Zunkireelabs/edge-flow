import { Request, Response } from "express";
import * as authService from "../services/authService";

// Signup controller
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const data = await authService.signupUser(email, password);

    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.createdAt,
      },
      token: data.token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const data = await authService.loginUser(email, password);

    res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.createdAt,
      },
      token: data.token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
