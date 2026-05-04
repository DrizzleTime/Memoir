UPDATE "articles"
SET "status" = CASE
  WHEN "is_published" THEN 'PUBLISHED'::"ArticleStatus"
  ELSE 'DRAFT'::"ArticleStatus"
END
WHERE "status" IS NULL;

ALTER TABLE "articles"
ALTER COLUMN "status" SET DEFAULT 'DRAFT',
ALTER COLUMN "status" SET NOT NULL;

DROP INDEX IF EXISTS "articles_is_published_published_at_id_idx";

ALTER TABLE "articles"
DROP COLUMN "is_published";
