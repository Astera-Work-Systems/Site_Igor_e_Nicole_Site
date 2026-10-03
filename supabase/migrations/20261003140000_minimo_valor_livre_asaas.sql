/*
# Valor livre: mínimo de R$ 5,00

O Asaas não emite cobrança (Pix ou cartão) abaixo de R$ 5,00. Com o mínimo de R$ 0,01
(migração 20261003130000), o convidado podia escolher um valor menor e recebia
"Não conseguimos gerar o pagamento agora". Os presentes livres com mínimo abaixo de
R$ 5,00 (ou sem mínimo) passam para R$ 5,00.
*/

UPDATE presentes
SET valor_minimo = 5
WHERE modo = 'livre' AND (valor_minimo IS NULL OR valor_minimo < 5);
