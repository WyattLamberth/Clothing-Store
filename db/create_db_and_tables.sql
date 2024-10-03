-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS online_store;

-- Use the database
USE online_store;

-- Create ADDRESS table
CREATE TABLE IF NOT EXISTS ADDRESS (
    Address_ID INT PRIMARY KEY AUTO_INCREMENT,
    Line_1 VARCHAR(255) NOT NULL,
    Line_2 VARCHAR(255) DEFAULT 'N/A',
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100) NOT NULL,
    Zip VARCHAR(10) NOT NULL,
    CONSTRAINT chk_state CHECK (State IN ('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY')),
    CONSTRAINT chk_zip CHECK (Zip REGEXP '^[0-9]{5}(-[0-9]{4})?$')
);

-- Create USER TABLE
CREATE TABLE IF NOT EXISTS USER (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    First_Name VARCHAR(50) NOT NULL,
    Last_Name VARCHAR(50) NOT NULL,
    Username VARCHAR(50) UNIQUE,
    Email VARCHAR(255) UNIQUE,
    Phone_Number VARCHAR(20) UNIQUE,
    Password_Hash BINARY(64) NOT NULL,
    Role ENUM('Admin', 'Staff', 'Customer') DEFAULT 'Customer',
    Address_ID INT,
    Manager_User_ID INT NULL,
    CONSTRAINT fk_user_address FOREIGN KEY (Address_ID) REFERENCES ADDRESS(Address_ID),
    CONSTRAINT fk_user_manager FOREIGN KEY (Manager_User_ID) REFERENCES USER(User_ID)
);

-- Create EMPLOYEE table
CREATE TABLE IF NOT EXISTS EMPLOYEE (
    Employee_ID INT PRIMARY KEY AUTO_INCREMENT,
    First_Name VARCHAR(50) NOT NULL,
    Last_Name VARCHAR(50) NOT NULL,
    Username VARCHAR(50) UNIQUE,
    Email VARCHAR(255) UNIQUE,
    Phone_Number VARCHAR(20) UNIQUE,
    Password_Hash BINARY(64) NOT NULL,
    Role ENUM('Admin', 'Staff', 'Customer') DEFAULT 'Staff',
    Address_ID INT,
    Manager_Employee_ID INT NULL,
    CONSTRAINT fk_employee_address FOREIGN KEY (Address_ID) REFERENCES ADDRESS(Address_ID),
    CONSTRAINT fk_employee_manager FOREIGN KEY (Manager_Employee_ID) REFERENCES EMPLOYEE(Employee_ID)
);

-- Modify CATEGORIES table (if needed)
CREATE TABLE IF NOT EXISTS CATEGORIES (
    Category_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) UNIQUE,
    Description TEXT NOT NULL
);


-- Create PRODUCTS table
CREATE TABLE IF NOT EXISTS PRODUCTS (
    Product_ID INT PRIMARY KEY AUTO_INCREMENT,
    Product_Name VARCHAR(100) NOT NULL,
    Description TEXT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Stock_Quantity INT NOT NULL,
    Reorder_Threshold INT DEFAULT 0,
    Size VARCHAR(50) NOT NULL,
    Color VARCHAR(50) NOT NULL,
    Brand VARCHAR(50) NOT NULL,
    CONSTRAINT chk_price CHECK (Price > 0),
    CONSTRAINT chk_stock CHECK (Stock_Quantity >= 0)
);

-- Create PRODUCT_CATEGORIES table
CREATE TABLE IF NOT EXISTS PRODUCT_CATEGORIES (
    Product_ID INT,
    Category_ID INT,
    PRIMARY KEY (Product_ID, Category_ID),
    CONSTRAINT fk_product_id FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID),
    CONSTRAINT fk_category_id FOREIGN KEY (Category_ID) REFERENCES CATEGORIES(Category_ID)
);

-- ORDERS table
CREATE TABLE IF NOT EXISTS ORDERS (
    Order_ID INT PRIMARY KEY AUTO_INCREMENT,
    Employee_ID INT,  -- Changed from Customer_ID to Employee_ID
    Order_Status ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled') NOT NULL,
    Shipping_Address_ID INT,
    Order_Date DATE NOT NULL,
    Shipping_Cost DECIMAL(10,2) DEFAULT 5.00,
    Payment_Method VARCHAR(20) NOT NULL,
    FOREIGN KEY fk_employee_id (Employee_ID) REFERENCES EMPLOYEE(Employee_ID),
    FOREIGN KEY fk_shipping_address_id (Shipping_Address_ID) REFERENCES ADDRESS(Address_ID),
    CONSTRAINT chk_order_date CHECK (Order_Date <= '9999-12-31')
);

-- TRANSACTIONS table
CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    Transaction_ID INT PRIMARY KEY AUTO_INCREMENT,
    Order_ID INT UNIQUE,
    Transaction_Date DATE NOT NULL,
    Total_Amount DECIMAL(10,2) NOT NULL,
    Payment_Status ENUM('Pending', 'Paid', 'Failed', 'Refunded') NOT NULL,
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID),
    CONSTRAINT chk_transaction_date CHECK (Transaction_Date <= '9999-12-31'),
    CONSTRAINT chk_total_amount CHECK (Total_Amount >= 0)
);

CREATE TABLE IF NOT EXISTS SHOPPING_CART (
    Cart_ID INT PRIMARY KEY AUTO_INCREMENT,
    Employee_ID INT UNIQUE,  -- Changed from Customer_ID to Employee_ID
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Employee_ID) REFERENCES EMPLOYEE(Employee_ID)
);

-- Create CART_ITEMS table
CREATE TABLE IF NOT EXISTS CART_ITEMS (
    Cart_Item_ID INT PRIMARY KEY AUTO_INCREMENT,
    Cart_ID INT,
    Product_ID INT,
    Quantity INT NOT NULL,
    FOREIGN KEY (Cart_ID) REFERENCES SHOPPING_CART(Cart_ID),
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID),
    CONSTRAINT chk_cart_quantity CHECK (Quantity > 0)
);

-- reorder alert table
CREATE TABLE IF NOT EXISTS REORDER_ALERTS (
    Alert_ID INT PRIMARY KEY AUTO_INCREMENT,
    Product_ID INT,
    Alert_Date DATE DEFAULT (CURRENT_DATE),
    Quantity_To_Reorder INT NOT NULL,
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID),
    CONSTRAINT chk_reorder_quantity CHECK (Quantity_To_Reorder > 0)
);

-- RETURNS table
CREATE TABLE IF NOT EXISTS RETURNS (
    Return_ID INT PRIMARY KEY AUTO_INCREMENT,
    Order_ID INT,
    Employee_ID INT,  -- Changed from Customer_ID to Employee_ID
    Return_Date DATE NOT NULL,
    Return_Status ENUM('Pending', 'Approved', 'Completed', 'Rejected') NOT NULL,
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID),
    FOREIGN KEY (Employee_ID) REFERENCES EMPLOYEE(Employee_ID),
    CONSTRAINT chk_return_date CHECK (Return_Date <= '9999-12-31')
);

-- Create RETURN_ITEMS table
CREATE TABLE IF NOT EXISTS RETURN_ITEMS (
    ReturnItem_ID INT PRIMARY KEY AUTO_INCREMENT,
    Return_ID INT,
    Product_ID INT,
    Quantity INT NOT NULL,
    FOREIGN KEY (Return_ID) REFERENCES RETURNS(Return_ID),
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID),
    CONSTRAINT chk_return_quantity CHECK (Quantity > 0)
);

CREATE TABLE IF NOT EXISTS REFUNDS (
    Refund_ID INT PRIMARY KEY AUTO_INCREMENT,
    Return_ID INT UNIQUE,
    Refund_Amount DECIMAL(10,2) NOT NULL,
    Refund_Date DATE DEFAULT (CURRENT_DATE),
    Refund_Status ENUM('Pending', 'Completed') NOT NULL,
    FOREIGN KEY (Return_ID) REFERENCES RETURNS(Return_ID),
    CONSTRAINT chk_refund_amount CHECK (Refund_Amount > 0)
);

CREATE TABLE IF NOT EXISTS ACTIVITY_LOGS (
    Log_ID INT PRIMARY KEY AUTO_INCREMENT,
    Employee_ID INT,  -- Changed from User_ID to Employee_ID
    Action VARCHAR(255) NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Entity_Affected VARCHAR(50),
    FOREIGN KEY (Employee_ID) REFERENCES EMPLOYEE(Employee_ID)
);

CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    Notification_ID INT PRIMARY KEY AUTO_INCREMENT,
    Employee_ID INT,  -- Changed from User_ID to Employee_ID
    Message TEXT NOT NULL,
    Notification_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Read_Status BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (Employee_ID) REFERENCES EMPLOYEE(Employee_ID)
);