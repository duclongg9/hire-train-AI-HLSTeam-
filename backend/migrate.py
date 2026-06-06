import psycopg2
from config import settings

sql = """
DELETE FROM public.rubric_criteria;
DELETE FROM public.test_questions;

-- 1. Alter rubric_criteria
ALTER TABLE public.rubric_criteria RENAME COLUMN campaign_id TO position_id;
-- Change constraint if necessary (assuming it was campaign_id foreign key)
-- But since it's just a column rename, it's fine for now. We might need to drop old FK and add new FK.
ALTER TABLE public.rubric_criteria DROP CONSTRAINT IF EXISTS rubric_criteria_campaign_id_fkey;
ALTER TABLE public.rubric_criteria ADD CONSTRAINT rubric_criteria_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE CASCADE;

-- 2. Alter test_questions
ALTER TABLE public.test_questions RENAME COLUMN campaign_id TO position_id;
ALTER TABLE public.test_questions DROP CONSTRAINT IF EXISTS test_questions_campaign_id_fkey;
ALTER TABLE public.test_questions ADD CONSTRAINT test_questions_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE CASCADE;

-- 3. Add status to positions
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT';
"""

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
try:
    cur.execute(sql)
    conn.commit()
    print("Migration successful!")
except Exception as e:
    conn.rollback()
    print(f"Migration failed: {e}")
