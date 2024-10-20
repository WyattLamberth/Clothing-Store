use online_store

-- Insert role data
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Customer'),
(2, 'Employee'),
(3, 'Admin');

-- Admin Role Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1001),
(1, 1002),
(1, 1003),
(1, 1004),
(1, 1005),
(1, 1006),
(1, 1007),
(1, 1008),
(1, 1009),
(1, 1010),
-- Employee Role Permissions
(2, 2001),
(2, 2002),
(2, 2003),
(2, 2004),
(2, 2005),
(2, 2006),
(2, 2007),
-- Customer Role Permissions
(3, 3001),
(3, 3002),
(3, 3003),
(3, 3004),
(3, 3005),
(3, 3006),
(3, 3007);


-- Populate permissions table with Admin, Employee, and Customer permissions
INSERT INTO permissions (permission_id, permission_name) VALUES
-- Admin Permissions (start with 1)
(1001, 'Manage Users'),
(1002, 'Manage Products'),
(1003, 'Manage Orders'),
(1004, 'Configure System Settings'),
(1005, 'Manage Promotions and Discounts'),
(1006, 'Manage Payment and Shipping Settings'),
(1007, 'Review and Publish Content'),
(1008, 'Manage Inventory'),
(1009, 'View Customer Feedback and Reviews'),
(1010, 'Create/Edit/Delete Page Content'),
-- Employee Permissions (start with 2)
(2001, 'Add/Edit/Delete Products'),
(2002, 'View and Manage all Orders'),
(2003, 'Manage Inventory'),
(2004, 'Set Product Prices and Promotions'),
(2005, 'Respond to Customer Reviews'),
(2006, 'Process Refunds and Returns'),
(2007, 'View Customer Reviews and Feedback'),
-- Customer Permissions (start with 3)
(3001, 'Browse and Search Products'),
(3002, 'Add Products to Cart'),
(3003, 'Make Purchase and Place Orders'),
(3004, 'View and Manage Personal Account'),
(3005, 'View Order History'),
(3006, 'Submit Product Reviews and Feedback'),
(3007, 'Manage Shipping Addresses and Payment Information');

SELECT * from roles;

select * from role_permissions;

select * from permissions;