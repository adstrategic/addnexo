-- CreateEnum
CREATE TYPE "auth"."StatementClientScope" AS ENUM ('OVERDUE', 'BALANCE');

-- AlterTable
ALTER TABLE "auth"."organization" ADD COLUMN     "statementClientScope" "auth"."StatementClientScope" NOT NULL DEFAULT 'OVERDUE',
ADD COLUMN     "statementScheduledRemindersEnabled" BOOLEAN NOT NULL DEFAULT false;
