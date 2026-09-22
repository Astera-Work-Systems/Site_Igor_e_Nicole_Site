/**
 * Configuração do Mercado Pago — integração Pix.
 *
 * Para integrar:
 *  1. Crie um arquivo .env.local na raiz do projeto
 *  2. Adicione:
 *     - VITE_MERCADO_PAGO_PUBLIC_KEY=sua_public_key
 *     - MERCADO_PAGO_ACCESS_TOKEN=seu_access_token (server-side only)
 *     - MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret (server-side only)
 *  3. No fluxo de checkout, substitua a função `simularCriacaoPix` por uma
 *    chamada à sua API route que cria a cobrança Pix via SDK do Mercado Pago.
 *  4. Configure o webhook no painel do Mercado Pago apontando para
 *     /api/webhook para receber `payment.updated`.
 */

export const mercadopagoPublicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || '';

export const isMercadoPagoConfigured = Boolean(mercadopagoPublicKey);

/**
 * Placeholder para a futura criação de cobrança Pix via API do Mercado Pago.
 * Quando integrado, esta função deve chamar a API route /api/checkout que
 * usa o SDK server-side para gerar o QR Code e o Pix Copia e Cola.
 *
 * Retorna uma Promise que simula a resposta da API após 1.5s.
 */
export async function simularCriacaoPix(
  valor: number,
  presenteTitulo: string,
): Promise<{
  pixCopiaCola: string;
  qrCodeBase64: string;
  pixId: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const pixId = `MP${Date.now()}${Math.floor(Math.random() * 10000)}`;

  // QR Code placeholder — um SVG simples renderizado como data URI
  const qrCodeBase64 = gerarQrCodePlaceholder(pixId);

  const pixCopiaCola = `00020126580014BR.GOV.BCB.PIX0136${pixId}5204000053039865802BR5919IGOR%20E%20NICOLE6009SAO%20PAULO62070503***6304${Math.floor(
    Math.random() * 10000,
  )
    .toString()
    .padStart(4, '0')}`;

  void valor;
  void presenteTitulo;

  return { pixCopiaCola, qrCodeBase64, pixId };
}

/**
 * Placeholder para o polling de confirmação de pagamento.
 * Quando integrado, esta função deve fazer polling no endpoint que verifica
 * o status do pagamento via webhook do Mercado Pago (payment.updated).
 *
 * Na simulação, aprova automaticamente após 8 segundos.
 */
export async function simularConfirmacaoPix(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 8000));
  return true;
}

function gerarQrCodePlaceholder(seed: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="white"/>
    <g fill="#2C2A29">
      <rect x="10" y="10" width="50" height="50"/>
      <rect x="140" y="10" width="50" height="50"/>
      <rect x="10" y="140" width="50" height="50"/>
      <rect x="20" y="20" width="30" height="30" fill="white"/>
      <rect x="150" y="20" width="30" height="30" fill="white"/>
      <rect x="20" y="150" width="30" height="30" fill="white"/>
      <rect x="28" y="28" width="14" height="14" fill="#2C2A29"/>
      <rect x="158" y="28" width="14" height="14" fill="#2C2A29"/>
      <rect x="28" y="158" width="14" height="14" fill="#2C2A29"/>
      <rect x="70" y="10" width="10" height="10"/>
      <rect x="90" y="10" width="10" height="10"/>
      <rect x="110" y="10" width="10" height="10"/>
      <rect x="70" y="30" width="10" height="10"/>
      <rect x="100" y="30" width="10" height="10"/>
      <rect x="120" y="30" width="10" height="10"/>
      <rect x="80" y="50" width="10" height="10"/>
      <rect x="110" y="50" width="10" height="10"/>
      <rect x="130" y="50" width="10" height="10"/>
      <rect x="70" y="70" width="10" height="10"/>
      <rect x="90" y="70" width="10" height="10"/>
      <rect x="120" y="70" width="10" height="10"/>
      <rect x="140" y="70" width="10" height="10"/>
      <rect x="80" y="90" width="10" height="10"/>
      <rect x="100" y="90" width="10" height="10"/>
      <rect x="130" y="90" width="10" height="10"/>
      <rect x="70" y="110" width="10" height="10"/>
      <rect x="90" y="110" width="10" height="10"/>
      <rect x="110" y="110" width="10" height="10"/>
      <rect x="140" y="110" width="10" height="10"/>
      <rect x="80" y="130" width="10" height="10"/>
      <rect x="100" y="130" width="10" height="10"/>
      <rect x="120" y="130" width="10" height="10"/>
      <rect x="140" y="130" width="10" height="10"/>
      <rect x="80" y="150" width="10" height="10"/>
      <rect x="110" y="150" width="10" height="10"/>
      <rect x="130" y="150" width="10" height="10"/>
      <rect x="90" y="170" width="10" height="10"/>
      <rect x="110" y="170" width="10" height="10"/>
      <rect x="130" y="170" width="10" height="10"/>
      <rect x="150" y="170" width="10" height="10"/>
    </g>
  </svg>`;
  void seed;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
