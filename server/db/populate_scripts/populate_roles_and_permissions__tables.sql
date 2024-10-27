USE online_store;

-- Insert role data
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Customer'),
(2, 'Employee'),
(3, 'Admin');

-- Admin Role Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 1001),
(3, 1002),
(3, 1003),
(3, 1004),
(3, 1005),
(3, 1006),
(3, 1007),
(3, 1008),
(3, 1009),
(3, 1010);

-- Employee Role Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 2001),
(2, 2002),
(2, 2003),
(2, 2004),
(2, 2005),
(2, 2006),
(2, 2007);

-- Customer Role Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 3001),
(1, 3002),
(1, 3003),
(1, 3004),
(1, 3005),
(1, 3006),
(1, 3007);

-- Populate permissions table with Admin permissions
INSERT INTO permissions (permission_id, permission_name) VALUES
(3001, 'Manage Users'),
(3002, 'Manage Products'),
(3003, 'Manage Orders'),
(3004, 'Configure System Settings'),
(3005, 'Manage Promotions and Discounts'),
(3006, 'Manage Payment and Shipping Settings'),
(3007, 'Review and Publish Content'),
(3008, 'Manage Inventory'),
(3009, 'View Customer Feedback and Reviews'),
(3010, 'Create/Edit/Delete Page Content');

-- Populate permissions table with Employee permissions
INSERT INTO permissions (permission_id, permission_name) VALUES
(2001, 'Add/Edit/Delete Products'),
(2002, 'View and Manage all Orders'),
(2003, 'Manage Inventory'),
(2004, 'Set Product Prices and Promotions'),
(2005, 'Respond to Customer Reviews'),
(2006, 'Process Refunds and Returns'),
(2007, 'View Customer Reviews and Feedback');

-- Populate permissions table with Customer permissions
INSERT INTO permissions (permission_id, permission_name) VALUES
(1001, 'Browse and Search Products'),
(1002, 'Add Products to Cart'),
(1003, 'Make Purchase and Place Orders'),
(1004, 'View and Manage Personal Account'),
(1005, 'View Order History'),
(1006, 'Submit Product Reviews and Feedback'),
(1007, 'Manage Shipping Addresses and Payment Information');

-- Select all roles
SELECT * FROM roles;

-- Select all role permissions
SELECT * FROM role_permissions;

-- Select all permissions
SELECT * FROM permissions;
