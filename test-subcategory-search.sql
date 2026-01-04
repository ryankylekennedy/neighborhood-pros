-- Test query to verify subcategory search will work
-- Run this in Supabase SQL Editor to check your data

-- 1. Check if you have subcategories
SELECT 'Subcategories' as table_name, COUNT(*) as count FROM subcategories;

-- 2. List all subcategory names (to see what you can search for)
SELECT id, name, category_id
FROM subcategories
ORDER BY name;

-- 3. Check if the handyman subcategory has services
SELECT
  sc.name as subcategory_name,
  COUNT(s.id) as service_count
FROM subcategories sc
LEFT JOIN services s ON s.subcategory_id = sc.id
WHERE sc.id = '81141234-3385-4c15-8ceb-1eaa9e9b8644'
GROUP BY sc.id, sc.name;

-- 4. Check if any businesses are linked to handyman services
SELECT
  b.id as business_id,
  b.name as business_name,
  s.name as service_name,
  sc.name as subcategory_name
FROM businesses b
JOIN business_services bs ON bs.business_id = b.id
JOIN services s ON s.id = bs.service_id
JOIN subcategories sc ON sc.id = s.subcategory_id
WHERE sc.id = '81141234-3385-4c15-8ceb-1eaa9e9b8644'
LIMIT 10;

-- 5. Test the exact query the app uses (searching for "handyman")
SELECT id, name
FROM subcategories
WHERE name ILIKE '%handyman%';

-- 6. Full chain test - simulate searching for "handyman"
WITH matching_subcategories AS (
  SELECT id, name
  FROM subcategories
  WHERE name ILIKE '%handyman%'
),
matching_services AS (
  SELECT s.id, s.name, s.subcategory_id
  FROM services s
  WHERE s.subcategory_id IN (SELECT id FROM matching_subcategories)
),
matching_businesses AS (
  SELECT DISTINCT b.id, b.name, b.status
  FROM businesses b
  JOIN business_services bs ON bs.business_id = b.id
  WHERE bs.service_id IN (SELECT id FROM matching_services)
    AND b.status = 'approved'
)
SELECT * FROM matching_businesses;
