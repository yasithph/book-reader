-- Migration: Add push notification subscriptions
-- Description: Stores user push notification subscriptions for Web Push API

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Push subscription data (from PushSubscription.toJSON())
    endpoint TEXT NOT NULL,
    keys_p256dh TEXT NOT NULL,
    keys_auth TEXT NOT NULL,

    -- User preferences
    notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,

    -- Metadata
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ,

    -- Unique constraint: one subscription per endpoint
    UNIQUE(endpoint)
);

-- Index for faster user lookups
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_enabled ON public.push_subscriptions(user_id, notifications_enabled);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
    ON public.push_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
    ON public.push_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
    ON public.push_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
    ON public.push_subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can view all subscriptions (for sending notifications)
CREATE POLICY "Admins can view all push subscriptions"
    ON public.push_subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Comment on table
COMMENT ON TABLE public.push_subscriptions IS 'Stores Web Push API subscriptions for sending push notifications to users';
