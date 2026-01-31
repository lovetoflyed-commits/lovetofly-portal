-- Migration: 085_backfill_hangar_review_owner.sql
-- Date: 2026-01-28
-- Description: Backfill owner and reviewer fields for legacy reviews

UPDATE hangar_reviews
SET reviewer_user_id = COALESCE(reviewer_user_id, user_id)
WHERE reviewer_user_id IS NULL;

UPDATE hangar_reviews hr
SET owner_user_id = COALESCE(hr.owner_user_id, hl.owner_id)
FROM hangar_listings hl
WHERE hr.listing_id = hl.id AND hr.owner_user_id IS NULL;
