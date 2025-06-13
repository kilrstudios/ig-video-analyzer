-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits_balance INTEGER DEFAULT 10, -- Start users with 10 free credits
  total_credits_purchased INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video analyses table
CREATE TABLE IF NOT EXISTS video_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  credits_used INTEGER NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
  credits_amount INTEGER NOT NULL,
  description TEXT,
  analysis_id UUID REFERENCES video_analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for video files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-files', 'video-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Video analyses policies
CREATE POLICY "Users can view their own analyses" ON video_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON video_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view their own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- Functions

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to deduct credits and record transaction
CREATE OR REPLACE FUNCTION deduct_credits(
  user_id UUID,
  credits_to_deduct INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT) AS $$
DECLARE
  current_balance INTEGER;
  new_balance_val INTEGER;
BEGIN
  -- Get current balance
  SELECT credits_balance INTO current_balance
  FROM user_profiles
  WHERE id = user_id;
  
  -- Check if user exists
  IF current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found';
    RETURN;
  END IF;
  
  -- Check if user has enough credits
  IF current_balance < credits_to_deduct THEN
    RETURN QUERY SELECT false, current_balance, 'Insufficient credits';
    RETURN;
  END IF;
  
  -- Calculate new balance
  new_balance_val := current_balance - credits_to_deduct;
  
  -- Update user balance
  UPDATE user_profiles
  SET 
    credits_balance = new_balance_val,
    total_credits_used = total_credits_used + credits_to_deduct,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
  VALUES (user_id, 'usage', -credits_to_deduct, 'Video analysis');
  
  RETURN QUERY SELECT true, new_balance_val, 'Credits deducted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_credits(
  user_id UUID,
  credits_to_add INTEGER,
  transaction_description TEXT DEFAULT 'Credit purchase'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT) AS $$
DECLARE
  current_balance INTEGER;
  new_balance_val INTEGER;
BEGIN
  -- Get current balance
  SELECT credits_balance INTO current_balance
  FROM user_profiles
  WHERE id = user_id;
  
  -- Check if user exists
  IF current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found';
    RETURN;
  END IF;
  
  -- Calculate new balance
  new_balance_val := current_balance + credits_to_add;
  
  -- Update user balance
  UPDATE user_profiles
  SET 
    credits_balance = new_balance_val,
    total_credits_purchased = total_credits_purchased + credits_to_add,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
  VALUES (user_id, 'purchase', credits_to_add, transaction_description);
  
  RETURN QUERY SELECT true, new_balance_val, 'Credits added successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(user_id UUID)
RETURNS TABLE(
  total_analyses INTEGER,
  total_credits_used INTEGER,
  current_balance INTEGER,
  analyses_this_month INTEGER,
  credits_used_this_month INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(va.id)::INTEGER as total_analyses,
    up.total_credits_used,
    up.credits_balance as current_balance,
    COUNT(CASE WHEN va.created_at >= date_trunc('month', NOW()) THEN 1 END)::INTEGER as analyses_this_month,
    COALESCE(SUM(CASE WHEN va.created_at >= date_trunc('month', NOW()) THEN va.credits_used ELSE 0 END), 0)::INTEGER as credits_used_this_month
  FROM user_profiles up
  LEFT JOIN video_analyses va ON up.id = va.user_id
  WHERE up.id = get_user_analytics.user_id
  GROUP BY up.id, up.total_credits_used, up.credits_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage policies for video files
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'video-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'video-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'video-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ); 