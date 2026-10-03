import { useEffect, useState } from 'react';
import {
  X,
  Gift,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  QrCode,
  Ticket,
  MessageCircle,
  PartyPopper,
  CreditCard,
  HandHeart,
  Minus,
  Plus,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import type { CheckoutStep, Configuracoes, Presente } from '@/types';
import { formatarValor, calcularCupons, formatarCupom } from '@/lib/utils/cupons';
import { disponibilidade, parcelasPermitidas, VALOR_MINIMO_PAGAMENTO } from '@/lib/utils/presentes';
import { gerarLinkWhatsApp } from '@/lib/utils/whatsapp';
import { EVENT_DATA_TEXTO } from '@/data/mockData';
import { consultarContribuicao, criarContribuicao, type RespostaContribuicao } from '@/lib/api';

interface Props {
  presente: Presente | null;
  config: Configuracoes;
  onClose: () => void;
  /** Recarrega a vitrine (o presente reservado/pago some da lista). */
  onContribuicaoRegistrada: () => void;
}

type Forma = 'pix' | 'cartao' | 'pessoalmente';

interface DadosConvidado {
  nome: string;
  whatsapp: string;
  cpf: string;
  mensagem: string;
}

const DADOS_VAZIOS: DadosConvidado = { nome: '', whatsapp: '', cpf: '', mensagem: '' };
const INTERVALO_POLLING_MS = 5000;

export default function CheckoutModal({ presente, config, onClose, onContribuicaoRegistrada }: Props) {
  const [step, setStep] = useState<CheckoutStep>('dados');
  const [forma, setForma] = useState<Forma>('pix');
  const [quantidade, setQuantidade] = useState(1);
  const [parcelas, setParcelas] = useState(1);
  const [dados, setDados] = useState<DadosConvidado>(DADOS_VAZIOS);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState<RespostaContribuicao | null>(null);
  const [copied, setCopied] = useState(false);
  const [cupons, setCupons] = useState<string[]>([]);

  useEffect(() => {
    if (presente) {
      setStep('dados');
      setForma('pix');
      setQuantidade(1);
      setParcelas(1);
      setDados(DADOS_VAZIOS);
      setErros({});
      setErroGeral('');
      setResposta(null);
      setCupons([]);
    }
  }, [presente]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (presente) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onEsc);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [presente, onClose]);

  // Polling da confirmação do pagamento (o webhook do Asaas confirma no banco).
  useEffect(() => {
    if (step !== 'pagamento' || !resposta) return;
    let ativo = true;
    const timer = setInterval(async () => {
      try {
        const r = await consultarContribuicao(resposta.id);
        if (!ativo) return;
        if (r.status === 'confirmado') {
          setCupons(r.cupons.map(formatarCupom));
          setStep('sucesso');
          onContribuicaoRegistrada();
        } else if (r.status === 'cancelado') {
          setErroGeral('O pagamento foi cancelado ou expirou. Você pode tentar de novo.');
          setResposta(null);
          setStep('dados');
          onContribuicaoRegistrada();
        }
      } catch {
        // falha de rede momentânea: tenta de novo no próximo ciclo
      }
    }, INTERVALO_POLLING_MS);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [step, resposta, onContribuicaoRegistrada]);

  if (!presente) return null;

  const d = disponibilidade(presente);
  const podePessoalmente = presente.permite_pessoalmente;
  const pessoalmente = forma === 'pessoalmente';
  const valorTotal = presente.valor * quantidade;
  const maxParcelas = parcelasPermitidas(valorTotal, config.max_parcelas);
  // Se o convidado diminuir a quantidade, o número de parcelas acompanha o novo limite.
  const parcelasEscolhidas = forma === 'cartao' ? Math.min(parcelas, maxParcelas) : 1;
  const ganhaCupons = !pessoalmente || config.cupom_pessoalmente;
  const qtdCupons = ganhaCupons ? calcularCupons(valorTotal, config.valor_por_cupom) : 0;

  const validarDados = (): boolean => {
    const e: Record<string, string> = {};
    if (dados.nome.trim().length < 3) e.nome = 'Por favor, informe seu nome completo.';
    if (dados.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Por favor, informe um WhatsApp válido com DDD.';
    if (!pessoalmente && dados.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'Informe os 11 dígitos do CPF.';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleEnviar = async () => {
    setErroGeral('');
    if (!validarDados()) return;
    if (!pessoalmente && valorTotal < VALOR_MINIMO_PAGAMENTO) {
      setErroGeral(
        `Pagamentos pelo site precisam ser de pelo menos ${formatarValor(VALOR_MINIMO_PAGAMENTO)} (regra do Asaas). Escolha mais unidades.`,
      );
      return;
    }
    setEnviando(true);
    try {
      const r = await criarContribuicao({
        presente_id: presente.id,
        tipo: pessoalmente ? 'pessoalmente' : 'site',
        forma_pagamento: pessoalmente ? undefined : forma,
        quantidade,
        parcelas: parcelasEscolhidas,
        nome: dados.nome,
        whatsapp: dados.whatsapp,
        cpf: pessoalmente ? undefined : dados.cpf,
        mensagem: dados.mensagem,
      });
      setResposta(r);
      onContribuicaoRegistrada();
      if (r.status === 'confirmado') {
        setCupons((r.cupons ?? []).map(formatarCupom));
        setStep('sucesso');
      } else {
        setStep('pagamento');
      }
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCopiar = () => {
    if (resposta?.pix) {
      navigator.clipboard.writeText(resposta.pix.copia_e_cola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const linkWhatsApp =
    step === 'sucesso'
      ? gerarLinkWhatsApp(presente.titulo, dados.mensagem || 'Muita alegria e bênções!', cupons, pessoalmente)
      : '';

  const inputClass = (erro?: string) =>
    `w-full px-4 py-3 rounded-xl border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 transition-all ${
      erro
        ? 'border-error focus:ring-error-light'
        : 'border-champagne-100 focus:border-champagne focus:ring-champagne-100'
    }`;

  const opcoesForma: { id: Forma; label: string; icon: typeof QrCode; visivel: boolean }[] = [
    { id: 'pix', label: 'Pix', icon: QrCode, visivel: true },
    { id: 'cartao', label: 'Cartão', icon: CreditCard, visivel: true },
    { id: 'pessoalmente', label: 'Vou dar pessoalmente', icon: HandHeart, visivel: podePessoalmente },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-6 py-4 border-b border-champagne-100 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-champagne-50 border border-champagne-100">
              <Gift className="w-5 h-5 text-champagne" />
            </div>
            <div>
              <p className="font-serif text-base text-ink leading-none">Presentear os Noivos</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {step === 'dados' && 'Passo 1 de 3 · Como e quanto'}
                {step === 'pagamento' && `Passo 2 de 3 · Pagamento via ${forma === 'pix' ? 'Pix' : 'cartão'}`}
                {step === 'sucesso' && 'Passo 3 de 3 · Confirmação'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-champagne-50 transition-colors">
            <X className="w-5 h-5 text-ink-soft" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Resumo do presente */}
          <div className="flex items-center gap-4 bg-champagne-50 rounded-2xl p-4 mb-6">
            <img src={presente.imagem_url} alt={presente.titulo} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-ink leading-snug truncate">{presente.titulo}</p>
              <p className="text-lg font-bold text-champagne-dark mt-0.5">
                {valorTotal > 0 ? formatarValor(valorTotal) : '—'}
              </p>
            </div>
            {qtdCupons > 0 && (
              <div className="text-right">
                <p className="text-xs text-ink-muted">Você ganha</p>
                <p className="flex items-center gap-1 text-sm font-semibold text-champagne-dark">
                  <Ticket className="w-4 h-4" />
                  {qtdCupons} {qtdCupons === 1 ? 'cupom' : 'cupons'}
                </p>
              </div>
            )}
          </div>

          {/* Step 1: Escolha + dados */}
          {step === 'dados' && (
            <div className="space-y-5 animate-slide-up">
              {/* Quanto */}
              {d.restanteQtd > 1 && (
                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-1.5">
                    Quantas unidades?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                      className="p-2.5 rounded-full border border-champagne-200 hover:bg-champagne-50 disabled:opacity-40"
                      disabled={quantidade <= 1}
                    >
                      <Minus className="w-4 h-4 text-ink-soft" />
                    </button>
                    <span className="font-serif text-2xl text-ink w-10 text-center">{quantidade}</span>
                    <button
                      type="button"
                      onClick={() => setQuantidade(Math.min(d.restanteQtd, quantidade + 1))}
                      className="p-2.5 rounded-full border border-champagne-200 hover:bg-champagne-50 disabled:opacity-40"
                      disabled={quantidade >= d.restanteQtd}
                    >
                      <Plus className="w-4 h-4 text-ink-soft" />
                    </button>
                    <span className="text-sm text-ink-muted">
                      × {formatarValor(presente.valor)} · {d.restanteTexto}
                    </span>
                  </div>
                </div>
              )}

              {/* Como */}
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">Como você quer presentear?</label>
                <div className={`grid gap-2 ${podePessoalmente ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {opcoesForma
                    .filter((o) => o.visivel)
                    .map((o) => {
                      const Icon = o.icon;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setForma(o.id)}
                          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-medium text-center transition-all ${
                            forma === o.id
                              ? 'border-champagne bg-champagne-50 text-champagne-dark ring-2 ring-champagne-100'
                              : 'border-champagne-100 text-ink-soft hover:bg-champagne-50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {o.label}
                        </button>
                      );
                    })}
                </div>
              </div>

              {forma === 'cartao' && maxParcelas > 1 && (
                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-1.5">Em quantas vezes?</label>
                  <select
                    value={parcelasEscolhidas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                    className={inputClass()}
                  >
                    {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? `À vista — ${formatarValor(valorTotal)}` : `${n}x de ${formatarValor(valorTotal / n)}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-muted mt-1">
                    Os números da sorte valem pelo valor total do presente, mesmo parcelado.
                  </p>
                </div>
              )}

              {pessoalmente && (
                <div className="rounded-xl border border-champagne-200 bg-champagne-50 p-4 text-sm text-ink-soft space-y-1.5">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <HandHeart className="w-4 h-4 text-champagne-dark" /> Obrigado por avisar!
                  </p>
                  <p>
                    Ao confirmar, <strong>este presente sai da lista</strong> para ninguém comprar repetido.
                    É só levar no dia. Se mudar de ideia, avise os noivos para liberarem o item.
                  </p>
                  {!config.cupom_pessoalmente && (
                    <p className="text-xs text-ink-muted">
                      Os números da sorte são gerados apenas para presentes pagos pelo site.
                    </p>
                  )}
                </div>
              )}

              {/* Dados */}
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">Seu nome completo *</label>
                <input
                  type="text"
                  value={dados.nome}
                  maxLength={80}
                  onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  className={inputClass(erros.nome)}
                />
                {erros.nome && <p className="text-xs text-error mt-1">{erros.nome}</p>}
              </div>

              <div className={`grid gap-4 ${pessoalmente ? '' : 'sm:grid-cols-2'}`}>
                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-1.5">WhatsApp (com DDD) *</label>
                  <input
                    type="tel"
                    value={dados.whatsapp}
                    onChange={(e) => setDados({ ...dados, whatsapp: e.target.value })}
                    placeholder="(63) 99999-9999"
                    className={inputClass(erros.whatsapp)}
                  />
                  {erros.whatsapp && <p className="text-xs text-error mt-1">{erros.whatsapp}</p>}
                </div>
                {!pessoalmente && (
                  <div>
                    <label className="block text-sm font-medium text-ink-soft mb-1.5">CPF *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={dados.cpf}
                      onChange={(e) => setDados({ ...dados, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className={inputClass(erros.cpf)}
                    />
                    {erros.cpf && <p className="text-xs text-error mt-1">{erros.cpf}</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">Mensagem de bênção (opcional)</label>
                <textarea
                  value={dados.mensagem}
                  maxLength={500}
                  onChange={(e) => setDados({ ...dados, mensagem: e.target.value })}
                  placeholder="Deixe uma mensagem carinhosa para os noivos... (aparece no Mural de Recados)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-champagne-100 bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100 transition-all resize-none"
                />
              </div>

              {qtdCupons > 0 && (
                <div className="bg-champagne-50 rounded-xl p-4 flex items-start gap-3">
                  <Ticket className="w-5 h-5 text-champagne mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-ink-soft">
                    Com este presente de {formatarValor(valorTotal)}, você receberá{' '}
                    <strong className="text-champagne-dark">
                      {qtdCupons} {qtdCupons === 1 ? 'número da sorte' : 'números da sorte'}
                    </strong>{' '}
                    para o sorteio presencial no dia do Chá de Panela.
                  </p>
                </div>
              )}

              {erroGeral && (
                <div className="flex items-start gap-2 rounded-xl bg-error-light p-3 text-sm text-error">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {erroGeral}
                </div>
              )}

              <button
                onClick={handleEnviar}
                disabled={enviando}
                className="w-full py-4 rounded-full bg-champagne text-white font-semibold shadow-md hover:shadow-lg hover:bg-champagne-dark transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {pessoalmente ? 'Reservando...' : 'Gerando pagamento...'}
                  </>
                ) : pessoalmente ? (
                  'Confirmar: vou dar pessoalmente'
                ) : forma === 'pix' ? (
                  'Gerar Pix e Presentear'
                ) : (
                  'Ir para o pagamento com cartão'
                )}
              </button>
            </div>
          )}

          {/* Step 2: Pagamento */}
          {step === 'pagamento' && resposta && (
            <div className="space-y-5 animate-slide-up">
              {resposta.pix ? (
                <>
                  <div className="text-center">
                    <h3 className="font-serif text-xl text-ink mb-1">Pague com Pix</h3>
                    <p className="text-sm text-ink-muted">Escaneie o QR Code ou copie o código abaixo</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-2xl border-2 border-champagne-100 shadow-sm">
                      {resposta.pix.qr_code_base64 ? (
                        <img
                          src={`data:image/png;base64,${resposta.pix.qr_code_base64}`}
                          alt="QR Code Pix"
                          className="w-48 h-48"
                        />
                      ) : (
                        <div className="w-48 h-48 flex flex-col items-center justify-center text-ink-muted text-xs gap-2">
                          <QrCode className="w-16 h-16 text-champagne-200" />
                          Modo demonstração
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-soft mb-1.5">Pix Copia e Cola</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={resposta.pix.copia_e_cola}
                        className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-champagne-100 bg-canvas text-ink-muted text-sm font-mono truncate"
                      />
                      <button
                        onClick={handleCopiar}
                        className="px-4 py-3 rounded-xl bg-champagne text-white font-medium hover:bg-champagne-dark transition-colors flex items-center gap-1.5 flex-shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-champagne-50 border border-champagne-100">
                    <CreditCard className="w-7 h-7 text-champagne" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-ink mb-1">Pague com cartão</h3>
                    <p className="text-sm text-ink-muted">
                      O pagamento é feito na página segura do Asaas. Depois de pagar, volte para esta aba.
                    </p>
                  </div>
                  <a
                    href={resposta.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-full bg-champagne text-white font-semibold shadow-md hover:bg-champagne-dark transition-colors flex items-center justify-center gap-2"
                  >
                    Abrir pagamento com cartão <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="bg-champagne-50 rounded-xl p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-champagne animate-spin flex-shrink-0" />
                <p className="text-sm text-ink-soft">
                  Aguardando confirmação do pagamento... Esta tela atualiza sozinha.
                  {config.minutos_reserva > 0 && (
                    <> Seu presente fica reservado por {config.minutos_reserva} minutos.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Sucesso */}
          {step === 'sucesso' && (
            <div className="space-y-6 animate-slide-up text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success-light mb-2">
                {pessoalmente ? (
                  <HandHeart className="w-10 h-10 text-success" />
                ) : (
                  <PartyPopper className="w-10 h-10 text-success" />
                )}
              </div>

              <div>
                <h3 className="font-serif text-2xl text-ink mb-2">
                  {pessoalmente ? 'Presente reservado!' : 'Presente enviado com sucesso!'}
                </h3>
                <p className="text-ink-muted text-sm">
                  {pessoalmente
                    ? `${dados.nome}, obrigado por avisar! O presente saiu da lista — é só levar no dia.`
                    : `${dados.nome}, agradecemos de coração! Seu presente para Igor & Nicole foi confirmado.`}
                </p>
              </div>

              {cupons.length > 0 && (
                <div className="bg-gradient-to-br from-champagne-50 to-champagne-100 rounded-2xl p-6 border border-champagne-200">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Ticket className="w-5 h-5 text-champagne-dark" />
                    <p className="text-sm font-semibold text-champagne-dark tracking-wider uppercase">
                      Seus números da sorte
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {cupons.map((cupom) => (
                      <span
                        key={cupom}
                        className="px-4 py-2 rounded-xl bg-white border-2 border-champagne-200 font-serif text-lg text-champagne-dark shadow-sm animate-scale-in"
                      >
                        {cupom}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-ink-muted mt-4">
                    Guarde seus números! O sorteio acontece presencialmente no dia{' '}
                    <strong>{EVENT_DATA_TEXTO}</strong>.
                  </p>
                </div>
              )}

              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-full bg-[#25D366] text-white font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar mensagem de bênção no WhatsApp
              </a>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-white border border-champagne-200 text-ink-soft font-medium hover:bg-champagne-50 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
