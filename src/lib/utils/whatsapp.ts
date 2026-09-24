import { NOIVOS_WHATSAPP } from '@/data/mockData';

/**
 * Gera o link do WhatsApp do noivo com mensagem pré-formatada.
 */
export function gerarLinkWhatsApp(
  nomeItem: string,
  mensagem: string,
  cupons: string[],
  pessoalmente = false,
): string {
  const acao = pessoalmente
    ? `Reservei no site o presente *${nomeItem}* e vou entregar pessoalmente!`
    : `Acabei de abençoar vocês no site com o presente *${nomeItem}*!`;
  const numeros = cupons.length
    ? ` Meus números da sorte para o Chá de Panela são *${cupons.join(', ')}*.`
    : '';
  const texto = `Oi, Igor! ${acao} Deixei a seguinte mensagem: '${mensagem}'.${numeros} Ansioso pelo nosso encontro! ❤️`;

  return `https://wa.me/${NOIVOS_WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

/** Link para os noivos falarem com um convidado pelo painel. */
export function linkWhatsAppConvidado(numero: string): string {
  const digitos = numero.replace(/\D/g, '');
  return `https://wa.me/${digitos.startsWith('55') ? digitos : `55${digitos}`}`;
}
