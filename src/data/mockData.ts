import type { Presente } from '@/types';

export const EVENT_DATE = new Date('2027-04-11T17:00:00-03:00');

// Textos derivados de EVENT_DATE: para mudar a data do evento, altere só a linha acima.
const formatarEvento = (opcoes: Intl.DateTimeFormatOptions) =>
  EVENT_DATE.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', ...opcoes });
const mesEvento = formatarEvento({ month: 'long' });

/** Ex.: "11 de Abril de 2027" */
export const EVENT_DATA_TEXTO = `${formatarEvento({ day: 'numeric' })} de ${
  mesEvento.charAt(0).toUpperCase() + mesEvento.slice(1)
} de ${formatarEvento({ year: 'numeric' })}`;
/** Ex.: "17h00" */
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

export const faqItems = [
  {
    pergunta: 'Como funciona a lista de presentes?',
    resposta:
      'Você escolhe um item na vitrine e presenteia pelo site com Pix ou cartão. Os presentes de valor mais alto (como a geladeira) podem ser parcelados no cartão. Tudo que já foi dado sai da lista automaticamente, para não ter presente repetido.',
  },
  {
    pergunta: 'Posso comprar o presente e entregar pessoalmente?',
    resposta:
      'Pode sim! A lista é só uma sugestão: você pode presentear pelo site ou comprar onde preferir e entregar pessoalmente. Se for um presente da lista marcado com "Pode entregar pessoalmente", clique em "Presentear" e escolha "Vou entregar pessoalmente". Assim o presente sai da lista e ninguém compra o mesmo item.',
  },
  {
    pergunta: 'Como faço o pagamento?',
    resposta:
      'Ao clicar em "Presentear" você preenche seus dados e escolhe Pix ou cartão de crédito. No Pix, um QR Code é gerado na hora; no cartão, abrimos a página segura de pagamento do Asaas. O CPF é pedido porque o Asaas exige para emitir o pagamento. A confirmação é automática!',
  },
  {
    pergunta: 'Posso escolher mais de um presente?',
    resposta:
      'Claro! Você pode presentear com quantos itens quiser.',
  },
  {
    pergunta: 'O que acontece depois que eu pago?',
    resposta:
      'Assim que o pagamento é confirmado, a confirmação aparece na tela. Você também pode enviar uma mensagem de bênção direto para o WhatsApp do noivo com um clique, usando uma mensagem já formatada.',
  },
];
