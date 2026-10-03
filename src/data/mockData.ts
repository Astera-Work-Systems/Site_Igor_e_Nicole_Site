import type { Presente, Recado } from '@/types';

export const EVENT_DATE = new Date('2027-04-10T18:00:00-03:00');

// Textos derivados de EVENT_DATE: para mudar a data do evento, altere só a linha acima.
const formatarEvento = (opcoes: Intl.DateTimeFormatOptions) =>
  EVENT_DATE.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', ...opcoes });
const mesEvento = formatarEvento({ month: 'long' });

/** Ex.: "10 de Abril de 2027" */
export const EVENT_DATA_TEXTO = `${formatarEvento({ day: 'numeric' })} de ${
  mesEvento.charAt(0).toUpperCase() + mesEvento.slice(1)
} de ${formatarEvento({ year: 'numeric' })}`;
/** Ex.: "18h00" */
export const EVENT_HORA_TEXTO = formatarEvento({ hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'h');

export const NOIVOS_WHATSAPP = '5563984609954';

export const ASTERA_INFO = {
  telefone: '+55 63 98138-0291',
  telefoneRaw: '5563981380291',
  email: 'asteraworksystems@gmail.com',
};

export const EVENT_LOCATION = {
  nome: 'Gurupi — Tocantins, Brasil',
  mapsUrl: 'https://share.google/qSgqeEO0fzSpsXfJs',
  wazeUrl: 'https://waze.com/ul?q=Gurupi%20Tocantins%20Brasil',
};

/** Ordem em que aparecem no painel e nos filtros da vitrine. Para criar outra, é só incluir aqui. */
export const CATEGORIAS = [
  'Cozinha',
  'Eletrodomésticos',
  'Eletroportáteis',
  'Mesa Posta',
  'Cama & Banho',
  'Sala & Decoração',
  'Limpeza & Lavanderia',
  'Organização',
  'Eletrônicos',
  'Ferramentas & Utilidades',
  'Lua de Mel',
  'Outros',
];

/** Usado só quando o Supabase ainda não está configurado (modo demonstração). */
export const mockPresentes: Presente[] = [
  {
    id: 'p1',
    titulo: 'Jogo de Panelas Antiaderente 7 Peças',
    categoria: 'Cozinha',
    imagem_url: 'https://images.pexels.com/photos/16927367/pexels-photo-16927367.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 299.90,
    quantidade_total: 1,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 1,
  },
  {
    id: 'p2',
    titulo: 'Cafeteira Espresso Automática',
    categoria: 'Cozinha',
    imagem_url: 'https://images.pexels.com/photos/32103303/pexels-photo-32103303.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 549.00,
    quantidade_total: 1,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p3',
    titulo: 'Liquidificador Industrial 3L',
    categoria: 'Eletrodomésticos',
    imagem_url: 'https://images.pexels.com/photos/35443238/pexels-photo-35443238.png?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 189.90,
    quantidade_total: 1,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p4',
    titulo: 'Jogo de Pratos Cerâmica 24 Peças',
    categoria: 'Mesa Posta',
    imagem_url: 'https://images.pexels.com/photos/9440473/pexels-photo-9440473.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 159.90,
    quantidade_total: 2,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p5',
    titulo: 'Jogo de Taças de Cristal 6 Peças',
    categoria: 'Mesa Posta',
    imagem_url: 'https://images.pexels.com/photos/28937080/pexels-photo-28937080.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 89.90,
    quantidade_total: 2,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 1,
  },
  {
    id: 'p6',
    titulo: 'Jogo de Cama King 300 Fios',
    categoria: 'Cama & Banho',
    imagem_url: 'https://images.pexels.com/photos/16951262/pexels-photo-16951262.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 249.90,
    quantidade_total: 2,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p7',
    titulo: 'Geladeira Frost Free',
    categoria: 'Eletrodomésticos',
    imagem_url: 'https://images.pexels.com/photos/36573009/pexels-photo-36573009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 4500.00,
    quantidade_total: 1,
    permite_pessoalmente: false,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p8',
    titulo: 'Faqueiro Inox 24 Peças',
    categoria: 'Mesa Posta',
    imagem_url: 'https://images.pexels.com/photos/18273385/pexels-photo-18273385.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 129.90,
    quantidade_total: 1,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p9',
    titulo: 'Fogão 5 Bocas',
    categoria: 'Eletrodomésticos',
    imagem_url: 'https://images.pexels.com/photos/14445303/pexels-photo-14445303.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 1800.00,
    quantidade_total: 1,
    permite_pessoalmente: false,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p10',
    titulo: 'Panela de Pressão Elétrica',
    categoria: 'Cozinha',
    imagem_url: 'https://images.pexels.com/photos/36552082/pexels-photo-36552082.png?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 199.90,
    quantidade_total: 1,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 0,
  },
  {
    id: 'p11',
    titulo: 'Kit Aquecedor de Almoço',
    categoria: 'Cozinha',
    imagem_url: 'https://images.pexels.com/photos/7736770/pexels-photo-7736770.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 49.90,
    quantidade_total: 3,
    permite_pessoalmente: true,
    ativo: true,
    quantidade_ocupada: 2,
  },
  {
    id: 'p12',
    titulo: 'Lavadora de Roupas',
    categoria: 'Eletrodomésticos',
    imagem_url: 'https://images.pexels.com/photos/38609262/pexels-photo-38609262.png?auto=compress&cs=tinysrgb&h=650&w=940',
    valor: 2800.00,
    quantidade_total: 1,
    permite_pessoalmente: false,
    ativo: true,
    quantidade_ocupada: 0,
  },
];

export const mockRecados: Recado[] = [
  {
    id: 'r1',
    nome_convidado: 'Mariana Costa',
    mensagem: 'Que a felicidade de vocês seja eterna! Mal posso esperar pelo grande dia!',
    presente_titulo: 'Cafeteira Espresso Automática',
    created_at: '2026-09-10T14:30:00-03:00',
  },
  {
    id: 'r2',
    nome_convidado: 'Pedro Henrique',
    mensagem: 'Vocês merecem todo amor do mundo. Abençoo essa nova fase com muito carinho!',
    presente_titulo: 'Jogo de Panelas Antiaderente 7 Peças',
    created_at: '2026-09-08T10:15:00-03:00',
  },
  {
    id: 'r3',
    nome_convidado: 'Juliana Mendes',
    mensagem: 'Que o lar de vocês seja sempre cheio de amor, risadas e café fresquinho!',
    presente_titulo: 'Jogo de Pratos Cerâmica 24 Peças',
    created_at: '2026-09-05T16:45:00-03:00',
  },
  {
    id: 'r4',
    nome_convidado: 'Carlos Eduardo',
    mensagem: 'Felicidades ao casal! Que venham muitos anos de pura alegria juntos.',
    presente_titulo: 'Geladeira Frost Free',
    created_at: '2026-09-01T09:20:00-03:00',
  },
  {
    id: 'r5',
    nome_convidado: 'Fernanda Lima',
    mensagem: 'Vocês são um casal lindo! Que a vida abençoe cada dia de vocês. Amo muito!',
    presente_titulo: 'Jogo de Taças de Cristal 6 Peças',
    created_at: '2026-08-28T19:00:00-03:00',
  },
  {
    id: 'r6',
    nome_convidado: 'Ricardo Alves',
    mensagem: 'Toda felicidade do mundo para vocês! Foi uma honra acompanhar essa jornada.',
    presente_titulo: 'Liquidificador Industrial 3L',
    created_at: '2026-08-25T11:30:00-03:00',
  },
];

export const faqItems = [
  {
    pergunta: 'Como funciona a lista de presentes?',
    resposta:
      'Você escolhe um item na vitrine e presenteia pelo site com Pix ou cartão. Os presentes de valor mais alto (como a geladeira) podem ser parcelados no cartão. Tudo que já foi dado sai da lista automaticamente, para não ter presente repetido.',
  },
  {
    pergunta: 'Posso comprar o presente e levar pessoalmente?',
    resposta:
      'Pode sim, nos presentes marcados com "Pode dar pessoalmente". Mas é muito importante: clique em "Presentear" e escolha "Vou dar pessoalmente". Assim o presente sai da lista e ninguém compra o mesmo item. Se você não marcar no site, não temos como saber e o presente pode acabar repetido.',
  },
  {
    pergunta: 'Como funciona o sorteio dos brindes?',
    resposta:
      `A cada R$ 50,00 em presentes pagos pelo site, você ganha 1 número da sorte automaticamente. Por exemplo: se você presenteia com R$ 150,00, recebe 3 números. O sorteio acontece presencialmente no dia do Chá de Panela, em ${EVENT_DATA_TEXTO}.`,
  },
  {
    pergunta: 'Como faço o pagamento?',
    resposta:
      'Ao clicar em "Presentear" você preenche seus dados e escolhe Pix ou cartão de crédito. No Pix, um QR Code é gerado na hora; no cartão, abrimos a página segura de pagamento do Asaas. O CPF é pedido porque o Asaas exige para emitir o pagamento. A confirmação é automática!',
  },
  {
    pergunta: 'Posso escolher mais de um presente?',
    resposta:
      'Claro! Você pode presentear com quantos itens quiser. Cada presente gera seus próprios números da sorte, e todos se acumulam para o sorteio presencial.',
  },
  {
    pergunta: 'O que acontece depois que eu pago?',
    resposta:
      'Assim que o pagamento é confirmado, seus números da sorte aparecem na tela. Você também pode enviar uma mensagem de bênção direto para o WhatsApp do noivo com um clique, usando uma mensagem já formatada.',
  },
  {
    pergunta: 'Preciso levar algo no dia do evento?',
    resposta:
      'Se você presenteou pelo site, não! Venha com seu coração aberto para celebrar conosco. Se você marcou "Vou dar pessoalmente", é só levar o presente no dia. O sorteio dos brindes acontece presencialmente.',
  },
];
