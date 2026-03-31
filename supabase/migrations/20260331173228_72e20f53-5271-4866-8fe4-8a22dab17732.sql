
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'broker');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create brokers table
CREATE TABLE public.brokers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  creci TEXT NOT NULL,
  company_name TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 5.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Create property status enum
CREATE TYPE public.property_availability AS ENUM ('available', 'unavailable');
CREATE TYPE public.property_type AS ENUM ('casa', 'apartamento', 'cobertura', 'terreno', 'fazenda', 'mansao');
CREATE TYPE public.property_status AS ENUM ('venda', 'aluguel', 'lancamento');

-- Create properties table
CREATE TABLE public.db_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type property_type NOT NULL DEFAULT 'casa',
  status property_status NOT NULL DEFAULT 'venda',
  availability property_availability NOT NULL DEFAULT 'available',
  price NUMERIC(15,2) NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'SP',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  parking_spaces INTEGER NOT NULL DEFAULT 0,
  area NUMERIC(12,2) NOT NULL DEFAULT 0,
  land_area NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  is_highlight BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.db_properties ENABLE ROW LEVEL SECURITY;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_db_properties_updated_at BEFORE UPDATE ON public.db_properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for brokers
CREATE POLICY "Anyone can view active brokers" ON public.brokers FOR SELECT USING (true);
CREATE POLICY "Admins can create brokers" ON public.brokers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can update own record" ON public.brokers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any broker" ON public.brokers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete brokers" ON public.brokers FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for db_properties
CREATE POLICY "Anyone can view available properties" ON public.db_properties FOR SELECT USING (true);
CREATE POLICY "Brokers can create properties" ON public.db_properties FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'broker') AND 
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can create any property" ON public.db_properties FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can update own properties" ON public.db_properties FOR UPDATE USING (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can update any property" ON public.db_properties FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can delete own properties" ON public.db_properties FOR DELETE USING (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can delete any property" ON public.db_properties FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
