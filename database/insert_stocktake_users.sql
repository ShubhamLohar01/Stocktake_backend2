-- Insert users into stocktake_users table
-- Note: Passwords are stored as plain text matching username (should be hashed in production)

INSERT INTO stocktake_users (username, password, warehouse, role, is_active) VALUES
('shabanaansari', 'shabanaansari', 'W202', 'floorhead', TRUE),
('arbaazshaikh', 'arbaazshaikh', 'W202', 'floorhead', TRUE),
('sohamjamugde', 'sohamjamugde', 'W202', 'floorhead', TRUE),
('shakirashaikh', 'shakirashaikh', 'W202', 'floorhead', TRUE),
('vidyakasbe', 'vidyakasbe', 'W202', 'floorhead', TRUE),
('abhishekrane', 'abhishekrane', 'W202', 'floorhead', TRUE),
('roshansapkal', 'roshansapkal', 'W202', 'floorhead', TRUE),
('madhurishewale', 'madhurishewale', 'W202', 'floorhead', TRUE),
('santoshsalunkhe', 'santoshsalunkhe', 'W202', 'floorhead', TRUE),
('pawanjamble', 'pawanjamble', 'W202', 'floorhead', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Note: arbaazshaikh was listed twice in the original list, included once above
-- If you need to add a duplicate with different details, modify the username or use UPDATE

-- Verify the inserted data
SELECT id, username, warehouse, role, is_active, created_at 
FROM stocktake_users 
WHERE warehouse = 'W202' AND role = 'floorhead'
ORDER BY username;
