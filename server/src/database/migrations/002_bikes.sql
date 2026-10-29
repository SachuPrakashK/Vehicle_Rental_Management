CREATE TABLE IF NOT EXISTS bikes (
  id bigserial PRIMARY KEY,
  brand varchar(80) NOT NULL,
  model varchar(80) NOT NULL,
  year integer NOT NULL CHECK (year BETWEEN 1900 AND 2200),
  color varchar(40),
  daily_rate numeric(12,2) NOT NULL CHECK (daily_rate > 0),
  image varchar(2048),
  registration_number varchar(30) NOT NULL,
  available boolean NOT NULL DEFAULT true,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bikes_registration_unique ON bikes (lower(registration_number));
CREATE INDEX IF NOT EXISTS bikes_status_available_idx ON bikes (status, available);
