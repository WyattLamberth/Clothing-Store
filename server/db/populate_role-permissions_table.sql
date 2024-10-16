-- Populate role_permissions table to link roles with permissions
-- Admin Role Permissions
INSERT INTO role_permissions (role, permission_id) VALUES
('Admin', 1001),
('Admin', 1002),
('Admin', 1003),
('Admin', 1004),
('Admin', 1005),
('Admin', 1006),
('Admin', 1007),
('Admin', 1008),
('Admin', 1009),
('Admin', 1010),

-- Employee Role Permissions
('Employee', 2001),
('Employee', 2002),
('Employee', 2003),
('Employee', 2004),
('Employee', 2005),
('Employee', 2006),
('Employee', 2007),

-- Customer Role Permissions
('Customer', 3001),
('Customer', 3002),
('Customer', 3003),
('Customer', 3004),
('Customer', 3005),
('Customer', 3006),
('Customer', 3007);
