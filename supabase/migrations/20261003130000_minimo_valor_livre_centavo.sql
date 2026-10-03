/*
# Valor livre: mínimo de 1 centavo

Presentes de valor livre sem mínimo definido usavam R$ 1,00 como padrão.
Agora o painel grava R$ 0,01 quando o campo fica vazio; aqui os antigos são ajustados igual.
Quem definiu um mínimo próprio no painel não é afetado.
*/

UPDATE presentes
SET valor_minimo = 0.01
WHERE modo = 'livre' AND valor_minimo IS NULL;
