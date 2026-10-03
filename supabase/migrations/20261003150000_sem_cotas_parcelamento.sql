/*
# Sem cotas nem vaquinha; parcelamento no cartão

Decisão dos noivos (03/10/2026): cada convidado dá o presente inteiro. Os presentes de valor
mais alto podem ser parcelados no cartão (sem juros para o convidado).

## O que muda
1. Presentes em `cotas` viram `inteiro` com o valor total (valor da cota × nº de cotas) e 1 unidade.
   Presentes em `livre` viram `inteiro` com a meta como valor e 1 unidade.
   A partir de agora só existe o modo `inteiro`.
2. A categoria "Cotas Grandes" deixa de existir: os presentes dela vão para "Eletrodomésticos".
3. `configuracoes.max_parcelas` (padrão 12x; 1 = só à vista), editável no painel.
4. `contribuicoes.parcelas` e `contribuicoes.asaas_installment_id` registram o parcelamento.
*/

UPDATE presentes
SET valor = valor * quantidade_total, quantidade_total = 1, modo = 'inteiro'
WHERE modo = 'cotas';

UPDATE presentes
SET quantidade_total = 1, valor_minimo = NULL, modo = 'inteiro'
WHERE modo = 'livre';

ALTER TABLE presentes DROP CONSTRAINT IF EXISTS presentes_modo_check;
ALTER TABLE presentes ADD CONSTRAINT presentes_modo_check CHECK (modo = 'inteiro');

UPDATE presentes SET categoria = 'Eletrodomésticos' WHERE categoria = 'Cotas Grandes';

ALTER TABLE configuracoes
  ADD COLUMN IF NOT EXISTS max_parcelas integer NOT NULL DEFAULT 12
  CHECK (max_parcelas BETWEEN 1 AND 12);

ALTER TABLE contribuicoes
  ADD COLUMN IF NOT EXISTS parcelas integer NOT NULL DEFAULT 1 CHECK (parcelas BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS asaas_installment_id text;
