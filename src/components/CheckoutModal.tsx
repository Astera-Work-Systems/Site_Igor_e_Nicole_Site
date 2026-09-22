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
  ChevronLeft,
  PartyPopper,
} from 'lucide-react';
import type { Presente, CheckoutStep } from '@/types';
import { formatarValor, calcularCupons, gerarNumerosSorte } from '@/lib/utils/cupons';
import { simularCriacaoPix, simularConfirmacaoPix } from '@/lib/mercadopago/config';
import { gerarLinkWhatsApp } from '@/lib/utils/whatsapp';

interface Props {
  presente: Presente | null;
  onClose: () => void;
}

interface DadosConvidado {
  nome: string;
  whatsapp: string;
  mensagem: string;
}

export default function CheckoutModal({ presente, onClose }: Props) {
  const [step, setStep] = useState<CheckoutStep>('dados');
  const [dados, setDados] = useState<DadosConvidado>({ nome: '', whatsapp: '', mensagem: '' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [criandoPix, setCriandoPix] = useState(false);
  const [pixData, setPixData] = useState<{ pixCopiaCola: string; qrCodeBase64: string; pixId: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [cuponsGerados, setCuponsGerados] = useState<string[]>([]);

  useEffect(() => {
    if (presente) {
      setStep('dados');
      setDados({ nome: '', whatsapp: '', mensagem: '' });
      setErros({});
      setPixData(null);
      setCuponsGerados([]);
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

  if (!presente) return null;

  const qtdCupons = calcularCupons(presente.valor);

  const validarDados = (): boolean => {
    const e: Record<string, string> = {};
    if (!dados.nome.trim() || dados.nome.trim().length < 3) {
      e.nome = 'Por favor, informe seu nome completo.';
    }
    const whatsappLimpo = dados.whatsapp.replace(/\D/g, '');
    if (whatsappLimpo.length < 10) {
      e.whatsapp = 'Por favor, informe um WhatsApp válido com DDD.';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleCriarPix = async () => {
    if (!validarDados()) return;
    setCriandoPix(true);
    try {
      const result = await simularCriacaoPix(presente.valor, presente.titulo);
      setPixData(result);
      setStep('pagamento');
      // Inicia polling de confirmação
      setConfirmando(true);
      const aprovado = await simularConfirmacaoPix();
      if (aprovado) {
        const cupons = gerarNumerosSorte(qtdCupons);
        setCuponsGerados(cupons);
        setStep('sucesso');
      }
      setConfirmando(false);
    } finally {
      setCriandoPix(false);
    }
  };

  const handleCopiar = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.pixCopiaCola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const linkWhatsApp = cuponsGerados.length
    ? gerarLinkWhatsApp(presente.titulo, dados.mensagem || 'Muita alegria e bênções!', cuponsGerados)
    : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-6 py-4 border-b border-champagne-100 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            {step === 'pagamento' && (
              <button
                onClick={() => setStep('dados')}
                className="p-1.5 rounded-full hover:bg-champagne-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-ink-soft" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-champagne-50 border border-champagne-100">
                <Gift className="w-5 h-5 text-champagne" />
              </div>
              <div>
                <p className="font-serif text-base text-ink leading-none">Presentear os Noivos</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {step === 'dados' && 'Passo 1 de 3 · Seus dados'}
                  {step === 'pagamento' && 'Passo 2 de 3 · Pagamento via Pix'}
                  {step === 'sucesso' && 'Passo 3 de 3 · Confirmação'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-champagne-50 transition-colors"
          >
            <X className="w-5 h-5 text-ink-soft" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Resumo do presente */}
          <div className="flex items-center gap-4 bg-champagne-50 rounded-2xl p-4 mb-6">
            <img
              src={presente.imagem_url}
              alt={presente.titulo}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-ink leading-snug truncate">{presente.titulo}</p>
              <p className="text-lg font-bold text-champagne-dark mt-0.5">{formatarValor(presente.valor)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-muted">Você ganha</p>
              <p className="flex items-center gap-1 text-sm font-semibold text-champagne-dark">
                <Ticket className="w-4 h-4" />
                {qtdCupons} {qtdCupons === 1 ? 'cupom' : 'cupons'}
              </p>
            </div>
          </div>

          {/* Step 1: Dados */}
          {step === 'dados' && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">
                  Seu nome completo *
                </label>
                <input
                  type="text"
                  value={dados.nome}
                  onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  className={`w-full px-4 py-3 rounded-xl border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 transition-all ${
                    erros.nome
                      ? 'border-error focus:ring-error-light'
                      : 'border-champagne-100 focus:border-champagne focus:ring-champagne-100'
                  }`}
                />
                {erros.nome && <p className="text-xs text-error mt-1">{erros.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">
                  WhatsApp (com DDD) *
                </label>
                <input
                  type="tel"
                  value={dados.whatsapp}
                  onChange={(e) => setDados({ ...dados, whatsapp: e.target.value })}
                  placeholder="(63) 99999-9999"
                  className={`w-full px-4 py-3 rounded-xl border bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 transition-all ${
                    erros.whatsapp
                      ? 'border-error focus:ring-error-light'
                      : 'border-champagne-100 focus:border-champagne focus:ring-champagne-100'
                  }`}
                />
                {erros.whatsapp && <p className="text-xs text-error mt-1">{erros.whatsapp}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">
                  Mensagem de bênção (opcional)
                </label>
                <textarea
                  value={dados.mensagem}
                  onChange={(e) => setDados({ ...dados, mensagem: e.target.value })}
                  placeholder="Deixe uma mensagem carinhosa para os noivos..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-champagne-100 bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100 transition-all resize-none"
                />
              </div>

              <div className="bg-champagne-50 rounded-xl p-4 flex items-start gap-3">
                <Ticket className="w-5 h-5 text-champagne mt-0.5 flex-shrink-0" />
                <p className="text-sm text-ink-soft">
                  Com este presente de {formatarValor(presente.valor)}, você receberá{' '}
                  <strong className="text-champagne-dark">{qtdCupons} {qtdCupons === 1 ? 'número da sorte' : 'números da sorte'}</strong>{' '}
                  para o sorteio presencial no dia do Chá de Panela.
                </p>
              </div>

              <button
                onClick={handleCriarPix}
                disabled={criandoPix}
                className="w-full py-4 rounded-full bg-champagne text-white font-semibold shadow-md hover:shadow-lg hover:bg-champagne-dark transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {criandoPix ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Pix...
                  </>
                ) : (
                  'Gerar Pix e Presentear'
                )}
              </button>
            </div>
          )}

          {/* Step 2: Pagamento */}
          {step === 'pagamento' && pixData && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-champagne-50 border border-champagne-100 mb-3">
                  <QrCode className="w-7 h-7 text-champagne" />
                </div>
                <h3 className="font-serif text-xl text-ink mb-1">Pague com Pix</h3>
                <p className="text-sm text-ink-muted">
                  Escaneie o QR Code ou copie o código abaixo
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-champagne-100 shadow-sm">
                  <img
                    src={pixData.qrCodeBase64}
                    alt="QR Code Pix"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Pix Copia e Cola */}
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">
                  Pix Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixData.pixCopiaCola}
                    className="flex-1 px-4 py-3 rounded-xl border border-champagne-100 bg-canvas text-ink-muted text-sm font-mono truncate"
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

              {/* Status de confirmação */}
              <div className="bg-champagne-50 rounded-xl p-4 flex items-center gap-3">
                {confirmando ? (
                  <>
                    <Loader2 className="w-5 h-5 text-champagne animate-spin flex-shrink-0" />
                    <p className="text-sm text-ink-soft">
                      Aguardando confirmação do pagamento... Você será redirecionado
                      automaticamente.
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <p className="text-sm text-ink-soft">Pagamento confirmado!</p>
                  </>
                )}
              </div>

              <p className="text-xs text-center text-ink-muted">
                ID da transação: <span className="font-mono">{pixData.pixId}</span>
              </p>
            </div>
          )}

          {/* Step 3: Sucesso */}
          {step === 'sucesso' && (
            <div className="space-y-6 animate-slide-up text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success-light mb-2">
                <PartyPopper className="w-10 h-10 text-success" />
              </div>

              <div>
                <h3 className="font-serif text-2xl text-ink mb-2">Presente enviado com sucesso!</h3>
                <p className="text-ink-muted text-sm">
                  {dados.nome}, agradecemos de coração! Seu presente para Igor &amp; Nicole
                  foi confirmado.
                </p>
              </div>

              {/* Cupons do sorteio */}
              {cuponsGerados.length > 0 && (
                <div className="bg-gradient-to-br from-champagne-50 to-champagne-100 rounded-2xl p-6 border border-champagne-200">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Ticket className="w-5 h-5 text-champagne-dark" />
                    <p className="text-sm font-semibold text-champagne-dark tracking-wider uppercase">
                      Seus números da sorte
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {cuponsGerados.map((cupom) => (
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
                    <strong>10 de Abril de 2027</strong>.
                  </p>
                </div>
              )}

              {/* CTA WhatsApp */}
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
                className="w-full py-3 rounded-full bg-white border border-champagne-200 text-ink-soft font-medium hover:bg-champagne-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
