-- =====================================================================================
-- Brand name: Poveon (run AFTER the earlier scripts). Safe to run more than once.
-- Replaces the old name "HealthCheck" in consult type text people see when booking.
-- =====================================================================================

update public.consult_types
   set name = replace(name, 'HealthCheck', 'Poveon'),
       description = replace(description, 'Your HealthCheck,', 'Your Poveon check,')
 where name like '%HealthCheck%' or description like '%HealthCheck%';

update public.consult_types
   set description = replace(description, 'HealthCheck', 'Poveon')
 where description like '%HealthCheck%';
