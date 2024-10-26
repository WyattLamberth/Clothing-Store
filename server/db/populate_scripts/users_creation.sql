USE online_store;

-- Create an Admin user
INSERT INTO users (username, password, email, role_id)
VALUES ('admin_user', 'admin_password', 'admin@onlinestore.com', 3); -- role_id 3 for Admin

-- Create an Employee user
INSERT INTO users (username, password, email, role_id)
VALUES ('employee_user', 'employee_password', 'employee@onlinestore.com', 2); -- role_id 2 for Employee

-- Create a Customer user
INSERT INTO users (username, password, email, role_id)
VALUES ('customer_user', 'customer_password', 'customer@onlinestore.com', 1); -- role_id 1 for Customer

-- Check inserted users
SELECT * FROM users;
