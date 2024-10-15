-- Populate CATEGORIES table with a flat structure
INSERT IGNORE INTO CATEGORIES (Name, Description) VALUES
-- Demographics
('Men', 'Products for men'),
('Women', 'Products for women'),
('Kids', 'Products for children'),
('Unisex', 'Products suitable for all genders'),

-- Clothing Types
('Shirts', 'All types of shirts'),
('T-Shirts', 'Casual short-sleeved shirts'),
('Blouses', 'Women''s upper body garments'),
('Pants', 'All types of pants and trousers'),
('Jeans', 'Denim pants'),
('Shorts', 'Short pants for casual wear'),
('Dresses', 'One-piece garments for women'),
('Skirts', 'Women''s lower body garments'),
('Suits', 'Formal wear sets'),
('Jackets', 'Outerwear for upper body'),
('Coats', 'Heavy outerwear'),
('Sweaters', 'Knitted upper body garments'),
('Hoodies', 'Sweatshirts with hoods'),
('Underwear', 'Undergarments'),
('Socks', 'Foot coverings'),
('Swimwear', 'Clothing for swimming'),

-- Footwear
('Shoes', 'All types of footwear'),
('Sneakers', 'Athletic shoes'),
('Boots', 'Heavy footwear'),
('Sandals', 'Open footwear'),
('Formal Shoes', 'Shoes for formal occasions'),
('Slippers', 'Indoor footwear'),

-- Accessories
('Accessories', 'Various clothing accessories'),
('Belts', 'Waist straps'),
('Hats', 'Head coverings'),
('Scarves', 'Neck wraps'),
('Gloves', 'Hand coverings'),
('Ties', 'Formal neck wear'),
('Sunglasses', 'Eye protection and fashion'),
('Watches', 'Wrist timepieces'),
('Jewelry', 'Decorative accessories'),
('Bags', 'Carrying accessories'),
('Wallets', 'Money and card holders'),

-- Seasonal
('Summer Wear', 'Clothing for hot weather'),
('Winter Wear', 'Clothing for cold weather'),
('Spring Collection', 'Clothing for spring season'),
('Fall Collection', 'Clothing for fall season'),

-- Style
('Casual', 'Everyday comfortable clothing'),
('Formal', 'Clothing for formal occasions'),
('Athletic', 'Clothing for sports and exercise'),
('Sleepwear', 'Clothing for sleeping'),
('Workwear', 'Clothing for professional settings'),
('Vintage', 'Retro-style clothing'),
('Designer', 'High-end fashion items'),

-- Special Categories
('Sale', 'Discounted items'),
('New Arrivals', 'Recently added products'),
('Limited Edition', 'Special release items');