-- AlterEnum
ALTER TYPE "Plan" ADD VALUE 'none';

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "plan" SET DEFAULT 'none';
