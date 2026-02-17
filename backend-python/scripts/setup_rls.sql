-- RLS (Row Level Security) Policies Setup
-- Run this script in Supabase SQL Editor after migrations

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE models_3d ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own record" ON users
FOR SELECT TO authenticated
USING (clerk_user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Admins can view all users" ON users
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
        AND role = 'admin'
    )
);

-- Restaurants table policies
CREATE POLICY "Users can view own restaurants" ON restaurants
FOR SELECT TO authenticated
USING (
    owner_id IN (
        SELECT id FROM users WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
    )
);

CREATE POLICY "Users can update own restaurants" ON restaurants
FOR UPDATE TO authenticated
USING (
    owner_id IN (
        SELECT id FROM users WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
    )
);

CREATE POLICY "Admins can view all restaurants" ON restaurants
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can update all restaurants" ON restaurants
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
        AND role = 'admin'
    )
);

-- Onboardings table policies
CREATE POLICY "Users can view own onboarding" ON restaurant_onboardings
FOR SELECT TO authenticated
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r
        INNER JOIN users u ON r.owner_id = u.id
        WHERE u.clerk_user_id = (SELECT auth.jwt()->>'sub')
    )
);

CREATE POLICY "Admins can view all onboardings" ON restaurant_onboardings
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
        AND role = 'admin'
    )
);

-- Subscriptions table policies
CREATE POLICY "Users can view own subscription" ON subscriptions
FOR SELECT TO authenticated
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r
        INNER JOIN users u ON r.owner_id = u.id
        WHERE u.clerk_user_id = (SELECT auth.jwt()->>'sub')
    )
);

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE clerk_user_id = (SELECT auth.jwt()->>'sub')
        AND role = 'admin'
    )
);

-- Models3D table policies
CREATE POLICY "Users can manage own models" ON models_3d
FOR ALL TO authenticated
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r
        INNER JOIN users u ON r.owner_id = u.id
        WHERE u.clerk_user_id = (SELECT auth.jwt()->>'sub')
    )
);

-- Products table policies
CREATE POLICY "Users can manage own products" ON products
FOR ALL TO authenticated
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r
        INNER JOIN users u ON r.owner_id = u.id
        WHERE u.clerk_user_id = (SELECT auth.jwt()->>'sub')
    )
);

CREATE POLICY "Public can view menu products" ON products
FOR SELECT TO anon
USING (show_in_menu = true AND active = true);

-- Assets table policies
CREATE POLICY "Users can manage own assets" ON assets
FOR ALL TO authenticated
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r
        INNER JOIN users u ON r.owner_id = u.id
        WHERE u.clerk_user_id = (SELECT auth.jwt()->>'sub')
    )
);
