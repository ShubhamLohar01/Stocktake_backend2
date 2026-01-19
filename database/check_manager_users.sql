-- Query to check manager users in stocktake_users table
-- Run this query in your PostgreSQL database to see all users with role 'manager'

SELECT 
    id,
    username,
    password,
    warehouse,
    role,
    name,
    email,
    is_active,
    created_at
FROM stocktake_users
WHERE role = 'manager' OR role = 'MANAGER' OR LOWER(role) = 'manager'
ORDER BY username;
