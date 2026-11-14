-- New entry type: medical appointments (colonoscopy, emergency room, blood
-- tests…). Documents can point at one through data->>'appointmentId'.

alter table public.entries drop constraint if exists entries_type_check;
alter table public.entries add constraint entries_type_check
  check (type in ('water','meal','symptom','bowel','gas','medication','document','appointment'));

-- Looking up the documents linked to an appointment.
create index if not exists entries_appointment_idx
  on public.entries ((data->>'appointmentId'))
  where type = 'document';
