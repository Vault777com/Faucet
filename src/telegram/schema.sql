CREATE TABLE IF NOT EXISTS drips (
  id                SERIAL         PRIMARY KEY,
  chainid           INTEGER,
  transaction_hash  TEXT,
  token_address     TEXT,
  from_address      TEXT,
  to_address        TEXT,
  telegram_username TEXT,
  value_parsed      NUMERIC(32, 16),
  created_at        timestamptz default(now())
);