-- ===============================================
-- AI CREDITS MONETIZATION SYSTEM - DATABASE SCHEMA MIGRATION
-- OkBuddy AI Credits System Implementation
-- ===============================================

-- ⚠️ IMPORTANT: Run this migration during maintenance window
-- ⚠️ BACKUP your database before running this migration!

BEGIN;

-- ===============================================
-- 1. BACKUP CURRENT USERS TABLE
-- ===============================================

-- Create backup table with timestamp
CREATE TABLE users_backup_ai_credits AS TABLE users;

-- Log migration start
INSERT INTO audit_logs (user_id, action, resource_type, details) 
VALUES (NULL, 'MIGRATION_START', 'ai_credits_schema', 
        '{"migration": "ai_credits_monetization", "timestamp": "' || NOW() || '"}');

-- ===============================================
-- 2. ADD AI CREDITS FIELDS TO USERS TABLE
-- ===============================================

-- Add AI credits tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_credits_balance INTEGER DEFAULT 5 CHECK (ai_credits_balance >= 0),
ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0 CHECK (ai_credits_used >= 0),
ADD COLUMN IF NOT EXISTS ai_credits_purchased INTEGER DEFAULT 0 CHECK (ai_credits_purchased >= 0),
ADD COLUMN IF NOT EXISTS credits_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing users to have 5 free credits
UPDATE users 
SET ai_credits_balance = 5, 
    ai_credits_used = 0, 
    ai_credits_purchased = 0,
    credits_updated_at = NOW()
WHERE ai_credits_balance IS NULL;

-- Make credits fields NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN ai_credits_balance SET NOT NULL,
ALTER COLUMN ai_credits_used SET NOT NULL,
ALTER COLUMN ai_credits_purchased SET NOT NULL,
ALTER COLUMN credits_updated_at SET NOT NULL;

-- ===============================================
-- 3. CREATE AI TRANSACTIONS TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS ai_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'referral')),
    credits_amount INTEGER NOT NULL,
    
    -- Purchase information
    package_type VARCHAR(20), -- 'basic', 'popular', 'value'
    package_credits INTEGER,
    amount_paid DECIMAL(10,2),
    currency VARCHAR(3), -- 'USD', 'VND'
    
    -- Payment details
    payment_method VARCHAR(20), -- 'momo', 'vietcombank', 'card', 'paypal'
    payment_reference VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_verified_at TIMESTAMP WITH TIME ZONE,
    payment_verified_by UUID REFERENCES users(id), -- Admin who verified
    
    -- Usage tracking (for 'usage' type)
    ai_feature_used VARCHAR(50), -- 'summary_generate', 'summary_improve', 'experience_wizard', 'bullet_improve', 'skills_suggest'
    usage_session_id UUID,
    
    -- Geographic and technical details
    user_ip INET,
    user_country VARCHAR(2), -- ISO country code
    user_agent TEXT,
    
    -- Metadata
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 4. CREATE USER REFERRALS TABLE (Future Implementation)
-- ===============================================

CREATE TABLE IF NOT EXISTS user_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Referral details
    referral_code VARCHAR(50) NOT NULL,
    credits_awarded_referrer INTEGER DEFAULT 5,
    credits_awarded_referee INTEGER DEFAULT 5,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    referrer_ip INET,
    referee_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(referrer_id, referee_id),
    CONSTRAINT no_self_referral CHECK (referrer_id != referee_id)
);

-- ===============================================
-- 5. CREATE REFERRAL CODES TABLE (Future Implementation)
-- ===============================================

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Code details
    code VARCHAR(50) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 100, -- Maximum uses per code
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===============================================

-- Users table indexes for credits
CREATE INDEX IF NOT EXISTS idx_users_credits_balance ON users(ai_credits_balance);
CREATE INDEX IF NOT EXISTS idx_users_credits_updated ON users(credits_updated_at DESC);

-- AI transactions indexes
CREATE INDEX IF NOT EXISTS idx_ai_transactions_user_id ON ai_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_type ON ai_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_status ON ai_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_created ON ai_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_payment_ref ON ai_transactions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_user_type ON ai_transactions(user_id, transaction_type);

-- User referrals indexes
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referee ON user_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON user_referrals(status);

-- Referral codes indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active);

-- ===============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ===============================================

-- Enable RLS on new tables
ALTER TABLE ai_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_transactions
CREATE POLICY "Users can view own transactions" ON ai_transactions
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service can insert transactions" ON ai_transactions
    FOR INSERT
    WITH CHECK (true); -- Allow service to insert for credit deductions

CREATE POLICY "Service can update transactions" ON ai_transactions
    FOR UPDATE
    USING (true); -- Allow service to update payment status

-- RLS policies for user_referrals
CREATE POLICY "Users can view own referrals" ON user_referrals
    FOR SELECT
    USING (auth.uid()::text = referrer_id::text OR auth.uid()::text = referee_id::text);

CREATE POLICY "Service can manage referrals" ON user_referrals
    FOR ALL
    USING (true); -- Allow service to manage referral system

-- RLS policies for referral_codes
CREATE POLICY "Users can view own referral codes" ON referral_codes
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service can manage referral codes" ON referral_codes
    FOR ALL
    USING (true); -- Allow service to generate and manage codes

-- ===============================================
-- 8. CREATE FUNCTIONS & TRIGGERS
-- ===============================================

-- Function to update credits_updated_at timestamp
CREATE OR REPLACE FUNCTION update_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.ai_credits_balance != OLD.ai_credits_balance OR 
        NEW.ai_credits_used != OLD.ai_credits_used OR 
        NEW.ai_credits_purchased != OLD.ai_credits_purchased) THEN
        NEW.credits_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users credits updates
CREATE TRIGGER update_users_credits_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_timestamp();

-- Function to update updated_at for new tables
CREATE TRIGGER update_ai_transactions_updated_at
    BEFORE UPDATE ON ai_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at
    BEFORE UPDATE ON user_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at
    BEFORE UPDATE ON referral_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 9. CREATE AI CREDITS MANAGEMENT FUNCTIONS
-- ===============================================

-- Function to deduct credits for AI usage
CREATE OR REPLACE FUNCTION deduct_ai_credits(
    p_user_id UUID,
    p_credits_amount INTEGER,
    p_ai_feature VARCHAR(50),
    p_session_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_balance INTEGER;
    result JSONB;
BEGIN
    -- Get current balance
    SELECT ai_credits_balance INTO current_balance
    FROM users 
    WHERE id = p_user_id;
    
    -- Check if user exists
    IF current_balance IS NULL THEN
        RETURN '{"success": false, "error": "User not found"}';
    END IF;
    
    -- Check if sufficient credits
    IF current_balance < p_credits_amount THEN
        RETURN '{"success": false, "error": "Insufficient credits", "current_balance": ' || current_balance || '}';
    END IF;
    
    -- Deduct credits
    UPDATE users 
    SET ai_credits_balance = ai_credits_balance - p_credits_amount,
        ai_credits_used = ai_credits_used + p_credits_amount
    WHERE id = p_user_id;
    
    -- Log the transaction
    INSERT INTO ai_transactions (
        user_id, transaction_type, credits_amount, ai_feature_used, usage_session_id
    ) VALUES (
        p_user_id, 'usage', p_credits_amount, p_ai_feature, p_session_id
    );
    
    -- Return success with new balance
    SELECT ai_credits_balance INTO current_balance
    FROM users WHERE id = p_user_id;
    
    RETURN '{"success": true, "new_balance": ' || current_balance || ', "credits_deducted": ' || p_credits_amount || '}';
END;
$$ LANGUAGE plpgsql;

-- Function to add credits for purchases
CREATE OR REPLACE FUNCTION add_ai_credits(
    p_user_id UUID,
    p_credits_amount INTEGER,
    p_package_type VARCHAR(20),
    p_amount_paid DECIMAL(10,2),
    p_currency VARCHAR(3),
    p_payment_method VARCHAR(20),
    p_payment_reference VARCHAR(255)
)
RETURNS JSONB AS $$
DECLARE
    new_balance INTEGER;
    transaction_id UUID;
BEGIN
    -- Add credits
    UPDATE users 
    SET ai_credits_balance = ai_credits_balance + p_credits_amount,
        ai_credits_purchased = ai_credits_purchased + p_credits_amount
    WHERE id = p_user_id;
    
    -- Log the transaction
    INSERT INTO ai_transactions (
        user_id, transaction_type, credits_amount, package_type, 
        package_credits, amount_paid, currency, payment_method, 
        payment_reference, payment_status
    ) VALUES (
        p_user_id, 'purchase', p_credits_amount, p_package_type,
        p_credits_amount, p_amount_paid, p_currency, p_payment_method,
        p_payment_reference, 'completed'
    ) RETURNING id INTO transaction_id;
    
    -- Get new balance
    SELECT ai_credits_balance INTO new_balance
    FROM users WHERE id = p_user_id;
    
    RETURN '{"success": true, "new_balance": ' || new_balance || ', "credits_added": ' || p_credits_amount || ', "transaction_id": "' || transaction_id || '"}';
END;
$$ LANGUAGE plpgsql;

-- Function to check credit balance
CREATE OR REPLACE FUNCTION get_ai_credits_balance(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_credits RECORD;
BEGIN
    SELECT ai_credits_balance, ai_credits_used, ai_credits_purchased, credits_updated_at
    INTO user_credits
    FROM users 
    WHERE id = p_user_id;
    
    IF user_credits IS NULL THEN
        RETURN '{"success": false, "error": "User not found"}';
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'balance', user_credits.ai_credits_balance,
        'used', user_credits.ai_credits_used,
        'purchased', user_credits.ai_credits_purchased,
        'updated_at', user_credits.credits_updated_at
    );
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 10. GRANT PERMISSIONS
-- ===============================================

-- Grant permissions for authenticated users
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT ON ai_transactions TO authenticated;
GRANT SELECT ON user_referrals TO authenticated;
GRANT SELECT ON referral_codes TO authenticated;

-- Grant permissions for service role (for credit operations)
GRANT ALL ON users TO service_role;
GRANT ALL ON ai_transactions TO service_role;
GRANT ALL ON user_referrals TO service_role;
GRANT ALL ON referral_codes TO service_role;

-- ===============================================
-- 11. VALIDATION & TESTING
-- ===============================================

-- Test the credit deduction function
DO $$
DECLARE
    test_user_id UUID;
    test_result JSONB;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test credit balance check
        SELECT get_ai_credits_balance(test_user_id) INTO test_result;
        RAISE NOTICE 'Credit balance test: %', test_result;
        
        -- Test credit deduction (but rollback)
        SAVEPOINT test_deduction;
        SELECT deduct_ai_credits(test_user_id, 1, 'test_feature') INTO test_result;
        RAISE NOTICE 'Credit deduction test: %', test_result;
        ROLLBACK TO test_deduction;
    END IF;
END $$;

-- ===============================================
-- 12. LOG MIGRATION COMPLETION
-- ===============================================

INSERT INTO audit_logs (user_id, action, resource_type, details) 
VALUES (NULL, 'MIGRATION_COMPLETE', 'ai_credits_schema', 
        '{"migration": "ai_credits_monetization", "timestamp": "' || NOW() || '", "status": "success"}');

-- Create summary of what was created
DO $$
DECLARE
    total_users INTEGER;
    total_credits_allocated INTEGER;
BEGIN
    SELECT COUNT(*), SUM(ai_credits_balance) 
    INTO total_users, total_credits_allocated
    FROM users;
    
    RAISE NOTICE '=== AI CREDITS MIGRATION COMPLETED ===';
    RAISE NOTICE 'Total users migrated: %', total_users;
    RAISE NOTICE 'Total free credits allocated: %', total_credits_allocated;
    RAISE NOTICE 'Tables created: ai_transactions, user_referrals, referral_codes';
    RAISE NOTICE 'Functions created: deduct_ai_credits, add_ai_credits, get_ai_credits_balance';
    RAISE NOTICE '=====================================';
END $$;

COMMIT;

-- ===============================================
-- 13. POST-MIGRATION VERIFICATION
-- ===============================================

-- Verify all users have credits
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE ai_credits_balance = 5) as users_with_5_credits,
    SUM(ai_credits_balance) as total_credits_allocated
FROM users;

-- Verify table structure
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'ai_transactions', 'user_referrals', 'referral_codes')
    AND column_name LIKE '%credit%' OR column_name LIKE '%referral%'
ORDER BY table_name, ordinal_position;
