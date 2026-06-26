import type { Request, RequestHandler } from "express";

import multer from "multer";

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

// File size limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILES = 10;

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only PDF, JPG, and PNG files are allowed. Received: ${file.mimetype}`,
      ),
    );
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

// Middleware for multiple files (explicit type for portable .d.ts emit with declaration: true)
export const uploadMultiple: RequestHandler = upload.array(
  "documents",
  MAX_FILES,
);

// Export constants for validation
export const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_MIME_TYPES,
};
