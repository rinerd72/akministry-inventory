-- ============================================================
-- Ministry Inventory System — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  building TEXT,
  floor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STORAGE BINS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.storage_bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, location_id)
);

-- ============================================================
-- ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  storage_bin_id UUID REFERENCES public.storage_bins(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'each',
  qr_code TEXT UNIQUE,
  image_url TEXT,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CHECKOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  checked_out_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  purpose TEXT,
  expected_return TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER storage_bins_updated_at BEFORE UPDATE ON public.storage_bins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER checkouts_updated_at BEFORE UPDATE ON public.checkouts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Auto-create profile on auth.users INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: Decrement quantity on checkout
-- ============================================================
CREATE OR REPLACE FUNCTION checkout_decrement_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify enough stock
  IF (SELECT quantity FROM public.items WHERE id = NEW.item_id) < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;
  UPDATE public.items SET quantity = quantity - NEW.quantity WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_checkout_insert
  AFTER INSERT ON public.checkouts
  FOR EACH ROW
  EXECUTE FUNCTION checkout_decrement_quantity();

-- ============================================================
-- TRIGGER: Increment quantity on check-in
-- ============================================================
CREATE OR REPLACE FUNCTION checkin_increment_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.checked_in_at IS NULL AND NEW.checked_in_at IS NOT NULL THEN
    UPDATE public.items SET quantity = quantity + OLD.quantity WHERE id = OLD.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_checkout_checkin
  AFTER UPDATE ON public.checkouts
  FOR EACH ROW
  EXECUTE FUNCTION checkin_increment_quantity();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view all active profiles" ON public.profiles FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = OLD.role);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');

-- CATEGORIES policies
CREATE POLICY "All auth users can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- LOCATIONS policies
CREATE POLICY "All auth users can view locations" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage locations" ON public.locations FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- STORAGE_BINS policies
CREATE POLICY "All auth users can view bins" ON public.storage_bins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage bins" ON public.storage_bins FOR ALL TO authenticated USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- ITEMS policies
CREATE POLICY "All auth users can view items" ON public.items FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Users can insert/update items" ON public.items FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'user'));
CREATE POLICY "Users can update items" ON public.items FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'user'));
CREATE POLICY "Only admins can soft delete" ON public.items FOR UPDATE TO authenticated USING (get_my_role() = 'admin' OR deleted_at IS NULL);

-- CHECKOUTS policies
CREATE POLICY "Admins see all checkouts" ON public.checkouts FOR SELECT TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "Users see own checkouts" ON public.checkouts FOR SELECT TO authenticated USING (get_my_role() != 'admin' AND checked_out_by = auth.uid());
CREATE POLICY "Users can create checkouts" ON public.checkouts FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'user') AND checked_out_by = auth.uid());
CREATE POLICY "Users can update own checkouts for checkin" ON public.checkouts FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'user'));

-- AUDIT_LOGS policies (read admin, write system/triggers)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET for item images
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read item images" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
CREATE POLICY "Auth users can upload item images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'item-images');
CREATE POLICY "Auth users can update item images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'item-images');

-- ============================================================
-- INITIAL SEED DATA (optional)
-- ============================================================
INSERT INTO public.categories (name, color) VALUES
  ('Craft Supplies', '#f59e0b'),
  ('Books & Bibles', '#3b82f6'),
  ('Games & Toys', '#10b981'),
  ('Audio/Visual', '#8b5cf6'),
  ('Furniture', '#6b7280'),
  ('Snacks & Food', '#ef4444')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.locations (name, building, floor) VALUES
  ('Main Classroom', 'Building A', '1'),
  ('Storage Room', 'Building A', 'B'),
  ('Nursery', 'Building B', '1'),
  ('Youth Room', 'Building C', '2')
ON CONFLICT (name) DO NOTHING;
