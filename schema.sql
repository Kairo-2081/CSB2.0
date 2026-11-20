-- Central student registry for the Bangladesh public-university network.
-- Student rows are stored in one PostgreSQL partition per university.

CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_name TEXT,
  division TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT universities_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS universities_name_lower_idx
  ON public.universities (lower(name));

CREATE TABLE IF NOT EXISTS public.user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_accounts_email_not_blank CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_email_lower_idx
  ON public.user_accounts (lower(email));

CREATE TABLE IF NOT EXISTS public.students (
  university_id UUID NOT NULL REFERENCES public.universities(id),
  account_id UUID NOT NULL REFERENCES public.user_accounts(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  home_district TEXT NOT NULL,
  current_residence TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (university_id, account_id),
  CONSTRAINT students_name_not_blank CHECK (length(trim(full_name)) > 0),
  CONSTRAINT students_phone_not_blank CHECK (length(trim(phone)) > 0),
  CONSTRAINT students_home_district_not_blank CHECK (length(trim(home_district)) > 0),
  CONSTRAINT students_current_residence_not_blank CHECK (length(trim(current_residence)) > 0)
) PARTITION BY LIST (university_id);

CREATE OR REPLACE FUNCTION public.create_university_student_partition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  partition_name TEXT := 'students_' || replace(NEW.id::TEXT, '-', '');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.students FOR VALUES IN (%L)',
    partition_name,
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS universities_create_student_partition ON public.universities;
CREATE TRIGGER universities_create_student_partition
AFTER INSERT ON public.universities
FOR EACH ROW
EXECUTE FUNCTION public.create_university_student_partition();

CREATE OR REPLACE FUNCTION public.register_university(
  p_name TEXT,
  p_slug TEXT,
  p_short_name TEXT,
  p_division TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  registered_university_id UUID;
BEGIN
  IF length(trim(coalesce(p_name, ''))) = 0
    OR coalesce(p_slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'A university name and lowercase slug are required';
  END IF;

  SELECT id INTO registered_university_id
  FROM public.universities
  WHERE lower(name) = lower(trim(p_name));

  IF registered_university_id IS NOT NULL THEN
    RETURN registered_university_id;
  END IF;

  INSERT INTO public.universities (name, slug, short_name, division)
  VALUES (trim(p_name), p_slug, nullif(trim(p_short_name), ''), nullif(trim(p_division), ''))
  RETURNING id INTO registered_university_id;

  RETURN registered_university_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_student(
  p_full_name TEXT,
  p_email TEXT,
  p_password_hash TEXT,
  p_university_id UUID,
  p_phone TEXT,
  p_department TEXT,
  p_home_district TEXT,
  p_current_residence TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  created_account_id UUID;
BEGIN
  IF length(trim(coalesce(p_full_name, ''))) = 0
    OR length(trim(coalesce(p_email, ''))) = 0
    OR length(trim(coalesce(p_password_hash, ''))) = 0
    OR length(trim(coalesce(p_phone, ''))) = 0
    OR length(trim(coalesce(p_department, ''))) = 0
    OR length(trim(coalesce(p_home_district, ''))) = 0
    OR length(trim(coalesce(p_current_residence, ''))) = 0 THEN
    RAISE EXCEPTION 'All student registration fields are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.universities
    WHERE id = p_university_id AND is_active
  ) THEN
    RAISE EXCEPTION 'University is not active or does not exist';
  END IF;

  INSERT INTO public.user_accounts (email, password_hash)
  VALUES (lower(trim(p_email)), p_password_hash)
  RETURNING id INTO created_account_id;

  INSERT INTO public.students (
    university_id,
    account_id,
    full_name,
    phone,
    department,
    home_district,
    current_residence
  )
  VALUES (
    p_university_id,
    created_account_id,
    trim(p_full_name),
    trim(p_phone),
    trim(p_department),
    trim(p_home_district),
    trim(p_current_residence)
  );

  RETURN created_account_id;
END;
$$;

CREATE OR REPLACE VIEW public.admin_university_metrics AS
SELECT
  universities.id AS university_id,
  universities.name AS university_name,
  universities.short_name,
  universities.division,
  COUNT(students.account_id)::BIGINT AS student_count,
  COUNT(students.account_id) FILTER (
    WHERE students.created_at >= date_trunc('month', NOW())
  )::BIGINT AS students_this_month
FROM public.universities
LEFT JOIN public.students
  ON students.university_id = universities.id
WHERE universities.is_active
GROUP BY universities.id, universities.name, universities.short_name, universities.division;

INSERT INTO public.universities (name, slug, short_name, division)
VALUES
  ('Bangladesh University of Engineering and Technology', 'buet', 'BUET', 'Dhaka'),
  ('Rajshahi University of Engineering and Technology', 'ruet', 'RUET', 'Rajshahi'),
  ('University of Dhaka', 'du', 'DU', 'Dhaka'),
  ('University of Rajshahi', 'ru', 'RU', 'Rajshahi'),
  ('University of Chittagong', 'cu', 'CU', 'Chattogram'),
  ('Jahangirnagar University', 'ju', 'JU', 'Dhaka'),
  ('Khulna University', 'ku', 'KU', 'Khulna'),
  ('Shahjalal University of Science and Technology', 'sust', 'SUST', 'Sylhet'),
  ('Chittagong University of Engineering and Technology', 'cuet', 'CUET', 'Chattogram'),
  ('Khulna University of Engineering and Technology', 'kuet', 'KUET', 'Khulna'),
  ('Dhaka University of Engineering and Technology', 'duet', 'DUET', 'Dhaka'),
  ('Bangladesh Agricultural University', 'bau', 'BAU', 'Mymensingh')
ON CONFLICT (slug) DO NOTHING;
