DELIMITER //

CREATE PROCEDURE generate_fake_payment_data()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_user_id INT;
    DECLARE current_address_id INT;
    DECLARE user_cursor CURSOR FOR 
        SELECT user_id, address_id 
        FROM users 
        WHERE role_id = 1 
        AND user_id NOT IN (SELECT DISTINCT user_id FROM payment WHERE user_id IS NOT NULL);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    read_loop: LOOP
        FETCH user_cursor INTO current_user_id, current_address_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Generate fake payment data
        INSERT INTO payment (
            cardholder_name,
            card_number,
            expiration_date,
            cvv,
            user_id,
            billing_address_id
        )
        SELECT
            CONCAT(first_name, ' ', last_name) as cardholder_name,
            -- Generate exactly 16 digits with common prefixes
            CONCAT(
                ELT(FLOOR(1 + RAND() * 4), 
                    '4' + LPAD(FLOOR(RAND() * POWER(10, 15)), 15, '0'),  -- Visa (16 digits)
                    '51' + LPAD(FLOOR(RAND() * POWER(10, 14)), 14, '0'), -- Mastercard (16 digits)
                    '4' + LPAD(FLOOR(RAND() * POWER(10, 15)), 15, '0'),  -- Using Visa again instead of Amex
                    '6011' + LPAD(FLOOR(RAND() * POWER(10, 12)), 12, '0') -- Discover (16 digits)
                )
            ) as card_number,
            -- Generate expiration date (MM/YY format, 1-4 years in the future)
            CONCAT(
                LPAD(FLOOR(1 + RAND() * 12), 2, '0'),
                '/',
                RIGHT(YEAR(DATE_ADD(CURRENT_DATE, INTERVAL FLOOR(1 + RAND() * 4) YEAR)), 2)
            ) as expiration_date,
            -- Generate CVV (3 digits since most cards use 3)
            LPAD(FLOOR(RAND() * 999), 3, '0') as cvv,
            current_user_id,
            current_address_id
        FROM users
        WHERE user_id = current_user_id
        LIMIT 1;
        
    END LOOP;
    
    CLOSE user_cursor;
    
    -- Output summary
    SELECT CONCAT('Payment records generated for all users with role_id = 1') AS Result;
END //

DELIMITER ;

CALL generate_fake_payment_data();