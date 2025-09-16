
-- Remove sample data
DELETE FROM patients WHERE cpf IN (
  '123.456.789-01',
  '987.654.321-09', 
  '456.789.123-45',
  '789.123.456-78',
  '321.654.987-12'
);
