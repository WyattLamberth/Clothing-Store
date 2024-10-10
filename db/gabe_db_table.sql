-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS online_store;

-- Use the database
USE online_store;

-- Create ADDRESS table
CREATE TABLE IF NOT EXISTS ADDRESS (
    Address_ID INT PRIMARY KEY AUTO_INCREMENT,
    Line_1 NVARCHAR(255) NOT NULL,
    Line_2 NVARCHAR(255) DEFAULT 'N/A',
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    Zip VARCHAR(10) NOT NULL,
    CONSTRAINT chk_state CHECK (State IN ('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY')),
    CONSTRAINT chk_zip CHECK (Zip REGEXP '^[0-9]{5}(-[0-9]{4})?$')
);

-- Create USERS table
CREATE TABLE IF NOT EXISTS USERS (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    First_Name VARCHAR(50) NOT NULL,
    Last_Name VARCHAR(50) NOT NULL,
    Username VARCHAR(50) UNIQUE,
    Email VARCHAR(255) UNIQUE,
    Phone_Number VARCHAR(20) UNIQUE,
    Password_Hash BINARY(64) NOT NULL,
    Role ENUM('Customer', 'Employee', 'Admin') NOT NULL,
    Address_ID INT,
    CONSTRAINT fk_user_address FOREIGN KEY (Address_ID) REFERENCES ADDRESS(Address_ID)
);

-- Create CUSTOMERS table
CREATE TABLE IF NOT EXISTS CUSTOMERS (
    Customer_ID INT PRIMARY KEY,
    Date_Joined DATE NOT NULL,
    Preferred_Payment_ID INT,
    FOREIGN KEY (Customer_ID) REFERENCES USERS(User_ID),
    FOREIGN KEY (Preferred_Payment_ID) REFERENCES PAYMENT(Preferred_Payment_ID)
);

-- Create EMPLOYEES table
CREATE TABLE IF NOT EXISTS EMPLOYEES (
    Employee_ID INT PRIMARY KEY,
    Manager_Employee_ID INT,
    Role ENUM('Staff', 'Admin') NOT NULL,
    FOREIGN KEY (Employee_ID) REFERENCES USERS(User_ID),
    FOREIGN KEY (Manager_Employee_ID) REFERENCES EMPLOYEES(Employee_ID)
);

-- Create ADMINS table (if specific fields are needed)
CREATE TABLE IF NOT EXISTS ADMINS (
    Admin_ID INT PRIMARY KEY,
    FOREIGN KEY (Admin_ID) REFERENCES USERS(User_ID)
);

-- Create PAYMENT table
CREATE TABLE IF NOT EXISTS PAYMENT (
    Preferred_Payment_ID INT PRIMARY KEY AUTO_INCREMENT,
    Cardholder_Name NVARCHAR(100) NOT NULL,
    Card_Number CHAR(16) UNIQUE,
    Expiration_Date CHAR(5) NOT NULL, -- Format MM/YY
    CVV CHAR(3) UNIQUE,
    Customer_ID INT,
    Billing_Address_ID INT,
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMERS(Customer_ID),
    FOREIGN KEY (Billing_Address_ID) REFERENCES ADDRESS(Address_ID)
);

-- Create PRODUCTS table
CREATE TABLE IF NOT EXISTS PRODUCTS (
    Product_ID INT PRIMARY KEY AUTO_INCREMENT,
    Product_Name NVARCHAR(100) NOT NULL,
    Category_ID INT,
    Description TEXT NOT NULL,
    Price DECIMAL(10,2) NOT NULL CHECK (Price > 0),
    Stock_Quantity INT NOT NULL CHECK (Stock_Quantity >= 0),
    Reorder_Threshold INT DEFAULT 0,
    Size NVARCHAR(50) NOT NULL,
    Color NVARCHAR(50) NOT NULL,
    Brand NVARCHAR(50) NOT NULL,
    FOREIGN KEY (Category_ID) REFERENCES CATEGORIES(Category_ID)
);

-- Create CATEGORIES table
CREATE TABLE IF NOT EXISTS CATEGORIES (
    Category_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name NVARCHAR(100) UNIQUE NOT NULL,
    Description TEXT NOT NULL
);

-- Create ORDERS table
CREATE TABLE IF NOT EXISTS ORDERS (
    Order_ID INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID INT,
    Shipping_Address_ID INT,
    Order_Status ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled') NOT NULL,
    Order_Date DATE NOT NULL CHECK (Order_Date <= CURRENT_DATE),
    Shipping_Cost DECIMAL(10,2) DEFAULT 5.00,
    Payment_Method VARCHAR(20) NOT NULL,
    Total_Amount DECIMAL(10,2) NOT NULL CHECK (Total_Amount >= 0),
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMERS(Customer_ID),
    FOREIGN KEY (Shipping_Address_ID) REFERENCES ADDRESS(Address_ID)
);

-- Create ORDER_ITEMS table
CREATE TABLE IF NOT EXISTS ORDER_ITEMS (
    Order_Item_ID INT PRIMARY KEY AUTO_INCREMENT,
    Order_ID INT,
    Product_ID INT,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Unit_Price DECIMAL(10,2) NOT NULL,
    Total_Item_Price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID),
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID)
);

-- Create TRANSACTIONS table
CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    Transaction_ID INT PRIMARY KEY AUTO_INCREMENT,
    Order_ID INT UNIQUE,
    Transaction_Date DATE NOT NULL CHECK (Transaction_Date <= CURRENT_DATE),
    Total_Amount DECIMAL(10,2) NOT NULL CHECK (Total_Amount >= 0),
    Payment_Status ENUM('Pending', 'Paid', 'Failed', 'Refunded') NOT NULL,
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID)
);

-- Create SHOPPING_CART table
CREATE TABLE IF NOT EXISTS SHOPPING_CART (
    Cart_ID INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID INT UNIQUE,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMERS(Customer_ID)
);

-- Create CART_ITEMS table
CREATE TABLE IF NOT EXISTS CART_ITEMS (
    Cart_Item_ID INT PRIMARY KEY AUTO_INCREMENT,
    Cart_ID INT,
    Product_ID INT,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    FOREIGN KEY (Cart_ID) REFERENCES SHOPPING_CART(Cart_ID),
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID)
);

-- Create REORDER_ALERTS table
CREATE TABLE IF NOT EXISTS REORDER_ALERTS (
    Alert_ID INT PRIMARY KEY AUTO_INCREMENT,
    Product_ID INT,
    Alert_Date DATE DEFAULT CURRENT_DATE,
    Quantity_To_Reorder INT NOT NULL CHECK (Quantity_To_Reorder > 0),
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID)
);

-- Create RETURNS table
CREATE TABLE IF NOT EXISTS RETURNS (
    Return_ID INT PRIMARY KEY AUTO_INCREMENT,
    Order_ID INT,
    Customer_ID INT,
    Return_Date DATE NOT NULL CHECK (Return_Date <= CURRENT_DATE),
    Return_Status ENUM('Pending', 'Approved', 'Completed', 'Rejected') NOT NULL,
    FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID),
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMERS(Customer_ID)
);

-- Create RETURN_ITEMS table
CREATE TABLE IF NOT EXISTS RETURN_ITEMS (
    ReturnItem_ID INT PRIMARY KEY AUTO_INCREMENT,
    Return_ID INT,
    Product_ID INT,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    FOREIGN KEY (Return_ID) REFERENCES RETURNS(Return_ID),
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID)
);

-- Create REFUNDS table
CREATE TABLE IF NOT EXISTS REFUNDS (
    Refund_ID INT PRIMARY KEY AUTO_INCREMENT,
    Return_ID INT UNIQUE,
    Refund_Amount DECIMAL(10,2) NOT NULL CHECK (Refund_Amount >= 0),
    Refund_Date DATE DEFAULT CURRENT_DATE,
    Refund_Status ENUM('Pending', 'Completed') NOT NULL,
    FOREIGN KEY (Return_ID) REFERENCES RETURNS(Return_ID)
);

-- Create ACTIVITY_LOGS table
CREATE TABLE IF NOT EXISTS ACTIVITY_LOGS (
    Log_ID INT PRIMARY KEY AUTO_INCREMENT,
    User_ID INT,
    Action VARCHAR(255) NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Entity_Affected VARCHAR(50),
    FOREIGN KEY (User_ID) REFERENCES USERS(User_ID)
);

-- Create NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    Notification_ID INT PRIMARY KEY AUTO_INCREMENT,
    User_ID INT,
    Message TEXT NOT NULL,
    Notification_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Read_Status BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (User_ID) REFERENCES USERS(User_ID)
);

-- Create SALE_EVENTS table
CREATE TABLE IF NOT EXISTS SALE_EVENTS (
    Sale_Event_ID INT PRIMARY KEY AUTO_INCREMENT,
    Event_Name VARCHAR(100) NOT NULL,
    Start_Date DATE NOT NULL CHECK (Start_Date >= CURRENT_DATE),
    End_Date DATE NOT NULL CHECK (End_Date > Start_Date)
);

-- Create DISCOUNTS table
CREATE TABLE IF NOT EXISTS DISCOUNTS (
    Discount_ID INT PRIMARY KEY AUTO_INCREMENT,
    Discount_Type VARCHAR(50),
    Discount_Percentage DECIMAL(5,2) CHECK (Discount_Percentage >= 0 AND Discount_Percentage <= 50),
    Start_Date DATE NOT NULL CHECK (Start_Date >= CURRENT_DATE),
    End_Date DATE NOT NULL CHECK (End_Date > Start_Date),
    Product_ID INT,
    Category_ID INT,
    Sale_Event_ID INT,
    FOREIGN KEY (Product_ID) REFERENCES PRODUCTS(Product_ID),
    FOREIGN KEY (Category_ID) REFERENCES CATEGORIES(Category_ID),
    FOREIGN KEY (Sale_Event_ID) REFERENCES SALE_EVENTS(Sale_Event_ID)
);

-- Create PERMISSIONS table
CREATE TABLE IF NOT EXISTS PERMISSIONS (
    Permission_ID INT PRIMARY KEY AUTO_INCREMENT,
    Permission_Name VARCHAR(50) NOT NULL
);

-- Create ROLE_PERMISSIONS table
CREATE TABLE IF NOT EXISTS ROLE_PERMISSIONS (
    Role ENUM('Customer', 'Employee', 'Admin') NOT NULL,
    Permission_ID INT,
    FOREIGN KEY (Permission_ID) REFERENCES PERMISSIONS(Permission_ID)
);
