-- First, drop the existing default on the column
ALTER TABLE "Organization" ALTER COLUMN "plan" DROP DEFAULT;

-- Create new enum type with all values
CREATE TYPE "Plan_new" AS ENUM ('none', 'starter', 'growth', 'enterprise');

-- Migrate existing data (cast starter to starter, etc.)
ALTER TABLE "Organization" ALTER COLUMN "plan" TYPE "Plan_new" USING ("plan"::text::"Plan_new");

-- Drop old enum
DROP TYPE "Plan";

-- Rename new enum to old name
ALTER TYPE "Plan_new" RENAME TO "Plan";

-- Set new default
ALTER TABLE "Organization" ALTER COLUMN "plan" SET DEFAULT 'none';
