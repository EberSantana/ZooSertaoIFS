import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface PWAInstallButtonProps {
  onFallbackAction?: () => void;
  fallbackLabel?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onFallbackAction,
  fallbackLabel = 'Desafio Rápido',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157A42]"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS && !isInstalled) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157A42]"
        >
          <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Usar como App</span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 border border-[#E3E7DF] shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h3 id="ios-install-title" className="text-lg font-bold text-[#1A241B]">
                  Instalar no iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Fechar instruções de instalação"
                  className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-[#525B50] hover:bg-[#F1F3EE]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[#434C41] list-decimal list-inside leading-relaxed">
                <li>Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari.</li>
                <li>Role as opções e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                <li>Confirme em <strong>Adicionar</strong> para abrir como aplicativo.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#157A42] text-white text-sm font-semibold hover:bg-[#106134] transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (onFallbackAction) {
            onFallbackAction();
          } else {
            setShowGuide(true);
          }
        }}
        className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#157A42] hover:bg-[#106134] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157A42]"
      >
        <span>{fallbackLabel}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 border border-[#E3E7DF] shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 id="pwa-guide-title" className="text-lg font-bold text-[#1A241B]">
                Instalar no Celular ou PC
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Fechar guia"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-[#525B50] hover:bg-[#F1F3EE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#434C41] leading-relaxed">
              Este ambiente funciona como aplicativo offline (PWA). No Chrome/Edge Android, abra o menu do navegador e toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#157A42] text-white text-sm font-semibold hover:bg-[#106134] transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg bg-[#9A5B0C] px-3 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>Modo Offline — Estudo salvo localmente</span>
    </div>
  );
};
