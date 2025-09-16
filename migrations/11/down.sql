
-- Remove consultation records table
DROP TABLE consultation_records;

-- Remove patient surgeries table
DROP TABLE patient_surgeries;

-- Remove patient packages table
DROP TABLE patient_packages;

-- Remove patient custom fields
ALTER TABLE patients DROP COLUMN discount_percentage;
ALTER TABLE patients DROP COLUMN partnership_tag;
ALTER TABLE patients DROP COLUMN custom_session_price;

-- Remove clinic default price
ALTER TABLE clinics DROP COLUMN default_session_price;

-- Remove appointment payment fields
ALTER TABLE appointments DROP COLUMN price_charged;
ALTER TABLE appointments DROP COLUMN payment_status;
