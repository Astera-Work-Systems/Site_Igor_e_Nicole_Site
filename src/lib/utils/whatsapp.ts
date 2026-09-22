import { NOIVOS_WHATSAPP } from '@/data/mockData';

/**
 * Gera o link do WhatsApp do noivo com mensagem pré-formatada.
 *
 * Formato do PRD:
 * "Oi, Igor! Acabei de abençoar vocês no site com o presente [Nome do Item]!
 *  Deixei a seguinte mensagem: '[Texto da Mensagem]'.
 *  Meus números da sorte para o Chá de Panela são [Cupons].
 *  Ansioso pelo nosso encontro! ❤️"
 */
export function gerarLinkWhatsApp(
  nomeItem: string,
  mensagem: string,
  cupons: string[],
): string {
  const texto = `Oi, Igor! Acabei de abençoar vocês no site com o presente *${nomeItem}*! Deixei a seguinte mensagem: '${mensagem}'. Meus números da sorte para o Chá de Panela são *${cupons.join(', ')}*. Ansioso pelo nosso encontro! ❤️`;

  const encoded = encodeURIComponent(texto);
  return `https://wa.me/${NOIVOS_WHATSAPP}?text=${encoded}`;
}
