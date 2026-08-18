-- ============================================
-- WMG Quiz — question bank for the /quiz trivia ladder.
-- Managed from Admin → WMG Quiz. Public read so the /quiz
-- page can pull questions client-side like everything else.
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 5),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  stumper BOOLEAN NOT NULL DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS quiz_questions_level_question_idx ON quiz_questions(level, question);
CREATE INDEX IF NOT EXISTS quiz_questions_level_idx ON quiz_questions(level, sort_order);

-- Row level security — matches the existing wide-open pattern used
-- throughout this app (no real per-table auth, just a client-side
-- admin password gate).
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read quiz questions" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admin full access quiz questions" ON quiz_questions FOR ALL USING (true);

-- ==================
-- Seed: the original 100-question WMG Quiz Deck (20 per level).
-- Safe to re-run: (level, question) is unique, so existing rows
-- and any edits you've made in Admin are left untouched.
-- ==================
INSERT INTO quiz_questions (level, question, answer, stumper, sort_order) VALUES
(1, 'What do you call a baby horse?', 'A foal', false, 1),
(1, 'What is a female horse called?', 'A mare', false, 2),
(1, 'What is an adult male horse that has not been castrated called?', 'A stallion', false, 3),
(1, 'What is a castrated male horse called?', 'A gelding', false, 4),
(1, 'What do horses wear on their feet?', 'Horseshoes', false, 5),
(1, 'What is the long hair on a horse''s neck called?', 'The mane', false, 6),
(1, 'What do you sit on when you ride?', 'A saddle', false, 7),
(1, 'What do you hold to steer the horse?', 'The reins', false, 8),
(1, 'What is the hard part of a horse''s foot called?', 'The hoof', false, 9),
(1, 'What must every rider wear on their head at a SAWMGA show?', 'A helmet', false, 10),
(1, 'True or false: horses can sleep standing up.', 'True', false, 11),
(1, 'What do horses mainly eat?', 'Grass and hay', false, 12),
(1, 'Which end of the horse should you never stand directly behind?', 'The back end', false, 13),
(1, 'What is a group of horses called?', 'A herd', false, 14),
(1, 'What is the orange crunchy treat horses love?', 'A carrot', false, 15),
(1, 'What unit do we measure a horse''s height in?', 'Hands', false, 16),
(1, 'What is a young female horse under four called?', 'A filly', false, 17),
(1, 'What is a young male horse under four called?', 'A colt', false, 18),
(1, 'In Western Mounted Games, do you ride Western or English?', 'Western', false, 19),
(1, 'What is the metal piece that goes in the horse''s mouth called?', 'The bit', false, 20),

(2, 'What is the fastest gait of a horse?', 'The gallop', false, 1),
(2, 'Name the four natural gaits.', 'Walk, trot, canter, gallop', false, 2),
(2, 'How many inches are in one hand?', 'Four', false, 3),
(2, 'What does SAWMGA stand for?', 'South African Western Mounted Games Association', false, 4),
(2, 'How many barrels are used in the Barrel Race?', 'Three', false, 5),
(2, 'How many poles are used in Pole Bending I?', 'Six', false, 6),
(2, 'What is the person who shoes horses called?', 'A farrier', false, 7),
(2, 'What is a palomino?', 'A golden or cream coat with a white mane and tail', false, 8),
(2, 'What is a chestnut horse?', 'Reddish brown with a mane and tail the same colour', false, 9),
(2, 'What tool is used to clean out a horse''s hooves?', 'A hoof pick', false, 10),
(2, 'What is the strap under the belly that holds a Western saddle on?', 'The cinch', false, 11),
(2, 'What goes under the saddle to protect the horse''s back?', 'A saddle pad or blanket', false, 12),
(2, 'What is a wide white marking down the middle of the face called?', 'A blaze', false, 13),
(2, 'In Speed Ball, what kind of ball must be used?', 'A standard golf ball', false, 14),
(2, 'How many events does SAWMGA have in total?', 'Thirteen', false, 15),
(2, 'How many games are run at a provincial qualifier?', 'Five', false, 16),
(2, 'What colour ribbon must a stallion wear in its tail?', 'Yellow', false, 17),
(2, 'What colour ribbon marks a horse that kicks?', 'Red', false, 18),
(2, 'Which striped animal is a close relative of the horse?', 'The zebra', false, 19),
(2, 'In the Keyhole, what must all four of the horse''s feet do?', 'Enter the circle', false, 20),

(3, 'What is the frog?', 'The V shaped structure on the underside of the hoof', false, 1),
(3, 'Where exactly is a horse''s height measured from?', 'The withers to the ground', false, 2),
(3, 'What are the withers?', 'The ridge at the base of the neck between the shoulder blades', false, 3),
(3, 'What is the minimum age for a horse to compete at a SAWMGA show?', 'Three years old', false, 4),
(3, 'How many runs does a rider get at each event, and which one counts?', 'Two runs, the best time counts', false, 5),
(3, 'What is the maximum time allowed to complete a course before a No Time?', '120 seconds', false, 6),
(3, 'What is the standard penalty for knocking down or dislodging a pole?', 'Two seconds', false, 7),
(3, 'What is the penalty for knocking down a barrel in the Barrel Race?', 'Five seconds', false, 8),
(3, 'Name the four SAWMGA age categories.', 'Child, Junior, Senior, Veteran', false, 9),
(3, 'On what date is a rider''s age determined for the year?', '1 January of the current year', false, 10),
(3, 'What flag does the judge use to open the course?', 'A white flag held straight up in the air', false, 11),
(3, 'What flag signals a No Time or disqualification?', 'A red flag, swung low and horizontally', false, 12),
(3, 'What is colic?', 'Abdominal pain, a medical emergency in horses', false, 13),
(3, 'What is laminitis?', 'Inflammation of the sensitive laminae inside the hoof', false, 14),
(3, 'Which breed dominates Western sport and is known for sprinting the quarter mile?', 'The Quarter Horse', false, 15),
(3, 'What is a bay horse?', 'A brown or reddish body with black points', false, 16),
(3, 'What is the main difference between a snaffle and a curb bit?', 'A snaffle works on direct pressure, a curb has shanks and works on leverage', false, 17),
(3, 'What is a "lead" at canter?', 'Which foreleg reaches further forward in the stride', false, 18),
(3, 'How long is a mare''s gestation period?', 'About eleven months', false, 19),
(3, 'Which insect borne disease do South African horses get vaccinated against annually?', 'African Horse Sickness', false, 20),

(4, 'Name eight of the thirteen SAWMGA events.', 'Any eight of: Barrel Race, Big T, Birangle, Figure 8 Flag, Figure 8 Stake, Hurry Scurry, Keyhole, Pole Bending I, Pole Bending II, Quadrangle Stake, Speed Ball, Speed Barrels, Single Stake', false, 1),
(4, 'How far from the timing line is the running start?', '24.4 metres', false, 2),
(4, 'What happens if you knock over a bucket in Figure 8 Flag?', 'Disqualified', false, 3),
(4, 'What happens if the flag touches the ground in Figure 8 Flag?', 'Disqualified', false, 4),
(4, 'What happens in Speed Ball if the golf ball does not end up inside the cone?', 'No Time', false, 5),
(4, 'What must be signed before anyone may ride a stallion at a SAWMGA show?', 'A Stallion Indemnity Form', false, 6),
(4, 'May a mare with a foal at foot compete?', 'No, and neither may a mare four months or more pregnant', false, 7),
(4, 'What document must a horse have to enter a SAWMGA sanctioned show?', 'An up to date SAEF horse passport', false, 8),
(4, 'How long does a rider have to enter the arena after being notified?', 'One minute', false, 9),
(4, 'Explain the overcount principle.', 'Achieving a time one level better than your current level counts as an overcount of one, two levels better counts as an overcount of two, and so on', false, 10),
(4, 'How many of the thirteen events must you complete with the same horse-rider combination to be eligible for team selection?', 'No less than eleven', false, 11),
(4, 'How many qualifiers must you compete in, in the province where you want to be selected?', 'At least two', false, 12),
(4, 'What is the penalty for competing with attire or equipment in violation of the rules?', 'One second added', false, 13),
(4, 'What score is awarded on the combined Provincial Scoresheet for a game where a double NT was achieved?', '200 seconds', false, 14),
(4, 'Are draw reins allowed in the arena?', 'No, they are forbidden except at prize givings and march past parades', false, 15),
(4, 'Are blinkers or fly masks allowed?', 'No, anything restricting the horse''s vision is forbidden', false, 16),
(4, 'Can the same horse be entered twice in the same event?', 'No, except as a Lead Line entry', false, 17),
(4, 'What is the maximum length of a crop, including the flap?', '75 cm', false, 18),
(4, 'Which insect spreads African Horse Sickness?', 'Midges', false, 19),
(4, 'What is the average lifespan of a horse?', 'Roughly 25 to 30 years', false, 20),

(5, 'According to the rulebook, which animals does the word "horse" include?', 'All equines, including horses, ponies, donkeys and mules', true, 1),
(5, 'How does the judge signal that a clean round had penalties rather than none?', 'Swings the white flag horizontally, left to right, under the shoulder', true, 2),
(5, 'How does the judge signal a pattern break?', 'Red flag, while showing a figure of eight with the hand, fingers pointing down', true, 3),
(5, 'What is the minimum age to take part in the Rescue Race?', '12 years old as of 1 January of the current year', true, 4),
(5, 'Name two things that disqualify a team in the Ribbon Race.', 'Any two of: dropping either end of the ribbon, breaking it, or holding or locking hands', true, 5),
(5, 'Which is the only event Lead Line riders may take part in, and how is it set up?', 'Hurry Scurry, with the poles lying flat on the ground', true, 6),
(5, 'What is the fastest a Lead Line rider may go before being disqualified?', 'A trot', true, 7),
(5, 'In Pole Bending II, what happens if you break the time line while on course?', 'Disqualification, No Time', true, 8),
(5, 'In Hurry Scurry, what happens if all three jumping poles are knocked down?', 'Disqualification', true, 9),
(5, 'What is the pole spacing in Pole Bending I compared to Pole Bending II?', '6.1 m in Poles I, 6.4 m in Poles II', true, 10),
(5, 'What are the Hurry Scurry jump heights for Levels 0 and 1, compared to Level 2 and up?', '30 cm and 45 cm', true, 11),
(5, 'What makes an obstacle "dislodged" rather than knocked down?', 'It has been moved more than its base width while still standing upright', true, 12),
(5, 'How is a tie broken in a SAWMGA event?', 'The rider with the most first places wins, then most second places, and so on', true, 13),
(5, 'Can show management overrule a judge''s ruling?', 'No, under no circumstances', true, 14),
(5, 'How many vertebrae are in a horse''s neck?', 'Seven, the same as a human', true, 15),
(5, 'Why can a horse not vomit?', 'A very strong sphincter at the stomach entrance plus the angle the oesophagus enters at', true, 16),
(5, 'What is the scientific name of the domestic horse?', 'Equus ferus caballus', true, 17),
(5, 'Which is the last surviving truly wild horse species?', 'Przewalski''s horse', true, 18),
(5, 'Roughly how many bones does a horse have?', 'About 205', true, 19),
(5, 'In what year was the AQHA founded?', '1940', true, 20)

ON CONFLICT (level, question) DO NOTHING;
