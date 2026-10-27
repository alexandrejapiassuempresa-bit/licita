import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  GitBranch, 
  FolderGit2, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  Database,
  FileSpreadsheet,
  Terminal,
  Rocket,
  Code2
} from 'lucide-react';
import { GitHubAuthState, GitHubRepo, GitHubSyncLog } from '../types/github';
import { PriceBankItem, ProcurementProject } from '../types/procurement';
import { 
  loadGitHubAuth, 
  saveGitHubAuth, 
  clearGitHubAuth, 
  validateGitHubToken, 
  listGitHubRepos, 
  createGitHubRepo, 
  syncPriceBankToGitHub, 
  syncResearchToGitHub, 
  importPriceBankFromGitHub,
  pushAppCodeToGitHub 
} from '../utils/githubStorage';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceBankItems: PriceBankItem[];
  onUpdatePriceBankItems: (items: PriceBankItem[]) => void;
  currentProject: ProcurementProject;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  priceBankItems,
  onUpdatePriceBankItems,
  currentProject,
}) => {
  const [authState, setAuthState] = useState<GitHubAuthState>(() => loadGitHubAuth());
  const [activeTab, setActiveTab] = useState<'status' | 'pat' | 'oauth'>('status');

  // PAT input
  const [patInput, setPatInput] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Repositories
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>(authState.selectedRepo || '');

  // Create repo form
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('banco-de-precos-licitacoes');
  const [isNewRepoPrivate, setIsNewRepoPrivate] = useState(true);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);

  // Sync actions
  const [isSyncingBank, setIsSyncingBank] = useState(false);
  const [isSyncingProject, setIsSyncingProject] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPushingApp, setIsPushingApp] = useState(false);
  const [pushAppResult, setPushAppResult] = useState<{ count: number; total: number; repoUrl: string } | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Copy feedback
  const [copiedCallback, setCopiedCallback] = useState<string | null>(null);

  // Exact callback URLs for GitHub OAuth settings
  const devCallbackUrl = 'https://ais-dev-rmkeccwcabwolasm3nvyss-522035871329.us-west1.run.app/auth/callback';
  const sharedCallbackUrl = 'https://ais-pre-rmkeccwcabwolasm3nvyss-522035871329.us-west1.run.app/auth/callback';

  // Listen for OAuth postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'github') {
        const token = event.data.token;
        const user = event.data.user;

        if (token && user) {
          const updated = saveGitHubAuth({
            token,
            user,
          });
          if (updated) {
            setAuthState(updated);
            setActiveTab('status');
            setActionSuccessMessage(`Conectado com sucesso como @${user.login}!`);
            loadReposForToken(token);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // When opening or when token changes, load repos if authenticated
  useEffect(() => {
    if (isOpen && authState.token) {
      loadReposForToken(authState.token);
    }
  }, [isOpen, authState.token]);

  const loadReposForToken = async (token: string) => {
    setIsLoadingRepos(true);
    try {
      const list = await listGitHubRepos(token);
      setRepos(list);
      if (!selectedRepo && list.length > 0) {
        setSelectedRepo(list[0].full_name);
        saveGitHubAuth({ selectedRepo: list[0].full_name });
      }
    } catch (err: any) {
      console.error('Erro ao carregar repos:', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  if (!isOpen) return null;

  // Handle OAuth Popup Flow
  const handleStartOAuth = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      const data = await response.json();

      if (!data.configured || !data.url) {
        setTokenError(
          data.message || 'GITHUB_CLIENT_ID não configurado. Use o Token de Acesso Pessoal (PAT) abaixo.'
        );
        setActiveTab('pat');
        return;
      }

      const authWindow = window.open(
        data.url,
        'oauth_github_popup',
        'width=600,height=720,scrollbars=yes'
      );

      if (!authWindow) {
        alert('O navegador bloqueou a janela pop-up. Por favor, permita pop-ups para autenticar com o GitHub.');
      }
    } catch (err: any) {
      setTokenError('Falha ao iniciar autenticação OAuth: ' + err.message);
    }
  };

  // Handle Token Validation (PAT)
  const handleValidatePat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patInput.trim()) return;

    setIsValidatingToken(true);
    setTokenError(null);

    try {
      const res = await validateGitHubToken(patInput.trim());
      if (!res.valid || !res.user) {
        setTokenError(res.error || 'Token inválido ou sem permissões suficientes.');
        return;
      }

      const updated = saveGitHubAuth({
        token: patInput.trim(),
        user: res.user,
      });

      if (updated) {
        setAuthState(updated);
        setPatInput('');
        setActiveTab('status');
        setActionSuccessMessage(`Conectado com sucesso com a conta @${res.user.login}!`);
        loadReposForToken(patInput.trim());
      }
    } catch (err: any) {
      setTokenError('Erro ao validar token: ' + err.message);
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = () => {
    clearGitHubAuth();
    setAuthState({
      token: null,
      user: null,
      selectedRepo: null,
      syncLogs: [],
    });
    setRepos([]);
    setSelectedRepo('');
    setActionSuccessMessage('Conta desconectada do GitHub.');
  };

  // Handle Create Repo
  const handleCreateNewRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.token || !newRepoName.trim()) return;

    setIsCreatingRepo(true);
    setTokenError(null);

    try {
      const repo = await createGitHubRepo(
        authState.token,
        newRepoName.trim(),
        'Repositório institucional para Banco de Preços e Pesquisas de Licitações (CotaLicit)',
        isNewRepoPrivate
      );

      setRepos((prev) => [repo, ...prev]);
      setSelectedRepo(repo.full_name);
      saveGitHubAuth({ selectedRepo: repo.full_name });
      setShowCreateRepo(false);
      setActionSuccessMessage(`Repositório ${repo.full_name} criado com sucesso no GitHub!`);
    } catch (err: any) {
      setTokenError('Falha ao criar repositório: ' + err.message);
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Handle Sync Price Bank
  const handleSyncPriceBank = async () => {
    if (!authState.token || !selectedRepo) {
      setTokenError('Selecione um repositório antes de sincronizar.');
      return;
    }

    setIsSyncingBank(true);
    setTokenError(null);

    try {
      const res = await syncPriceBankToGitHub(authState.token, selectedRepo, priceBankItems);
      
      const newLog: GitHubSyncLog = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'export_price_bank',
        repo: selectedRepo,
        path: 'licitacoes/banco-de-precos.json',
        commitUrl: res.commitUrl,
        itemsCount: priceBankItems.length,
        status: 'success',
        message: `${priceBankItems.length} itens do Banco de Preços sincronizados com sucesso.`,
      };

      const updatedLogs = [newLog, ...(authState.syncLogs || [])].slice(0, 15);
      saveGitHubAuth({ syncLogs: updatedLogs });
      setAuthState((prev) => ({ ...prev, syncLogs: updatedLogs }));

      setActionSuccessMessage(
        `Banco de Preços (${priceBankItems.length} itens) exportado com sucesso para ${selectedRepo}!`
      );
    } catch (err: any) {
      setTokenError('Erro ao sincronizar banco de preços: ' + err.message);
    } finally {
      setIsSyncingBank(false);
    }
  };

  // Handle Sync Current Research
  const handleSyncCurrentResearch = async () => {
    if (!authState.token || !selectedRepo) {
      setTokenError('Selecione um repositório antes de sincronizar.');
      return;
    }

    setIsSyncingProject(true);
    setTokenError(null);

    try {
      const res = await syncResearchToGitHub(authState.token, selectedRepo, currentProject);

      const newLog: GitHubSyncLog = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'export_research',
        repo: selectedRepo,
        path: `pesquisas/${currentProject.processNumber || 'pesquisa'}.json`,
        commitUrl: res.commitUrl,
        itemsCount: currentProject.items.length,
        status: 'success',
        message: `Pesquisa ${currentProject.processNumber} salva no repositório.`,
      };

      const updatedLogs = [newLog, ...(authState.syncLogs || [])].slice(0, 15);
      saveGitHubAuth({ syncLogs: updatedLogs });
      setAuthState((prev) => ({ ...prev, syncLogs: updatedLogs }));

      setActionSuccessMessage(
        `Pesquisa atual (${currentProject.items.length} itens cotados) gravada com sucesso no GitHub!`
      );
    } catch (err: any) {
      setTokenError('Erro ao salvar pesquisa no GitHub: ' + err.message);
    } finally {
      setIsSyncingProject(false);
    }
  };

  // Handle Import Price Bank from GitHub
  const handleImportPriceBank = async () => {
    if (!authState.token || !selectedRepo) {
      setTokenError('Selecione um repositório antes de importar.');
      return;
    }

    setIsImporting(true);
    setTokenError(null);

    try {
      const items = await importPriceBankFromGitHub(authState.token, selectedRepo);

      // Merge items into price bank avoiding exact id duplicates
      const existingIds = new Set(priceBankItems.map((i) => i.id));
      const newItemsToAdd = items.map((item, idx) => ({
        ...item,
        id: existingIds.has(item.id) ? `imported_${Date.now()}_${idx}` : item.id,
      }));

      const merged = [...newItemsToAdd, ...priceBankItems];
      onUpdatePriceBankItems(merged);

      const newLog: GitHubSyncLog = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'import_price_bank',
        repo: selectedRepo,
        path: 'licitacoes/banco-de-precos.json',
        itemsCount: items.length,
        status: 'success',
        message: `${items.length} itens importados do repositório para o Banco de Preços.`,
      };

      const updatedLogs = [newLog, ...(authState.syncLogs || [])].slice(0, 15);
      saveGitHubAuth({ syncLogs: updatedLogs });
      setAuthState((prev) => ({ ...prev, syncLogs: updatedLogs }));

      setActionSuccessMessage(`Importados ${items.length} itens do GitHub para o Banco de Preços com sucesso!`);
    } catch (err: any) {
      setTokenError(
        'Falha ao importar: ' +
          err.message +
          ' (Verifique se o arquivo licitacoes/banco-de-precos.json existe no repositório)'
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Push/Import Entire App Codebase to GitHub
  const handlePushAppCode = async () => {
    if (!authState.token || !selectedRepo) {
      setTokenError('Selecione ou crie um repositório no GitHub antes de exportar o app.');
      return;
    }

    setIsPushingApp(true);
    setTokenError(null);
    setPushAppResult(null);

    try {
      const res = await pushAppCodeToGitHub(authState.token, selectedRepo);
      setPushAppResult({
        count: res.committedCount,
        total: res.totalFiles,
        repoUrl: res.repoUrl,
      });

      const newLog: GitHubSyncLog = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'export_research',
        repo: selectedRepo,
        path: 'app-codebase',
        commitUrl: `${res.repoUrl}/commits`,
        itemsCount: res.committedCount,
        status: 'success',
        message: `Código completo do app (${res.committedCount} arquivos) exportado para o GitHub.`,
      };

      const updatedLogs = [newLog, ...(authState.syncLogs || [])].slice(0, 15);
      saveGitHubAuth({ syncLogs: updatedLogs });
      setAuthState((prev) => ({ ...prev, syncLogs: updatedLogs }));

      setActionSuccessMessage(
        `Código completo do CotaLicit (${res.committedCount}/${res.totalFiles} arquivos) publicado com sucesso em ${selectedRepo}!`
      );
    } catch (err: any) {
      setTokenError('Falha ao exportar código para o GitHub: ' + err.message);
    } finally {
      setIsPushingApp(false);
    }
  };


  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCallback(label);
    setTimeout(() => setCopiedCallback(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
              <FolderGit2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight flex items-center gap-2">
                Integração com GitHub
                {authState.user && (
                  <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Conectado
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Versionamento e sincronização em nuvem do Banco de Preços e Pesquisas Licitatórias
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

        {/* Tab Navigation (when not connected or switching views) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'status'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Painel de Sincronização
            </button>
            <button
              onClick={() => setActiveTab('pat')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'pat'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Token Pessoal (PAT)
            </button>
            <button
              onClick={() => setActiveTab('oauth')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'oauth'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Configurar OAuth
            </button>
          </div>

          {authState.user && (
            <button
              onClick={handleDisconnect}
              className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline px-2 py-1"
            >
              Desconectar
            </button>
          )}
        </div>

        {/* Notification alerts */}
        {actionSuccessMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {tokenError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-800">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{tokenError}</span>
            </div>
            <button
              onClick={() => setTokenError(null)}
              className="text-red-700 hover:text-red-900 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* TAB 1: STATUS / MAIN DASHBOARD */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Authenticated State */}
              {authState.user ? (
                <>
                  {/* User Profile Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={authState.user.avatar_url}
                        alt={authState.user.login}
                        className="w-12 h-12 rounded-full border border-slate-300 shadow-xs"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {authState.user.name || authState.user.login}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            @{authState.user.login}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {authState.user.bio || 'Conta GitHub vinculada'} · {authState.user.public_repos} repositórios públicos
                        </p>
                      </div>
                    </div>
                    <a
                      href={authState.user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition"
                    >
                      <span>Ver Perfil</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>

                  {/* Repository Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Repositório de Destino para Sincronização:
                      </label>
                      <button
                        onClick={() => setShowCreateRepo(!showCreateRepo)}
                        className="text-xs text-emerald-700 font-medium hover:underline flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showCreateRepo ? 'Cancelar' : 'Criar Novo Repositório'}</span>
                      </button>
                    </div>

                    {/* New Repo Form */}
                    {showCreateRepo ? (
                      <form onSubmit={handleCreateNewRepo} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                        <div className="font-semibold text-xs text-emerald-950">
                          Criar novo repositório no seu GitHub
                        </div>
                        <div>
                          <input
                            type="text"
                            value={newRepoName}
                            onChange={(e) => setNewRepoName(e.target.value)}
                            placeholder="ex: banco-de-precos-licitacoes"
                            className="w-full text-xs font-mono px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={isNewRepoPrivate}
                              onChange={(e) => setIsNewRepoPrivate(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Repositório Privado (Recomendado para dados institucionais)</span>
                          </label>
                          <button
                            type="submit"
                            disabled={isCreatingRepo || !newRepoName.trim()}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          >
                            {isCreatingRepo ? 'Criando...' : 'Criar Repositório'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <select
                            value={selectedRepo}
                            onChange={(e) => {
                              setSelectedRepo(e.target.value);
                              saveGitHubAuth({ selectedRepo: e.target.value });
                            }}
                            disabled={isLoadingRepos || repos.length === 0}
                            className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-slate-900"
                          >
                            {repos.length === 0 ? (
                              <option value="">
                                {isLoadingRepos ? 'Carregando repositórios...' : 'Nenhum repositório encontrado'}
                              </option>
                            ) : (
                              repos.map((r) => (
                                <option key={r.id} value={r.full_name}>
                                  {r.private ? '🔒' : '🌐'} {r.full_name} ({r.default_branch})
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        <button
                          onClick={() => authState.token && loadReposForToken(authState.token)}
                          disabled={isLoadingRepos}
                          title="Atualizar lista de repositórios"
                          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sync Action Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {/* Action 1: Export Price Bank */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                          <Database className="w-4 h-4 text-emerald-600" />
                          <span>Exportar Banco</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Envia {priceBankItems.length} itens do Banco de Preços para <code className="text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">licitacoes/banco-de-precos.json</code> e Markdown.
                        </p>
                      </div>
                      <button
                        onClick={handleSyncPriceBank}
                        disabled={isSyncingBank || !selectedRepo || priceBankItems.length === 0}
                        className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isSyncingBank ? 'Sincronizando...' : 'Exportar Banco'}</span>
                      </button>
                    </div>

                    {/* Action 2: Export Current Research */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                          <span>Salvar Pesquisa</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Grava os {currentProject.items.length} itens cotados do processo atual em pasta versionada no repositório.
                        </p>
                      </div>
                      <button
                        onClick={handleSyncCurrentResearch}
                        disabled={isSyncingProject || !selectedRepo || currentProject.items.length === 0}
                        className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{isSyncingProject ? 'Salvando...' : 'Salvar Pesquisa'}</span>
                      </button>
                    </div>

                    {/* Action 3: Import from GitHub */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                          <DownloadCloud className="w-4 h-4 text-purple-600" />
                          <span>Importar Dados</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Lê arquivo <code className="text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">banco-de-precos.json</code> do repositório para o sistema.
                        </p>
                      </div>
                      <button
                        onClick={handleImportPriceBank}
                        disabled={isImporting || !selectedRepo}
                        className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                        <span>{isImporting ? 'Importando...' : 'Importar p/ App'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Push Entire Codebase Card ("Importar App no GitHub") */}
                  <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 rounded-xl space-y-3.5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Rocket className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-2">
                            <span>Importar / Publicar Código Completo no GitHub</span>
                            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                              Repositório Completo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Envia todos os arquivos do projeto (React + Vite + servidor Express + leitor de NF-e) para o repositório selecionado.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handlePushAppCode}
                        disabled={isPushingApp || !selectedRepo}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5 shrink-0 shadow-xs"
                      >
                        <FolderGit2 className={`w-3.5 h-3.5 ${isPushingApp ? 'animate-spin' : ''}`} />
                        <span>{isPushingApp ? 'Publicando Arquivos...' : 'Publicar App no Repositório'}</span>
                      </button>
                    </div>

                    {/* How to run locally commands */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-mono flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Como rodar este app no seu computador:</span>
                        </span>
                        {selectedRepo && (
                          <a
                            href={`https://github.com/${selectedRepo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>Abrir {selectedRepo}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-emerald-300 bg-slate-950 p-2.5 rounded border border-slate-800/80 overflow-x-auto select-all">
                        git clone https://github.com/{selectedRepo || 'SEU_USUARIO/SEU_REPO'}.git<br />
                        cd {selectedRepo ? selectedRepo.split('/')[1] : 'cotalicit'} && npm install && npm run dev
                      </div>
                    </div>
                  </div>

                  {/* Sync Logs */}
                  {authState.syncLogs && authState.syncLogs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-slate-800">
                        Histórico de Sincronizações Recentes
                      </div>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                        {authState.syncLogs.map((log) => (
                          <div key={log.id} className="p-2.5 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 flex items-center space-x-2">
                                <span>{log.message}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {new Date(log.timestamp).toLocaleString('pt-BR')} · {log.repo}/{log.path}
                              </div>
                            </div>
                            {log.commitUrl && (
                              <a
                                href={log.commitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-[11px]"
                              >
                                <span>Ver Commit</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Disconnected State Overview */
                <div className="text-center py-6 px-4 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
                    <FolderGit2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="font-bold text-slate-900 text-base">
                      Conecte seu GitHub para Backup e Versionamento
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Sincronize automaticamente os itens do seu Banco de Preços, documentos de pesquisa mercadológica e relatórios diretamente em repositórios do GitHub com histórico e rastreabilidade total.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('pat')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center space-x-2"
                    >
                      <Key className="w-4 h-4" />
                      <span>Conectar com Token Pessoal (Rápido)</span>
                    </button>
                    <button
                      onClick={handleStartOAuth}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Conectar via OAuth</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERSONAL ACCESS TOKEN (PAT) */}
          {activeTab === 'pat' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Conexão Imediata via Personal Access Token (PAT)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Não requer configuração de OAuth App no GitHub. Você pode gerar um token em poucos segundos com permissão de leitura e gravação em repositórios (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">repo</code>).
                </p>
                <div className="pt-1">
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=CotaLicit%20Licitacoes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    <span>Abrir GitHub para gerar token com as permissões corretas</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <form onSubmit={handleValidatePat} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cole seu Token do GitHub (ghp_... ou github_pat_...):
                  </label>
                  <input
                    type="password"
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full text-xs font-mono px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('status')}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isValidatingToken || !patInput.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isValidatingToken ? 'Validando...' : 'Validar & Conectar'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: OAUTH APP CONFIGURATION */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Configuração de OAuth App no GitHub</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para utilizar o fluxo padrão de OAuth com pop-up, crie um OAuth App em seu GitHub Developer Settings e insira os callbacks abaixo:
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      1. Authorization Callback URL (Ambiente de Desenvolvimento):
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={devCallbackUrl}
                        className="flex-1 text-[11px] font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(devCallbackUrl, 'dev')}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 flex items-center space-x-1"
                      >
                        {copiedCallback === 'dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCallback === 'dev' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      2. Authorization Callback URL (Ambiente Compartilhado / Deployed):
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={sharedCallbackUrl}
                        className="flex-1 text-[11px] font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(sharedCallbackUrl, 'shared')}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 flex items-center space-x-1"
                      >
                        {copiedCallback === 'shared' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCallback === 'shared' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <a
                    href="https://github.com/settings/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    <span>Ir para GitHub Developer Settings</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleStartOAuth}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                  >
                    Testar Login OAuth
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Conexão segura via GitHub REST API v3 · Tokens armazenados localmente
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
