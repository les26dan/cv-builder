-- Production Test User Creation Script
-- Run this in your Supabase SQL Editor or via CLI

-- First, check if user already exists
DO $$
DECLARE
    user_exists boolean;
    hashed_password text;
BEGIN
    -- Check if test user already exists
    SELECT EXISTS(
        SELECT 1 FROM users WHERE email = 'okbuddy.test.user@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Test user already exists with email: okbuddy.test.user@gmail.com';
    ELSE
        -- Create the test user
        -- Note: You'll need to hash the password 'CV Builder2025!' using bcrypt
        -- You can use: bcrypt.hash('CV Builder2025!', 12)
        INSERT INTO users (
            id,
            email,
            full_name,
            password_hash,
            email_verified,
            signup_method,
            account_status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'okbuddy.test.user@gmail.com',
            'CV Builder Test User',
            '$2b$12$IHIuUMCC5xMw5MdzD6vIR.5csLp9T.e/GhCMv7QoyTpxPp5hGT.UW',  -- bcrypt hash for 'CV Builder2025!'
            true,
            'email',
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Successfully created test user: okbuddy.test.user@gmail.com';
    END IF;
END $$;