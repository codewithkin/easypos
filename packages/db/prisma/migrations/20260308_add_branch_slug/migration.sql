-- AlterTable
ALTER TABLE "Branch" ADD COLUMN "slug" TEXT;

-- Populate slug for existing branches (convert name to slug)
UPDATE "Branch" 
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM("name"),
        '\s+',
        '-',
        'g'
      ),
      '[^a-z0-9-]',
      '',
      'g'
    ),
    '-+',
    '-',
    'g'
  )
)
WHERE "slug" IS NULL;

-- Make slug NOT NULL
ALTER TABLE "Branch" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique constraint for (orgId, slug)
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_orgId_slug_key" UNIQUE ("orgId", "slug");
