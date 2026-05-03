
-- The ALL policy already covers DELETE for patients, but let's ensure it's explicit
-- No additional migration needed since the "Patients can manage own goal checks" policy uses FOR ALL
SELECT 1;
