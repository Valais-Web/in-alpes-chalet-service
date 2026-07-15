-- In-Alpes Chalet Services — Neon (Postgres) schema.
-- Source of truth, written only by Netlify Functions / admin (CLAUDE.md §3).
-- Region: EU / Frankfurt (nLPD/RGPD, CLAUDE.md §2, §11).
--
-- Deviations from CLAUDE.md §4, applied deliberately:
--   * `availability` stores date RANGES (start/end), not one row per date —
--     this is what the frontend and published JSON already consume.
--   * `apartments` adds price_per_night + lat/lng/address, required by the UI.

-- Needed for the availability exclusion constraint (GiST index over the text
-- apartment_id + daterange).
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS apartments (
  id                 text PRIMARY KEY,
  slug               text UNIQUE NOT NULL,
  sort_order         integer NOT NULL DEFAULT 0,

  name_fr            text NOT NULL,
  name_en            text NOT NULL DEFAULT '',
  name_nl            text NOT NULL DEFAULT '',

  short_desc_fr      text NOT NULL DEFAULT '',
  short_desc_en      text NOT NULL DEFAULT '',
  short_desc_nl      text NOT NULL DEFAULT '',

  long_desc_fr       text NOT NULL DEFAULT '',
  long_desc_en       text NOT NULL DEFAULT '',
  long_desc_nl       text NOT NULL DEFAULT '',

  guests             integer NOT NULL DEFAULT 1,
  bedrooms           integer NOT NULL DEFAULT 0,
  bathrooms          integer NOT NULL DEFAULT 0,
  size_m2            integer NOT NULL DEFAULT 0,
  floor              text NOT NULL DEFAULT '',

  amenities          jsonb NOT NULL DEFAULT '[]'::jsonb,

  rules_fr           text NOT NULL DEFAULT '',
  rules_en           text NOT NULL DEFAULT '',
  rules_nl           text NOT NULL DEFAULT '',

  check_in           text NOT NULL DEFAULT '16:00',
  check_out          text NOT NULL DEFAULT '10:00',

  price_per_night    integer NOT NULL DEFAULT 0,       -- CHF
  lat                double precision NOT NULL DEFAULT 0,
  lng                double precision NOT NULL DEFAULT 0,
  address            text NOT NULL DEFAULT '',

  cover_image_url    text,                              -- Cloudinary URL
  gallery_image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT apartments_lat_bounds   CHECK (lat BETWEEN -90 AND 90),
  CONSTRAINT apartments_lng_bounds   CHECK (lng BETWEEN -180 AND 180),
  CONSTRAINT apartments_guests_pos   CHECK (guests >= 1),
  CONSTRAINT apartments_price_nonneg CHECK (price_per_night >= 0)
);

CREATE TABLE IF NOT EXISTS availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  text NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  start_date    date NOT NULL,
  end_date      date NOT NULL,                          -- inclusive (occupied nights)
  status        text NOT NULL CHECK (status IN ('free','booked','prebooked','blocked')),
  expires_at    timestamptz,                            -- non-null only for 'prebooked'
  -- Which booking request owns this row (the hold it laid, and the booked range
  -- it becomes once confirmed). NULL for owner-set manual blocks. Lets an owner
  -- decision act on exactly its own range, never another guest's overlapping
  -- soft hold (CLAUDE.md §5). The FK is added after booking_requests exists
  -- (below) since that table is declared later in this file.
  booking_request_id text,
  CHECK (end_date >= start_date),
  CONSTRAINT availability_prebooked_expiry CHECK (status <> 'prebooked' OR expires_at IS NOT NULL),
  -- No two CONFIRMED-unavailable ranges (booked/blocked) for the same apartment
  -- may overlap: the source of truth preventing double-bookings under
  -- concurrency, enforced when the owner confirms a request. Soft 'prebooked'
  -- holds are intentionally excluded (CLAUDE.md §5: a pending hold does not
  -- block, guests may still request the same dates). Inclusive daterange '[]'
  -- means a range ending on day D and one starting on D+1 do NOT overlap, so
  -- same-day turnover is allowed (a stay occupies [arrival, departure-1]).
  CONSTRAINT availability_no_overlap EXCLUDE USING gist (
    apartment_id WITH =,
    (daterange(start_date, end_date, '[]')) WITH &&
  ) WHERE (status IN ('booked','blocked'))
);
CREATE INDEX IF NOT EXISTS availability_apartment_idx ON availability (apartment_id, start_date);

CREATE TABLE IF NOT EXISTS booking_requests (
  id            text PRIMARY KEY,
  -- RESTRICT, not CASCADE: booking requests are business/PII records and must
  -- not be silently erased when an apartment is deleted. The admin must archive
  -- the apartment (or handle its bookings) instead of hard-deleting it.
  apartment_id  text NOT NULL REFERENCES apartments(id) ON DELETE RESTRICT,
  guest_name    text NOT NULL,
  email         text NOT NULL,
  phone         text,
  arrival       date NOT NULL,
  departure     date NOT NULL,
  guests        integer NOT NULL DEFAULT 1,
  message       text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','declined','archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_departure_after_arrival CHECK (departure > arrival),
  CONSTRAINT booking_guests_pos CHECK (guests >= 1)
);
CREATE INDEX IF NOT EXISTS booking_requests_status_idx ON booking_requests (status, created_at DESC);

-- Hold/booked ownership FK (declared here because availability precedes
-- booking_requests above). CASCADE: purging a request removes its rows.
ALTER TABLE availability
  DROP CONSTRAINT IF EXISTS availability_booking_request_fk;
ALTER TABLE availability
  ADD CONSTRAINT availability_booking_request_fk
  FOREIGN KEY (booking_request_id) REFERENCES booking_requests(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS availability_booking_request_idx
  ON availability (booking_request_id) WHERE booking_request_id IS NOT NULL;

-- No accounts table: admin auth is a single shared password (ADMIN_PASSWORD)
-- issued as an HMAC-signed session cookie (SESSION_SECRET). See netlify/lib/auth.ts
-- and CLAUDE.md §2. (Supersedes the earlier Neon Auth plan.)
