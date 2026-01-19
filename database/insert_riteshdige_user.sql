-- Insert user: riteshdige into stocktake_users table

INSERT INTO stocktake_users (username, password, warehouse, role, is_active) 
VALUES ('satishingole', 'satishingole', 'A185', 'floorhead', TRUE),('sumitbaikar', 'sumitbaikar', 'A185', 'floorhead', TRUE),
('surajbhilare', 'surajbhilare', 'A185', 'floorhead', TRUE),('shubhammhatre', 'shubhammhatre', 'A185', 'floorhead', TRUE)

ON CONFLICT (username) DO NOTHING;

-- Verify the inserted users
SELECT id, username, warehouse, role, is_active, created_at 
FROM stocktake_users 
WHERE username IN ('satishingole', 'sumitbaikar', 'surajbhilare', 'shubhammhatre')
ORDER BY username;
