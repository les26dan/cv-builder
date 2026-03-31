-- ===============================================
-- FIX ADMIN CREDITS - DATABASE PATCH
-- ===============================================
-- This script fixes the issue where admin accounts don't get AI credits initialized

BEGIN;

-- ===============================================
-- 1. ENSURE ALL EXISTING USERS HAVE AI CREDITS
-- ===============================================

-- Update any users who might not have AI credits initialized
UPDATE users 
SET 
    ai_credits_balance = COALESCE(ai_credits_balance, 5),
    ai_credits_used = COALESCE(ai_credits_used, 0),
    ai_credits_purchased = COALESCE(ai_credits_purchased, 0),
    credits_updated_at = COALESCE(credits_updated_at, NOW())
WHERE 
    ai_credits_balance IS NULL 
    OR ai_credits_used IS NULL 
    OR ai_credits_purchased IS NULL 
    OR credits_updated_at IS NULL;

-- ===============================================
-- 2. CREATE TRIGGER TO AUTO-INITIALIZE CREDITS FOR NEW USERS
-- ===============================================

-- Function to initialize AI credits for new users
CREATE OR REPLACE FUNCTION initialize_user_ai_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default AI credits for new users
    NEW.ai_credits_balance := COALESCE(NEW.ai_credits_balance, 5);
    NEW.ai_credits_used := COALESCE(NEW.ai_credits_used, 0);
    NEW.ai_credits_purchased := COALESCE(NEW.ai_credits_purchased, 0);
    NEW.credits_updated_at := COALESCE(NEW.credits_updated_at, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert on users table
DROP TRIGGER IF EXISTS trigger_initialize_user_ai_credits ON users;
CREATE TRIGGER trigger_initialize_user_ai_credits
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_ai_credits();

-- ===============================================
-- 3. VERIFY THE FIX
-- ===============================================

-- Check that all users now have AI credits
DO $$
DECLARE
    users_without_credits INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_without_credits
    FROM users 
    WHERE ai_credits_balance IS NULL 
       OR ai_credits_used IS NULL 
       OR ai_credits_purchased IS NULL;
    
    IF users_without_credits > 0 THEN
        RAISE EXCEPTION 'Still have % users without AI credits initialized', users_without_credits;
    ELSE
        RAISE NOTICE 'SUCCESS: All users now have AI credits initialized';
    END IF;
END $$;

-- Log the fix
INSERT INTO ai_transactions (
    user_id, 
    transaction_type, 
    credits_amount, 
    ai_feature_used, 
    created_at
) VALUES (
    NULL,
    'system_fix',
    0,
    'admin_credits_initialization',
    NOW()
);

COMMIT;

-- ===============================================
-- 4. VERIFICATION QUERIES
-- ===============================================

-- Show all users and their credit status
SELECT 
    id,
    email,
    full_name,
    ai_credits_balance,
    ai_credits_used,
    ai_credits_purchased,
    credits_updated_at,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Show admin users specifically
SELECT 
    id,
    email,
    full_name,
    ai_credits_balance,
    ai_credits_used,
    ai_credits_purchased
FROM users 
WHERE email LIKE '%admin%' OR email LIKE '%okbuddy%'
ORDER BY created_at DESC;
