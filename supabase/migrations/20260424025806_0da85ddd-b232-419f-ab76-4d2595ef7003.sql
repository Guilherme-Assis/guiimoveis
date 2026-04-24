-- Create mobile_devices table
CREATE TABLE public.mobile_devices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    apns_device_token TEXT NOT NULL,
    platform TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, apns_device_token)
);

-- Create mobile_live_activities table
CREATE TABLE public.mobile_live_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL UNIQUE,
    live_activity_push_token TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_live_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mobile_devices
CREATE POLICY "Users can view their own devices"
    ON public.mobile_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
    ON public.mobile_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
    ON public.mobile_devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
    ON public.mobile_devices FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for mobile_live_activities
CREATE POLICY "Users can view their own live activities"
    ON public.mobile_live_activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own live activities"
    ON public.mobile_live_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own live activities"
    ON public.mobile_live_activities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own live activities"
    ON public.mobile_live_activities FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mobile_devices_updated_at
    BEFORE UPDATE ON public.mobile_devices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_mobile_live_activities_updated_at
    BEFORE UPDATE ON public.mobile_live_activities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX idx_mobile_devices_user_id ON public.mobile_devices(user_id);
CREATE INDEX idx_mobile_live_activities_user_id ON public.mobile_live_activities(user_id);
CREATE INDEX idx_mobile_live_activities_activity_id ON public.mobile_live_activities(activity_id);