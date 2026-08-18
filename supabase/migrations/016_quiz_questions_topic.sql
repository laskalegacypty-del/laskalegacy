-- ============================================
-- WMG Quiz — topic tagging
-- Adds a fixed-list topic field to quiz_questions so Admin can
-- filter the question bank by topic (in addition to level).
-- Topics are a closed set chosen from a dropdown in Admin, not
-- freeform text — see QUIZ_TOPICS in components/LaskaLegacy.jsx.
-- Run this in your Supabase SQL Editor, after 015_quiz_questions.sql
-- ============================================

ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS quiz_questions_topic_idx ON quiz_questions(topic);

-- ==================
-- Backfill topics for the original 100-question seeded deck,
-- matched by level + sort_order (assigned in 015_quiz_questions.sql).
-- Safe to re-run.
-- ==================

UPDATE quiz_questions SET topic = 'Horse Basics' WHERE level = 1 AND sort_order IN (1,2,3,4,6,9,11,12,13,14,15,16,17,18);
UPDATE quiz_questions SET topic = 'Tack & Equipment' WHERE level = 1 AND sort_order IN (5,7,8,10,20);
UPDATE quiz_questions SET topic = 'SAWMGA Rules & Events' WHERE level = 1 AND sort_order IN (19);

UPDATE quiz_questions SET topic = 'Gaits & Riding' WHERE level = 2 AND sort_order IN (1,2);
UPDATE quiz_questions SET topic = 'Horse Basics' WHERE level = 2 AND sort_order IN (3,7,8,9,13,19);
UPDATE quiz_questions SET topic = 'SAWMGA Rules & Events' WHERE level = 2 AND sort_order IN (4,5,6,14,15,16,17,18,20);
UPDATE quiz_questions SET topic = 'Tack & Equipment' WHERE level = 2 AND sort_order IN (10,11,12);

UPDATE quiz_questions SET topic = 'Horse Basics' WHERE level = 3 AND sort_order IN (1,2,3,15,16);
UPDATE quiz_questions SET topic = 'SAWMGA Rules & Events' WHERE level = 3 AND sort_order IN (4,5,6,7,8,9,10,11,12);
UPDATE quiz_questions SET topic = 'Health & Care' WHERE level = 3 AND sort_order IN (13,14,19,20);
UPDATE quiz_questions SET topic = 'Tack & Equipment' WHERE level = 3 AND sort_order IN (17);
UPDATE quiz_questions SET topic = 'Gaits & Riding' WHERE level = 3 AND sort_order IN (18);

UPDATE quiz_questions SET topic = 'SAWMGA Rules & Events' WHERE level = 4 AND sort_order IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,17);
UPDATE quiz_questions SET topic = 'Tack & Equipment' WHERE level = 4 AND sort_order IN (15,16,18);
UPDATE quiz_questions SET topic = 'Health & Care' WHERE level = 4 AND sort_order IN (19,20);

UPDATE quiz_questions SET topic = 'SAWMGA Rules & Events' WHERE level = 5 AND sort_order BETWEEN 1 AND 14;
UPDATE quiz_questions SET topic = 'History & Trivia' WHERE level = 5 AND sort_order BETWEEN 15 AND 20;
