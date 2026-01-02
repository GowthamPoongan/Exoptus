import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Validation middleware factory
 * Validates request body against Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }
  };
};
