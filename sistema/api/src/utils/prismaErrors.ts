import { Prisma } from '@prisma/client';

export const PRISMA_ERROR = {
  UNIQUE_VIOLATION: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
} as const;

type PrismaErrorCode = (typeof PRISMA_ERROR)[keyof typeof PRISMA_ERROR];

export const isPrismaError = (
  error: unknown,
  code: PrismaErrorCode,
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
