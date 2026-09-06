-- Migration: Marketing and Social Media Management Module
-- Description: Promotional campaigns, procedure offers/coupons, and editorial calendar for social media
-- Requirements: 3.1

-- 1. Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  objective     TEXT NOT NULL DEFAULT 'leads' CHECK (objective IN ('leads', 'brand_awareness', 'procedure_promotion', 'retention')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE,
  budget        NUMERIC(10,2) DEFAULT 0,
  actual_spend  NUMERIC(10,2) DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);

-- 2. Marketing Offers & Coupons
CREATE TABLE IF NOT EXISTS marketing_offers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  procedure_id      UUID REFERENCES procedures(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  promo_code        TEXT UNIQUE,
  discount_type     TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value    NUMERIC(10,2) NOT NULL,
  start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date          DATE,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  redemptions_count INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_code ON marketing_offers(promo_code);

-- 3. Social Media Editorial Calendar
CREATE TABLE IF NOT EXISTS social_media_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  platforms     TEXT[] NOT NULL DEFAULT ARRAY['instagram'],
  content_copy  TEXT NOT NULL,
  media_url     TEXT,
  scheduled_for TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_media_posts(scheduled_for);

-- 4. Enable RLS and Policies
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_campaigns_all" ON marketing_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "marketing_offers_all" ON marketing_offers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "social_media_posts_all" ON social_media_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Seed Default Campaign and Offers
INSERT INTO marketing_campaigns (name, description, objective, budget, status) VALUES
('Campaña Sonrisa Saludable 2026', 'Captación de nuevos pacientes para profilaxis y blanqueamiento dental', 'leads', 25000, 'active');

INSERT INTO marketing_offers (title, promo_code, discount_type, discount_value, is_active) VALUES
('25% de Descuento en Blanqueamiento Dental', 'SONRISA25', 'percentage', 25, true),
('Consulta de Diagnóstico y Radiografía Inicial Gratis', 'PRIMERACONSULTA', 'percentage', 100, true);
