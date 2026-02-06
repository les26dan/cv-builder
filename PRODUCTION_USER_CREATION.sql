-- Copy and paste this into your Supabase SQL Editor
-- This will create the test user: okbuddy.test.user@gmail.com

DO $$
DECLARE
    user_exists boolean;
BEGIN
    -- Check if test user already exists
    SELECT EXISTS(
        SELECT 1 FROM users WHERE email = 'okbuddy.test.user@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Test user already exists with email: okbuddy.test.user@gmail.com';
    ELSE
        -- Create the test user
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
            'OkBuddy Test User',
            '$2b$12$IHIuUMCC5xMw5MdzD6vIR.5csLp9T.e/GhCMv7QoyTpxPp5hGT.UW',
            true,
            'email',
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Successfully created test user: okbuddy.test.user@gmail.com';
        RAISE NOTICE 'Password: OkBuddy2025!';
        RAISE NOTICE 'User has standard permissions (no admin access)';
    END IF;
END $$;

-- Verify the user was created
SELECT 
    id,
    email,
    full_name,
    email_verified,
    signup_method,
    account_status,
    created_at
FROM users 
WHERE email = 'okbuddy.test.user@gmail.com';