import psycopg2
from config import settings

sql = """
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    headcount INT NOT NULL,
    budget TEXT,
    jd_text TEXT,
    candidate_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute(sql)
conn.commit()
print("Positions table created!")
