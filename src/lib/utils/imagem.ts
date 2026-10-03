/**
 * Compacta uma foto no próprio navegador antes do upload.
 *
 * Redimensiona para no máximo LADO_MAXIMO px (o maior card da vitrine nem chega nisso)
 * e converte para WebP, baixando a qualidade até caber em TAMANHO_ALVO.
 * Uma foto de celular de 3–5 MB costuma virar 30–100 KB.
 */

const LADO_MAXIMO = 800;
const TAMANHO_ALVO = 120 * 1024;
const QUALIDADES = [0.8, 0.7, 0.6, 0.5, 0.4];

export interface ImagemCompactada {
  blob: Blob;
  extensao: 'webp' | 'jpg';
}

function carregarImagem(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler essa imagem. Tente uma foto JPG, PNG ou WebP.'));
    };
    img.src = url;
  });
}

function gerarBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

export async function compactarImagem(arquivo: File): Promise<ImagemCompactada> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.');

  const img = await carregarImagem(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * escala);
  canvas.height = Math.round(img.naturalHeight * escala);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
  // Fundo branco: PNG transparente convertido para JPG ficaria preto.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Navegadores sem WebP devolvem PNG no toBlob; nesse caso usa JPG.
  const teste = await gerarBlob(canvas, 'image/webp', 0.8);
  const usarWebp = teste?.type === 'image/webp';
  const tipo = usarWebp ? 'image/webp' : 'image/jpeg';

  let melhor: Blob | null = null;
  for (const q of QUALIDADES) {
    const blob = await gerarBlob(canvas, tipo, q);
    if (!blob) continue;
    melhor = blob;
    if (blob.size <= TAMANHO_ALVO) break;
  }
  if (!melhor) throw new Error('Não foi possível compactar a imagem.');

  return { blob: melhor, extensao: usarWebp ? 'webp' : 'jpg' };
}
