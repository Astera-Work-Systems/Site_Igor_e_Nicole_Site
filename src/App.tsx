import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import Countdown from '@/components/Countdown';
import EventHighlights from '@/components/EventHighlights';
import GiftVitrine from '@/components/GiftVitrine';
import CheckoutModal from '@/components/CheckoutModal';
import MuralRecados from '@/components/MuralRecados';
import LocationSection from '@/components/LocationSection';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import AdminPanel from '@/components/AdminPanel';
import type { Configuracoes, Presente } from '@/types';
import { CONFIG_PADRAO, listarPresentes, obterConfiguracoes } from '@/lib/api';

function App() {
  const [presenteSelecionado, setPresenteSelecionado] = useState<Presente | null>(null);
  const [route, setRoute] = useState<string>(window.location.hash);
  const [presentes, setPresentes] = useState<Presente[] | null>(null);
  const [erroPresentes, setErroPresentes] = useState(false);
  const [config, setConfig] = useState<Configuracoes>(CONFIG_PADRAO);

  const carregarPresentes = useCallback(() => {
    listarPresentes()
      .then((lista) => {
        setPresentes(lista);
        setErroPresentes(false);
      })
      .catch(() => setErroPresentes(true));
  }, []);

  useEffect(() => {
    carregarPresentes();
    obterConfiguracoes().then(setConfig).catch(() => {});
  }, [carregarPresentes]);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isAdmin = route.startsWith('#/admin');

  if (isAdmin) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main>
        <HeroSection />
        <Countdown />
        <EventHighlights />
        <GiftVitrine
          presentes={presentes}
          erro={erroPresentes}
          onTentarNovamente={carregarPresentes}
          onSelectPresente={setPresenteSelecionado}
        />
        <MuralRecados />
        <LocationSection />
        <FAQ />
      </main>
      <Footer />
      <CheckoutModal
        presente={presenteSelecionado}
        config={config}
        onClose={() => setPresenteSelecionado(null)}
        onContribuicaoRegistrada={carregarPresentes}
      />
    </div>
  );
}

export default App;
