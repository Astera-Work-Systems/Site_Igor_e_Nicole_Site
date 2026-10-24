import { z } from 'npm:zod@3.25.76';

/**
 * Formato aceito de cada entrada, conferido antes de qualquer acesso ao banco ou ao Asaas.
 * As regras de negócio com mensagem amigável (nome, WhatsApp, CPF...) continuam em cada função;
 * aqui ficam tipo, tamanho máximo e campos desconhecidos (recusados com .strict()).
 */

const uuid = z.string().uuid();
const texto = (max: number) => z.string().max(max);

export const EntradaContribuicao = z
  .object({
    presente_id: uuid,
    tipo: z.enum(['site', 'pessoalmente']),
    forma_pagamento: z.enum(['pix', 'cartao']).nullish(),
    quantidade: z.number().int().min(1).max(100).nullish(),
    /** Só no cartão; 1 = à vista. */
    parcelas: z.number().int().min(1).max(24).nullish(),
    nome: texto(200),
    whatsapp: texto(40),
    cpf: texto(20).nullish(),
    mensagem: texto(2000).nullish(),
  })
  .strict();

export const EntradaStatus = z.object({ id: uuid }).strict();

export const EntradaRecado = z.object({ nome: texto(200), mensagem: texto(2000) }).strict();

/** Lê o corpo JSON e valida. Devolve null se o corpo não for JSON ou não bater com o formato. */
export async function lerEntrada<T>(req: Request, schema: z.ZodType<T>): Promise<T | null> {
  const corpo = await req.json().catch(() => undefined);
  const r = schema.safeParse(corpo);
  return r.success ? r.data : null;
}
