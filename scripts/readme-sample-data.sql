-- Sample data for README captures and local demos. NEVER run this against
-- production: it invents 150 students and about 750 posts.

-- Every sample account has an @demo.invalid email,
-- which no real person can register with, so one statement removes the lot:
--   DELETE FROM users WHERE email LIKE '%@demo.invalid';
-- Their posts, listings, requests and reports go with them (ON DELETE CASCADE).
-- Phone numbers start 010, which no Bangladeshi operator uses.
DO $seed$
DECLARE
  first_m text[] := ARRAY['Tanvir','Rafi','Sakib','Nafis','Arif','Imran','Fahim','Shihab','Rakib','Mahir','Zarif','Ashik','Nabil','Ayon','Siam','Tahmid','Rifat','Mehedi','Abrar','Farhan','Saad','Raihan','Sabbir','Junaid','Ishraq'];
  first_f text[] := ARRAY['Nusrat','Tasnim','Anika','Raisa','Lamia','Fariha','Sadia','Mithila','Jarin','Nabila','Samiha','Tahsin','Afrin','Prova','Maliha','Ishrat','Rumana','Tanzila','Orin','Sumaiya'];
  last_n  text[] := ARRAY['Rahman','Hossain','Islam','Ahmed','Chowdhury','Karim','Haque','Alam','Sarker','Talukder','Mahmud','Uddin','Siddique','Kabir','Akter','Bhuiyan','Mollah','Hasan','Roy','Das','Saha','Majumder'];
  depts   text[] := ARRAY['Computer Science and Engineering','Electrical and Electronic Engineering','Civil Engineering','Mechanical Engineering','Architecture','Chemical Engineering','Industrial and Production Engineering','Materials and Metallurgical Engineering','Urban and Regional Planning','Water Resources Engineering','Naval Architecture and Marine Engineering','Biomedical Engineering','Physics','Mathematics'];
  halls   text[] := ARRAY['Ahsanullah Hall','Titumir Hall','Sher-e-Bangla Hall','Suhrawardy Hall','Kazi Nazrul Islam Hall','Rashid Hall','Dr. M. A. Rashid Hall','Shahid Smrity Hall','Sabekun Nahar Sony Hall','Bangabandhu Hall','Off campus, Lalbagh','Off campus, Azimpur','Off campus, Dhanmondi'];
  dists   text[] := ARRAY['Dhaka','Chattogram','Rajshahi','Khulna','Sylhet','Barishal','Rangpur','Mymensingh','Cumilla','Bogura','Jashore','Narayanganj','Gazipur','Noakhali','Faridpur','Dinajpur'];
  places  text[] := ARRAY['Central Library','ECE building','Old Academic Building','Cafeteria','Shahid Minar','Auditorium','Palashi gate','Civil building','EME building','Playground','Ahsanullah Hall gate','Bakshibazar gate'];

  u record;
  n int := 150;
  i int;
  who text;
  wname text;
  t timestamptz;
  pick int;
BEGIN
  PERFORM setseed(0.4242);

  -- A time after p_lo, weighted toward evenings and away from Friday.
  CREATE OR REPLACE FUNCTION pg_temp.demo_ts(p_lo timestamptz) RETURNS timestamptz LANGUAGE plpgsql VOLATILE AS $f$
  DECLARE t timestamptz; tries int := 0;
  BEGIN
    -- Less than two days to play with: any moment in that window will do.
    IF now() - p_lo < interval '2 days' THEN
      RETURN p_lo + random() * (now() - p_lo);
    END IF;
    LOOP
      tries := tries + 1;
      IF tries > 50 THEN
        RETURN p_lo + random() * (now() - p_lo);
      END IF;
      t := p_lo + random() * (now() - p_lo);
      t := date_trunc('day', t AT TIME ZONE 'Asia/Dhaka') + make_interval(hours => 8 + floor(random() * 15)::int, mins => floor(random() * 60)::int);
      t := t AT TIME ZONE 'Asia/Dhaka';
      EXIT WHEN t < now() AND t > p_lo
        AND (extract(dow FROM t AT TIME ZONE 'Asia/Dhaka') <> 5 OR random() < 0.45)
        AND (extract(dow FROM t AT TIME ZONE 'Asia/Dhaka') <> 4 OR random() < 1.0)
        AND (extract(month FROM t AT TIME ZONE 'Asia/Dhaka') NOT IN (5, 11) OR random() < 0.7);
    END LOOP;
    RETURN t;
  END $f$;

  CREATE OR REPLACE FUNCTION pg_temp.pick(a text[]) RETURNS text LANGUAGE sql VOLATILE AS
    $f$ SELECT a[1 + floor(random() * array_length(a, 1))::int] $f$;

  CREATE OR REPLACE FUNCTION pg_temp.phone() RETURNS text LANGUAGE sql VOLATILE AS
    $f$ SELECT '010' || lpad(floor(random() * 100000000)::text, 8, '0') $f$;

  -- ---- Students -------------------------------------------------------------
  FOR i IN 1..n LOOP
    IF random() < 0.62 THEN wname := pg_temp.pick(first_m); ELSE wname := pg_temp.pick(first_f); END IF;
    wname := wname || ' ' || pg_temp.pick(last_n);
    -- Joined some time in the last year, more of them recently.
    t := now() - (power(random(), 1.5) * interval '360 days');
    INSERT INTO users (name, email, password_hash, role, phone, department, university_id, home_district,
                       current_residence, show_contact, email_verified_at, privacy_accepted_at, created_at, updated_at)
    VALUES (wname,
            lower(replace(wname, ' ', '.')) || '.' || i || '@demo.invalid',
            crypt(gen_random_uuid()::text, gen_salt('bf', 4)),   -- nobody knows this password
            'student', pg_temp.phone(), pg_temp.pick(depts), 'buet', pg_temp.pick(dists),
            pg_temp.pick(halls), false, t, t, t, t);
  END LOOP;

  CREATE TEMP TABLE demo_users ON COMMIT DROP AS
    SELECT id, name, created_at FROM users WHERE email LIKE '%@demo.invalid';

  -- ---- Marketplace ----------------------------------------------------------
  FOR i IN 1..190 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    pick := floor(random() * 14)::int;
    INSERT INTO marketplace (title, description, price, category, is_sold, seller, phone, user_id, university_id, created_at, updated_at)
    VALUES (
      (ARRAY['Casio fx-991EX calculator','Engineering drawing set','Used bicycle, 26 inch','Study table lamp','Rice cooker 1.8L','Arduino Uno starter kit','Second-hand laptop stand','Hall mattress, single','Electric kettle','Mini fridge (hall approved)','Tekla textbook, Strength of Materials','Raspberry Pi 4 (4GB)','Mechanical keyboard','Drafter with stand'])[pick + 1],
      (ARRAY['Used one term, works perfectly.','Selling because I am graduating.','Barely used. Pick up from my hall.','Good condition, small scratch on the side.','Comes with the original box.'])[1 + floor(random() * 5)::int],
      round((ARRAY[1450, 900, 4200, 650, 1800, 2300, 700, 1500, 950, 7500, 400, 5200, 2600, 1200])[pick + 1] * (0.8 + random() * 0.4) / 50) * 50,
      (ARRAY['Electronics','Stationery','Vehicles','Furniture','Appliances','Electronics','Furniture','Furniture','Appliances','Appliances','Books','Electronics','Electronics','Stationery'])[pick + 1],
      random() < 0.3, u.name, pg_temp.phone(), u.id, 'buet', t, t);
  END LOOP;

  -- ---- Lost and found -------------------------------------------------------
  FOR i IN 1..130 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    who := CASE WHEN random() < 0.55 THEN 'lost' ELSE 'found' END;
    INSERT INTO lost_found (title, description, item_type, status, location, contact_number, posted_by, user_id, university_id, created_at, updated_at)
    VALUES (
      initcap(who) || ': ' || pg_temp.pick(ARRAY['black wallet','student ID card','blue umbrella','AirPods case','Casio calculator','hall room key','water bottle','spectacles in a brown case','pen drive (32GB)','notebook with CSE 201 notes','silver bracelet','backpack, grey']),
      CASE WHEN who = 'lost' THEN 'Lost it around ' ELSE 'Found it near ' END || pg_temp.pick(places) || '. Please message me if it is yours.',
      who, who, pg_temp.pick(places), pg_temp.phone(), u.name, u.id, 'buet', t, t);
  END LOOP;

  -- ---- Notices (posted by students in the demo; admins post the real ones) ---
  FOR i IN 1..85 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    INSERT INTO notices (title, description, category, posted_by, user_id, university_id, created_at, updated_at)
    VALUES (
      pg_temp.pick(ARRAY['Central Library open till 10pm during term finals','Inter-hall football tournament registration','BUET CSE Fest volunteer call','Blood donation camp at the Auditorium','Class test schedule revised for Level 2','Robotics club workshop this Thursday','Debate club auditions','Hall dining fee deadline','Power shutdown in ECE building on Saturday','Career talk: working at a semiconductor fab']),
      'Details are on the department notice board. Contact the organisers for anything else.',
      pg_temp.pick(ARRAY['general','academic','event','urgent']), u.name, u.id, 'buet', t, t);
  END LOOP;

  -- ---- Complaints -----------------------------------------------------------
  FOR i IN 1..95 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    INSERT INTO complaints (title, description, category, posted_by, user_id, status, university_id, created_at, updated_at)
    VALUES (
      pg_temp.pick(ARRAY['Water filter on 3rd floor not working','Wi-Fi drops every evening in the hall','Lab PCs need updating','Dining quality has gone down','Broken fan in room 214','Library AC too cold','No hot water in the washroom','Projector in lecture room 5 is dim','Street light near Palashi gate is out','Course registration portal keeps timing out']),
      'This has been going on for more than a week. Please look into it.',
      pg_temp.pick(ARRAY['hall','dining','lab','academic','administration']),
      CASE WHEN random() < 0.4 THEN 'Anonymous' ELSE u.name END, u.id,
      pg_temp.pick(ARRAY['pending','pending','in_progress','resolved','resolved']), 'buet', t, t);
  END LOOP;

  -- ---- Lend and borrow ------------------------------------------------------
  FOR i IN 1..80 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    pick := floor(random() * 8)::int;
    INSERT INTO lending_items (title, description, category, item_condition, handoff_location, status, owner_id, university_id, created_at, updated_at)
    VALUES (
      (ARRAY['Kreyszig, Advanced Engineering Mathematics','Casio fx-991ES','Cricket bat and ball','Set squares and protractor','Digital multimeter','Badminton racket pair','Sedra and Smith, Microelectronic Circuits','Scientific calculator charger'])[pick + 1],
      'Happy to lend for a week. Please return in the same condition.',
      (ARRAY['Books','Calculators','Sports equipment','Study supplies','Electronics','Sports equipment','Books','Other'])[pick + 1],
      pg_temp.pick(ARRAY['Like new','Good','Fair']), pg_temp.pick(halls),
      CASE WHEN random() < 0.25 THEN 'borrowed' ELSE 'available' END, u.id, 'buet', t, t);
  END LOOP;

  INSERT INTO lending_requests (item_id, requester_id, message, status, created_at, updated_at)
  SELECT i.id, r.id, 'Could I borrow this for a few days?',
         CASE WHEN i.status = 'borrowed' THEN 'approved' ELSE (ARRAY['pending','declined','returned'])[1 + floor(random() * 3)::int] END,
         i.created_at + interval '1 day', i.created_at + interval '1 day'
  FROM lending_items i
  CROSS JOIN LATERAL (SELECT id FROM demo_users d WHERE d.id <> i.owner_id ORDER BY random() LIMIT 1) r
  WHERE i.owner_id IN (SELECT id FROM demo_users) AND random() < 0.6 AND i.created_at + interval '1 day' < now();

  -- ---- Faculty suggestions --------------------------------------------------
  FOR i IN 1..60 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    INSERT INTO faculty_suggestions (title, faculty_name, subject, rating, feedback, posted_by, user_id, university_id, created_at, updated_at)
    VALUES (
      pg_temp.pick(ARRAY['More worked examples in class','Share slides before lectures','Clearer marking for lab reports','Great use of real projects','Pace is too fast in the second half']),
      pg_temp.pick(ARRAY['Course teacher, CSE 205','Course teacher, EEE 263','Course teacher, CE 211','Course teacher, ME 241','Course teacher, MATH 241']),
      pg_temp.pick(ARRAY['Data Structures','Electronic Circuits','Structural Analysis','Thermodynamics','Linear Algebra']),
      1 + floor(random() * 5)::int,
      'Overall the course is useful. A few changes would help a lot of us.',
      CASE WHEN random() < 0.6 THEN 'Anonymous' ELSE u.name END, u.id, 'buet', t, t);
  END LOOP;

  -- ---- Bicycles -------------------------------------------------------------
  FOR i IN 1..45 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    INSERT INTO bicycles (brand, color, location, contact_number, description, status, user_id, university_id, created_at, updated_at)
    VALUES (pg_temp.pick(ARRAY['Phoenix','Duranta','Veloce','Core','Hero']), pg_temp.pick(ARRAY['Black','Red','Blue','Grey','Green']),
            pg_temp.pick(halls), pg_temp.phone(), 'Available for short rides around campus.',
            pg_temp.pick(ARRAY['available','available','rented','maintenance']), u.id, 'buet', t, t);
  END LOOP;

  -- ---- Blood donors (one per student at most) -------------------------------
  INSERT INTO blood_donation (name, blood_type, contact_number, location, available_date, user_id, university_id, created_at, updated_at)
  SELECT d.name, (ARRAY['A+','A+','B+','B+','B+','O+','O+','O+','AB+','A-','B-','O-'])[1 + floor(random() * 12)::int],
         pg_temp.phone(), pg_temp.pick(halls), (now() + random() * interval '60 days')::date, d.id, 'buet', c.t, c.t
  FROM (SELECT * FROM demo_users ORDER BY random() LIMIT 40) d
  CROSS JOIN LATERAL (SELECT pg_temp.demo_ts(d.created_at) AS t) c;

  -- ---- Animal welfare -------------------------------------------------------
  FOR i IN 1..30 LOOP
    SELECT * INTO u FROM demo_users ORDER BY random() LIMIT 1;
    t := pg_temp.demo_ts(u.created_at);
    INSERT INTO animal_welfare (title, description, location, urgency, posted_by, user_id, university_id, created_at, updated_at)
    VALUES (pg_temp.pick(ARRAY['Injured dog near the cafeteria','Kittens need a home','Stray dog needs vaccination','Cat stuck on a hall roof','Feeding schedule for campus dogs']),
            'Can anyone help? I can share photos.', pg_temp.pick(places), pg_temp.pick(ARRAY['low','medium','medium','high']),
            u.name, u.id, 'buet', t, t);
  END LOOP;

  -- ---- Reports: most handled, a few still open ------------------------------
  INSERT INTO reports (board, row_id, reporter_id, university_id, reason, details, status, created_at, resolved_at)
  SELECT p.board, p.id, r.id, 'buet', (ARRAY['spam','false','inappropriate','other'])[1 + floor(random() * 4)::int],
         'Looks like a duplicate post.', CASE WHEN row_number() OVER () <= 4 THEN 'open' ELSE 'dismissed' END,
         p.created_at + interval '3 hours', CASE WHEN row_number() OVER () <= 4 THEN NULL ELSE p.created_at + interval '1 day' END
  FROM (
    (SELECT 'marketplace' AS board, id, user_id, created_at FROM marketplace WHERE user_id IN (SELECT id FROM demo_users) ORDER BY random() LIMIT 14)
    UNION ALL
    (SELECT 'complaints', id, user_id, created_at FROM complaints WHERE user_id IN (SELECT id FROM demo_users) ORDER BY random() LIMIT 8)
  ) p
  CROSS JOIN LATERAL (SELECT id FROM demo_users d WHERE d.id <> p.user_id ORDER BY random() LIMIT 1) r
  WHERE p.created_at + interval '3 hours' < now();
END
$seed$;

SELECT
  (SELECT count(*) FROM users WHERE email LIKE '%@demo.invalid') AS students,
  (SELECT count(*) FROM marketplace) AS marketplace, (SELECT count(*) FROM lost_found) AS lost_found,
  (SELECT count(*) FROM notices) AS notices, (SELECT count(*) FROM complaints) AS complaints,
  (SELECT count(*) FROM lending_items) AS lending, (SELECT count(*) FROM lending_requests) AS requests,
  (SELECT count(*) FROM faculty_suggestions) AS faculty, (SELECT count(*) FROM bicycles) AS bicycles,
  (SELECT count(*) FROM blood_donation) AS blood, (SELECT count(*) FROM animal_welfare) AS animals,
  (SELECT count(*) FROM reports) AS reports;
