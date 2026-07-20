ALTER TABLE contributions
ADD COLUMN prompt_topic TEXT
CHECK (
  prompt_topic IS NULL OR prompt_topic IN (
    'daily_life',
    'expressions',
    'memories',
    'nature',
    'traditions'
  )
);
