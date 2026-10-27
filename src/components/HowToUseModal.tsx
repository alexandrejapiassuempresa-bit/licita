import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  FileSpreadsheet, 
  Database, 
  FileText, 
  FolderGit2, 
  ExternalLink, 
  CheckCircle2, 
  Search, 
  Printer, 
  Terminal,
  ArrowRight
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload: () => void;
  onOpenPriceBank: () => void;
  onOpenGitHub: () => void;
  onOpenReport: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onOpenUpload,
  onOpenPriceBank,
  onOpenGitHub,
  onOpenReport,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      title: '1. Iniciar a Pesquisa de Preços',
      badge: 'Cotação & Planilha',
      icon: Search,
      content: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-relaxed">
            Você pode pesquisar preços de duas maneiras simples e imediatas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span>Busca Individual</span>
              </div>
              <p className="text-xs text-slate-500">
                Digite o item no formulário superior (ex: <em>"Papel Sulfite A4 75g"</em>, quantidade e unidade) e clique em <strong>"Pesquisar com IA"</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Importar Planilha do Edital</span>
              </div>
              <p className="text-xs text-slate-500">
                Clique em <strong>"Importar Planilha"</strong> para subir uma tabela Excel (.xlsx) ou CSV com dezenas de itens de uma só vez.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Abrir Importador de Planilha</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: '2. Banco de Preços com NFs e Catálogos',
      badge: 'Art. 23 Lei 14.133',
      icon: Database,
      content: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-relaxed">
            O <strong>Banco de Preços</strong> permite armazenar e reaproveitar preços de contratações anteriores, notas fiscais e tabelas de fornecedores:
          </p>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs text-emerald-950">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Leitor Inteligente de Documentos por IA</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Arraste arquivos <strong>XML de NF-e</strong>, DANFE em PDF ou catálogos comerciais. O sistema extrai automaticamente o emitente, CNPJ, número da nota, <strong>a marca anunciada de cada produto</strong> e o preço praticado.
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenPriceBank();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition inline-flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Acessar Banco de Preços</span>
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. Análise da IA: Melhor Preço e Marca Real',
      badge: 'Robô de Mercado',
      icon: Sparkles,
      content: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-relaxed">
            Ao executar a cotação, a inteligência artificial atua como se fosse ao mercado:
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Pesquisa em Múltiplas Lojas:</strong> Consulta Mercado Livre, Amazon Brasil, Kalunga, Magazine Luiza, Compras.gov.br e o seu próprio Banco de Preços.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Reconhece a Marca Específica:</strong> Extrai a marca real ofertada (ex: Chamex, Report, BIC, Plaxmetal, Lenovo) e a especificação exata do produto.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Comprovação para Auditoria:</strong> Anota o link direto para a oferta na loja virtual ou a referência fiscal da nota para anexar aos autos do processo.
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 4,
      title: '4. Regras da IN SEGES 65/2021 & Relatório',
      badge: 'Conformidade Legal',
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-relaxed">
            O CotaLicit aplica automaticamente as regras de cálculo exigidas pelos Tribunais de Contas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block mb-1">Média Aritmética</span>
              <span className="text-slate-500">Padrão da IN 65/2021 com desvio padrão e CV%.</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block mb-1">Mediana</span>
              <span className="text-slate-500">Ideal quando há grande dispersão de valores.</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block mb-1">Menor Preço</span>
              <span className="text-slate-500">Seleciona o menor custo de aquisição comprovado.</span>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenReport();
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ver Relatório Oficial para Impressão</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: '5. Importar / Publicar o App no GitHub & Rodar Local',
      badge: 'Código & Deploy',
      icon: FolderGit2,
      content: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-relaxed">
            Você pode importar/publicar todo o código-fonte do aplicativo no seu próprio GitHub e rodá-lo no seu computador:
          </p>
          
          <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Como rodar na sua máquina local</span>
              </span>
            </div>
            <pre className="font-mono text-[11px] text-emerald-300 bg-slate-950 p-2.5 rounded-lg overflow-x-auto leading-relaxed">
              git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git{'\n'}
              cd SEU_REPOSITORIO{'\n'}
              npm install{'\n'}
              npm run dev
            </pre>
            <p className="text-[11px] text-slate-400">
              O servidor iniciará em <code className="text-white">http://localhost:3000</code> com todas as telas, IA e leitor de notas fiscais ativos.
            </p>
          </div>

          <div className="pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenGitHub();
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Exportar / Importar App no GitHub Agora</span>
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Como Usar o CotaLicit na Prática
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Guia rápido de utilização do sistema de pesquisa de preços e sincronização
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Selector Ribbon */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-1.5 overflow-x-auto shrink-0">
          {steps.map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveStep(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeStep === st.id
                  ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Passo {st.id}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {steps.map((st) => {
            if (st.id !== activeStep) return null;
            const Icon = st.icon;
            return (
              <div key={st.id} className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{st.title}</h4>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {st.badge}
                  </span>
                </div>

                {st.content}
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition"
              >
                Anterior
              </button>
            )}
            {activeStep < steps.length && (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                Próximo Passo
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Fechar Guia
          </button>
        </div>

      </div>
    </div>
  );
};
