import { GitHubAuthState, GitHubRepo, GitHubSyncLog, GitHubUser } from '../types/github';
import { PriceBankItem, ProcurementProject } from '../types/procurement';

const GITHUB_STORAGE_KEY = 'cotalicit_github_auth';

export const loadGitHubAuth = (): GitHubAuthState => {
  try {
    const raw = localStorage.getItem(GITHUB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        token: parsed.token || null,
        user: parsed.user || null,
        selectedRepo: parsed.selectedRepo || null,
        syncLogs: Array.isArray(parsed.syncLogs) ? parsed.syncLogs : [],
      };
    }
  } catch (e) {
    console.error('Falha ao carregar autenticação GitHub do localStorage:', e);
  }
  return {
    token: null,
    user: null,
    selectedRepo: null,
    syncLogs: [],
  };
};

export const saveGitHubAuth = (state: Partial<GitHubAuthState>) => {
  try {
    const current = loadGitHubAuth();
    const updated: GitHubAuthState = {
      ...current,
      ...state,
    };
    localStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Falha ao salvar autenticação GitHub:', e);
  }
};

export const clearGitHubAuth = () => {
  localStorage.removeItem(GITHUB_STORAGE_KEY);
};

// Validate token via backend
export const validateGitHubToken = async (token: string): Promise<{ valid: boolean; user?: GitHubUser; error?: string }> => {
  const res = await fetch('/api/github/validate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
};

// List repos
export const listGitHubRepos = async (token: string): Promise<GitHubRepo[]> => {
  const res = await fetch('/api/github/repos', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao buscar repositórios');
  }
  const data = await res.json();
  return data.repos || [];
};

// Create repo
export const createGitHubRepo = async (
  token: string,
  name: string,
  description?: string,
  isPrivate: boolean = true
): Promise<GitHubRepo> => {
  const res = await fetch('/api/github/create-repo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description, isPrivate }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar repositório');
  }
  const data = await res.json();
  return data.repo;
};

// Sync Price Bank
export const syncPriceBankToGitHub = async (
  token: string,
  repoFullName: string,
  items: PriceBankItem[]
): Promise<{ commitUrl?: string; contentUrl?: string }> => {
  const jsonContent = JSON.stringify(items, null, 2);
  
  // Also create a readable Markdown document
  const mdContent = `# 🏛️ Banco de Preços para Licitações Públicas
**Processado por:** CotaLicit AI (Lei nº 14.133/2021)  
**Total de Itens Cadastrados:** ${items.length}  
**Última Atualização:** ${new Date().toLocaleString('pt-BR')}  

---

| Item | Descrição do Produto | Marca Referência | Valor Unit. (R$) | Fornecedor / Órgão | Tipo Doc. | N° Documento / CNPJ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${items
  .map(
    (item, index) =>
      `| ${index + 1} | ${item.recognizedProduct || item.productDescription} | ${item.brand || 'Genérica'} | R$ ${(item.unitPrice || 0).toFixed(2)} | ${item.supplier || '-'} | ${(item.documentType || 'N/A').toUpperCase()} | ${item.documentNumber || item.cnpj || '-'} |`
  )
  .join('\n')}

---
*Documento exportado automaticamente para controle de conformidade com a IN SEGES/ME nº 65/2021 e art. 23 da Lei Federal nº 14.133/2021.*
`;

  // 1. Commit JSON data
  const resJson = await fetch('/api/github/commit-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      repo: repoFullName,
      path: 'licitacoes/banco-de-precos.json',
      content: jsonContent,
      message: `feat(banco-precos): sincronizar ${items.length} itens do banco de preços [CotaLicit]`,
    }),
  });

  if (!resJson.ok) {
    const err = await resJson.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao sincronizar arquivo JSON no GitHub');
  }

  // 2. Commit Markdown report
  await fetch('/api/github/commit-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      repo: repoFullName,
      path: 'licitacoes/BANCO_DE_PRECOS.md',
      content: mdContent,
      message: `docs(banco-precos): atualizar tabela legível em markdown [CotaLicit]`,
    }),
  }).catch(() => {});

  return resJson.json();
};

// Sync Current Research
export const syncResearchToGitHub = async (
  token: string,
  repoFullName: string,
  project: ProcurementProject
): Promise<{ commitUrl?: string; contentUrl?: string }> => {
  const safeProcessNumber = (project.processNumber || 'pesquisa')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);

  const jsonContent = JSON.stringify(project, null, 2);

  const res = await fetch('/api/github/commit-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      repo: repoFullName,
      path: `pesquisas/${safeProcessNumber}.json`,
      content: jsonContent,
      message: `feat(pesquisa): salvar ${project.processNumber} com ${project.items.length} itens [CotaLicit]`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao sincronizar pesquisa no GitHub');
  }

  return res.json();
};

// Import Price Bank from GitHub
export const importPriceBankFromGitHub = async (
  token: string,
  repoFullName: string,
  filePath: string = 'licitacoes/banco-de-precos.json'
): Promise<PriceBankItem[]> => {
  const res = await fetch(`/api/github/fetch-file?repo=${encodeURIComponent(repoFullName)}&path=${encodeURIComponent(filePath)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Arquivo não encontrado no repositório');
  }

  const data = await res.json();
  const parsed = JSON.parse(data.content);
  if (!Array.isArray(parsed)) {
    throw new Error('O arquivo no GitHub não contém uma lista válida de itens.');
  }

  return parsed;
};

// Push Entire Codebase to GitHub Repo ("Importar App no GitHub")
export const pushAppCodeToGitHub = async (
  token: string,
  repoFullName: string,
  branch?: string
): Promise<{
  success: boolean;
  committedCount: number;
  totalFiles: number;
  committedFiles: string[];
  repoUrl: string;
  errors?: Array<{ file: string; error: string }>;
}> => {
  const res = await fetch('/api/github/push-app-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      repo: repoFullName,
      branch,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao exportar código para o GitHub');
  }

  return res.json();
};

