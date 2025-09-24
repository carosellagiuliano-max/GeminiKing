insert into public.locations (id, name, canton, street, postal_code, city)
values
  ('11111111-1111-4111-8111-111111111111', 'Salon Excellence Zürich', 'ZH', 'Limmatquai 12', '8001', 'Zürich')
on conflict (id) do nothing;

insert into public.services (id, slug, name, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, price_chf, cms_status, is_active)
values
  ('22222222-2222-4222-8222-222222222222', 'signature-cut', 'Signature Cut & Finish', 'Massgeschneiderter Haarschnitt mit Pflege und Styling', 75, 10, 5, 19500, 'published', true),
  ('33333333-3333-4333-8333-333333333333', 'colour-lux', 'Colour Luxe Ritual', 'Individuelle Coloration inkl. Pflege und Glossing', 120, 15, 15, 28500, 'published', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  buffer_before_minutes = excluded.buffer_before_minutes,
  buffer_after_minutes = excluded.buffer_after_minutes,
  price_chf = excluded.price_chf,
  cms_status = excluded.cms_status,
  is_active = excluded.is_active;

insert into public.resources (id, location_id, name, capacity)
values
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Color Bar', 2),
  ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', 'Wash Lounge', 3)
on conflict (id) do update set
  name = excluded.name,
  capacity = excluded.capacity;

insert into public.service_resources (service_id, resource_id, quantity)
values
  ('22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-555555555555', 1),
  ('33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444', 1)
on conflict (service_id, resource_id) do update set
  quantity = excluded.quantity;

-- Admin profile & staff seed rely on Supabase auth user existing with matching id.
insert into public.profiles (id, role, full_name, phone, locale, marketing_opt_in)
values
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'ADMIN', 'Salon Excellence Admin', '+41441234567', 'de-CH', true)
on conflict (id) do update set
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  locale = excluded.locale,
  marketing_opt_in = excluded.marketing_opt_in;

insert into public.profiles (id, role, full_name, phone, locale, marketing_opt_in)
values
  ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 'STAFF', 'Elena Keller', '+41791234567', 'de-CH', false)
on conflict (id) do update set
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  locale = excluded.locale,
  marketing_opt_in = excluded.marketing_opt_in;

insert into public.staff (id, location_id, display_name, bio, avatar_url, calendar_color)
values
  ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'Elena Keller', 'Spezialisiert auf individuelle Schnitte & Colorationen.', null, '#7c3aed')
on conflict (id) do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  calendar_color = excluded.calendar_color;

insert into public.staff_services (staff_id, service_id, duration_minutes, buffer_before_minutes, buffer_after_minutes, price_chf)
values
  ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 75, 10, 5, 19500),
  ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 120, 15, 15, 28500)
on conflict (staff_id, service_id) do update set
  duration_minutes = excluded.duration_minutes,
  buffer_before_minutes = excluded.buffer_before_minutes,
  buffer_after_minutes = excluded.buffer_after_minutes,
  price_chf = excluded.price_chf;

insert into public.profiles (id, role, full_name, phone, locale, marketing_opt_in)
values
  ('cccccccc-cccc-4ccc-cccc-cccccccccccc', 'CUSTOMER', 'Mara Frei', '+41781231212', 'de-CH', true)
on conflict (id) do update set
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  locale = excluded.locale,
  marketing_opt_in = excluded.marketing_opt_in;

insert into public.customers (id, profile_id, email, phone, preferred_name, marketing_opt_in)
values
  ('dddddddd-dddd-4ddd-dddd-dddddddddddd', 'cccccccc-cccc-4ccc-cccc-cccccccccccc', 'mara@example.com', '+41781231212', 'Mara', true)
on conflict (id) do update set
  profile_id = excluded.profile_id,
  email = excluded.email,
  phone = excluded.phone,
  preferred_name = excluded.preferred_name,
  marketing_opt_in = excluded.marketing_opt_in;

insert into public.availability_blocks (id, staff_id, location_id, weekday, start_time, end_time)
values
  ('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 1, '09:00', '13:00'),
  ('d2d2d2d2-d2d2-4d2d-8d2d-d2d2d2d2d2d2', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 1, '14:00', '18:00'),
  ('e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e3e3', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 3, '09:00', '18:00'),
  ('f4f4f4f4-f4f4-4f4f-8f4f-f4f4f4f4f4f4', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 5, '08:00', '12:00')
on conflict (id) do update set
  weekday = excluded.weekday,
  start_time = excluded.start_time,
  end_time = excluded.end_time;

insert into public.cms_blocks (id, slug, title, summary, body, status, published_at)
values
  ('99999999-9999-4999-8999-999999999999', 'hero', 'Salon Excellence', 'Premium Beauty Atelier in Zürich', jsonb_build_object('type', 'richtext', 'content', 'Herzlich willkommen bei Salon Excellence!'), 'published', now())
on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  status = excluded.status,
  published_at = excluded.published_at;
