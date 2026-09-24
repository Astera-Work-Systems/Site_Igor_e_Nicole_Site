import { criarCobranca, obterOuCriarCliente, obterPixQrCode } from '../_shared/asaas.ts';
import { cancelar, confirmar, db, listarCupons, type Contribuicao } from '../_shared/db.ts';
import { corsHeaders, erro, json } from '../_shared/http.ts';

interface Entrada {
  presente_id: string;
  tipo: 'site' | 'pessoalmente';
  forma_pagamento?: 'pix' | 'cartao';
  quantidade?: number;
  valor?: number;
  nome: string;
  whatsapp: string;
  cpf?: string;
  mensagem?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return erro('Método não permitido.', 405);

  let e: Entrada;
  try {
    e = await req.json();
  } catch {
    return erro('Requisição inválida.');
  }

  const nome = (e.nome ?? '').trim();
  const whatsapp = (e.whatsapp ?? '').replace(/\D/g, '');
  const cpf = (e.cpf ?? '').replace(/\D/g, '');
  const mensagem = (e.mensagem ?? '').trim();

  if (nome.length < 3 || nome.length > 80) return erro('Informe seu nome completo.');
  if (whatsapp.length < 10 || whatsapp.length > 13) return erro('Informe um WhatsApp válido com DDD.');
  if (mensagem.length > 500) return erro('A mensagem pode ter no máximo 500 caracteres.');
  if (e.tipo !== 'site' && e.tipo !== 'pessoalmente') return erro('Escolha como quer presentear.');
  if (e.tipo === 'site') {
    if (e.forma_pagamento !== 'pix' && e.forma_pagamento !== 'cartao') return erro('Escolha Pix ou cartão.');
    if (!cpfValido(cpf)) return erro('Informe um CPF válido (é exigido pelo Asaas para emitir o pagamento).');
  }

  const { data: reserva, error: erroReserva } = await db.rpc('reservar_contribuicao', {
    p_presente_id: e.presente_id,
    p_tipo: e.tipo,
    p_forma_pagamento: e.forma_pagamento ?? null,
    p_quantidade: e.quantidade ?? 1,
    p_valor: e.valor ?? null,
    p_nome: nome,
    p_whatsapp: whatsapp,
    p_mensagem: mensagem,
  });
  if (erroReserva) return erro(erroReserva.message);
  const c = reserva as Contribuicao;

  // "Vou dar pessoalmente": não há pagamento, a reserva já vale.
  if (e.tipo === 'pessoalmente') {
    try {
      await confirmar(c.id);
    } catch (err) {
      console.error(err);
      return erro('Não foi possível registrar sua reserva. Tente novamente.', 500);
    }
    return json({ id: c.id, status: 'confirmado', cupons: await listarCupons(c.id) });
  }

  try {
    const clienteId = await obterOuCriarCliente({ nome, cpf, whatsapp });
    const cobranca = await criarCobranca({
      clienteId,
      forma: e.forma_pagamento!,
      valor: Number(c.valor),
      descricao: `Presente para Igor & Nicole: ${c.presente_titulo}`,
      referencia: c.id,
    });

    await db
      .from('contribuicoes')
      .update({
        asaas_customer_id: clienteId,
        asaas_payment_id: cobranca.id,
        asaas_invoice_url: cobranca.invoiceUrl,
      })
      .eq('id', c.id);

    const pix = e.forma_pagamento === 'pix' ? await obterPixQrCode(cobranca.id) : null;

    return json({
      id: c.id,
      status: 'pendente',
      valor: Number(c.valor),
      expira_em: c.expira_em,
      invoice_url: cobranca.invoiceUrl,
      pix: pix && { copia_e_cola: pix.payload, qr_code_base64: pix.encodedImage },
    });
  } catch (err) {
    console.error(err);
    // Libera a cota: sem cobrança, a reserva não faz sentido.
    await cancelar(c.id).catch(console.error);
    return erro('Não conseguimos gerar o pagamento agora. Tente novamente em instantes.', 502);
  }
});

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (base: string) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(cpf.slice(0, 9)) === Number(cpf[9]) && digito(cpf.slice(0, 10)) === Number(cpf[10]);
}
