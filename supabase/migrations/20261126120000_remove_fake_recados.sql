DELETE FROM recados
WHERE (nome_convidado, mensagem, presente_titulo, created_at) IN (
  (
    'Mariana Costa',
    'Que a felicidade de vocês seja eterna! Mal posso esperar pelo grande dia!',
    'Cafeteira Espresso Automática',
    '2026-09-10T14:30:00-03:00'::timestamptz
  ),
  (
    'Pedro Henrique',
    'Vocês merecem todo amor do mundo. Abençoo essa nova fase com muito carinho!',
    'Jogo de Panelas Antiaderente 7 Peças',
    '2026-09-08T10:15:00-03:00'::timestamptz
  ),
  (
    'Juliana Mendes',
    'Que o lar de vocês seja sempre cheio de amor, risadas e café fresquinho!',
    'Jogo de Pratos Cerâmica 24 Peças',
    '2026-09-05T16:45:00-03:00'::timestamptz
  ),
  (
    'Carlos Eduardo',
    'Felicidades ao casal! Que venham muitos anos de pura alegria juntos.',
    'Cota da Geladeira Frost Free',
    '2026-09-01T09:20:00-03:00'::timestamptz
  ),
  (
    'Fernanda Lima',
    'Vocês são um casal lindo! Que a vida abençoe cada dia de vocês. Amo muito!',
    'Jogo de Taças de Cristal 6 Peças',
    '2026-08-28T19:00:00-03:00'::timestamptz
  ),
  (
    'Ricardo Alves',
    'Toda felicidade do mundo para vocês! Foi uma honra acompanhar essa jornada.',
    'Liquidificador Industrial 3L',
    '2026-08-25T11:30:00-03:00'::timestamptz
  )
);
