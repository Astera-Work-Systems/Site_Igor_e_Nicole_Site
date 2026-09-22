/*
# Create Chá de Panela tables (single-tenant, no auth)

## Overview
Creates the database schema for the Igor & Nicole Chá de Panela (wedding shower) gift registry site.
The app has no sign-in screen, so all policies use `TO anon, authenticated` to allow
the anon-key frontend to read and write its own data.

## New Tables

1. `presentes` — Gift items displayed in the vitrine
   - `id` (uuid, PK)
   - `titulo` (text, not null) — gift name
   - `categoria` (text, not null) — category for filtering
   - `imagem_url` (text, not null) — product image URL
   - `valor` (numeric, not null) — price per cota
   - `quantidade_total` (int, not null, default 1) — total cotas available
   - `quantidade_comprada` (int, not null, default 0) — cotas sold
   - `ativo` (boolean, not null, default true) — visible in vitrine
   - `created_at` (timestamptz, default now)

2. `transacoes` — Payment transactions via Pix (Mercado Pago)
   - `id` (uuid, PK)
   - `presente_id` (uuid, FK → presentes) — which gift was purchased
   - `presente_titulo` (text) — denormalized gift title for display
   - `nome_convidado` (text, not null) — guest name
   - `whatsapp` (text, not null) — guest WhatsApp number
   - `mensagem` (text) — optional blessing message
   - `valor_pago` (numeric, not null) — amount paid
   - `status_pagamento` (text, not null, default 'pending') — pending/approved/rejected
   - `pix_id_mercadopago` (text) — Mercado Pago payment ID
   - `created_at` (timestamptz, default now)

3. `cupons_sorteio` — Raffle coupons generated per transaction
   - `id` (uuid, PK)
   - `transacao_id` (uuid, FK → transacoes) — which transaction generated this coupon
   - `nome_convidado` (text, not null) — guest name (denormalized)
   - `whatsapp` (text, not null) — guest WhatsApp (denormalized)
   - `numero_cupom` (int, not null) — raffle number
   - `created_at` (timestamptz, default now)

4. `recados` — Guest messages on the Mural de Recados
   - `id` (uuid, PK)
   - `nome_convidado` (text, not null) — guest name
   - `mensagem` (text, not null) — blessing message
   - `presente_titulo` (text) — associated gift title (optional)
   - `created_at` (timestamptz, default now)

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` (no sign-in screen in this app).
- SELECT: anyone can read (public vitrine, public mural).
- INSERT: anyone can insert (guests create transactions, coupons, recados).
- UPDATE: anyone can update (admin updates gift quantities after payment confirmation).
- DELETE: anyone can delete (admin removes gifts/recados).

## Notes
1. The app currently uses mock data. When Supabase credentials are configured in .env,
   the frontend client (src/lib/supabase/client.ts) will automatically connect.
2. Mercado Pago integration: the `transacoes` table stores the Pix payment ID and status.
   When MP webhooks are configured, an edge function should update `status_pagamento`
   and increment `quantidade_comprada` on the associated presente.
3. Coupon numbers (`numero_cupom`) should be assigned sequentially. The frontend
   calculates `Math.floor(valor / 50)` coupons per transaction.
*/

-- ==================== TABLE: presentes ====================
CREATE TABLE IF NOT EXISTS presentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL,
  imagem_url text NOT NULL,
  valor numeric(10, 2) NOT NULL,
  quantidade_total integer NOT NULL DEFAULT 1,
  quantidade_comprada integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE presentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_presentes" ON presentes;
CREATE POLICY "anon_select_presentes" ON presentes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_presentes" ON presentes;
CREATE POLICY "anon_insert_presentes" ON presentes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_presentes" ON presentes;
CREATE POLICY "anon_update_presentes" ON presentes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_presentes" ON presentes;
CREATE POLICY "anon_delete_presentes" ON presentes FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== TABLE: transacoes ====================
CREATE TABLE IF NOT EXISTS transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id uuid REFERENCES presentes(id) ON DELETE SET NULL,
  presente_titulo text,
  nome_convidado text NOT NULL,
  whatsapp text NOT NULL,
  mensagem text,
  valor_pago numeric(10, 2) NOT NULL,
  status_pagamento text NOT NULL DEFAULT 'pending',
  pix_id_mercadopago text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transacoes" ON transacoes;
CREATE POLICY "anon_select_transacoes" ON transacoes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transacoes" ON transacoes;
CREATE POLICY "anon_insert_transacoes" ON transacoes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transacoes" ON transacoes;
CREATE POLICY "anon_update_transacoes" ON transacoes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transacoes" ON transacoes;
CREATE POLICY "anon_delete_transacoes" ON transacoes FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== TABLE: cupons_sorteio ====================
CREATE TABLE IF NOT EXISTS cupons_sorteio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_id uuid REFERENCES transacoes(id) ON DELETE CASCADE,
  nome_convidado text NOT NULL,
  whatsapp text NOT NULL,
  numero_cupom integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cupons_sorteio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cupons" ON cupons_sorteio;
CREATE POLICY "anon_select_cupons" ON cupons_sorteio FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cupons" ON cupons_sorteio;
CREATE POLICY "anon_insert_cupons" ON cupons_sorteio FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cupons" ON cupons_sorteio;
CREATE POLICY "anon_update_cupons" ON cupons_sorteio FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cupons" ON cupons_sorteio;
CREATE POLICY "anon_delete_cupons" ON cupons_sorteio FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== TABLE: recados ====================
CREATE TABLE IF NOT EXISTS recados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_convidado text NOT NULL,
  mensagem text NOT NULL,
  presente_titulo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_recados" ON recados;
CREATE POLICY "anon_select_recados" ON recados FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_recados" ON recados;
CREATE POLICY "anon_insert_recados" ON recados FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_recados" ON recados;
CREATE POLICY "anon_update_recados" ON recados FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_recados" ON recados;
CREATE POLICY "anon_delete_recados" ON recados FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_presentes_categoria ON presentes(categoria);
CREATE INDEX IF NOT EXISTS idx_presentes_ativo ON presentes(ativo);
CREATE INDEX IF NOT EXISTS idx_transacoes_presente_id ON transacoes(presente_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_cupons_transacao_id ON cupons_sorteio(transacao_id);
CREATE INDEX IF NOT EXISTS idx_recados_created_at ON recados(created_at DESC);

-- ==================== SEED DATA ====================
INSERT INTO presentes (titulo, categoria, imagem_url, valor, quantidade_total, quantidade_comprada, ativo)
VALUES
  ('Jogo de Panelas Antiaderente 7 Peças', 'Cozinha', 'https://images.pexels.com/photos/16927367/pexels-photo-16927367.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 299.90, 3, 1, true),
  ('Cafeteira Espresso Automática', 'Cozinha', 'https://images.pexels.com/photos/32103303/pexels-photo-32103303.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 549.00, 2, 0, true),
  ('Liquidificador Industrial 3L', 'Eletrodomésticos', 'https://images.pexels.com/photos/35443238/pexels-photo-35443238.png?auto=compress&cs=tinysrgb&h=650&w=940', 189.90, 4, 2, true),
  ('Jogo de Pratos Cerâmica 24 Peças', 'Mesa Posta', 'https://images.pexels.com/photos/9440473/pexels-photo-9440473.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 159.90, 3, 0, true),
  ('Jogo de Taças de Cristal 6 Peças', 'Mesa Posta', 'https://images.pexels.com/photos/28937080/pexels-photo-28937080.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 89.90, 5, 3, true),
  ('Jogo de Cama King 300 Fios', 'Cama & Banho', 'https://images.pexels.com/photos/16951262/pexels-photo-16951262.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 249.90, 2, 0, true),
  ('Cota da Geladeira Frost Free', 'Cotas Grandes', 'https://images.pexels.com/photos/36573009/pexels-photo-36573009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 899.00, 5, 1, true),
  ('Faqueiro Inox 24 Peças', 'Mesa Posta', 'https://images.pexels.com/photos/18273385/pexels-photo-18273385.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 129.90, 3, 0, true),
  ('Cota do Fogão 5 Bocas', 'Cotas Grandes', 'https://images.pexels.com/photos/14445303/pexels-photo-14445303.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 799.00, 5, 2, true),
  ('Panela de Pressão Elétrica', 'Cozinha', 'https://images.pexels.com/photos/36552082/pexels-photo-36552082.png?auto=compress&cs=tinysrgb&h=650&w=940', 199.90, 3, 0, true),
  ('Kit Aquecedor de Almoço', 'Cozinha', 'https://images.pexels.com/photos/7736770/pexels-photo-7736770.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 49.90, 6, 4, true),
  ('Cota da Lavadora de Roupas', 'Cotas Grandes', 'https://images.pexels.com/photos/38609262/pexels-photo-38609262.png?auto=compress&cs=tinysrgb&h=650&w=940', 1299.00, 5, 0, true)
ON CONFLICT DO NOTHING;

-- Seed recados
INSERT INTO recados (nome_convidado, mensagem, presente_titulo, created_at)
VALUES
  ('Mariana Costa', 'Que a felicidade de vocês seja eterna! Mal posso esperar pelo grande dia!', 'Cafeteira Espresso Automática', '2026-09-10T14:30:00-03:00'),
  ('Pedro Henrique', 'Vocês merecem todo amor do mundo. Abençoo essa nova fase com muito carinho!', 'Jogo de Panelas Antiaderente 7 Peças', '2026-09-08T10:15:00-03:00'),
  ('Juliana Mendes', 'Que o lar de vocês seja sempre cheio de amor, risadas e café fresquinho!', 'Jogo de Pratos Cerâmica 24 Peças', '2026-09-05T16:45:00-03:00'),
  ('Carlos Eduardo', 'Felicidades ao casal! Que venham muitos anos de pura alegria juntos.', 'Cota da Geladeira Frost Free', '2026-09-01T09:20:00-03:00'),
  ('Fernanda Lima', 'Vocês são um casal lindo! Que a vida abençoe cada dia de vocês. Amo muito!', 'Jogo de Taças de Cristal 6 Peças', '2026-08-28T19:00:00-03:00'),
  ('Ricardo Alves', 'Toda felicidade do mundo para vocês! Foi uma honra acompanhar essa jornada.', 'Liquidificador Industrial 3L', '2026-08-25T11:30:00-03:00')
ON CONFLICT DO NOTHING;
