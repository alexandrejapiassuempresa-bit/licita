# 🏛️ CotaLicit - Pesquisa de Preços para Licitações com IA

Plataforma inteligente de pesquisa de preços de mercado para processos licitatórios públicos em total conformidade com a **Lei Federal nº 14.133/2021** (Nova Lei de Licitações) e com a **Instrução Normativa SEGES/ME nº 65/2021**.

---

## 🚀 Principais Funcionalidades

1. **Reconhecimento Automático de Marcas e Produtos por IA**:
   - Reconhece o item licitatório a partir do texto do termo de referência ou edital.
   - Pesquisa ofertas nas principais lojas virtuais brasileiras (Mercado Livre, Amazon Brasil, Kalunga, Magazine Luiza, Compras.gov.br).
   - Identifica a **marca real** comercializada em cada anúncio e o menor custo unitário.

2. **Banco de Preços Institucional & Leitor de Documentos (Art. 23)**:
   - Importação direta de Notas Fiscais Eletrônicas (**NF-e XML**).
   - Leitura de **DANFE em PDF**, tabelas e catálogos comerciais com extração assistida por IA.
   - Armazenamento com CNPJ do fornecedor, número do documento e data de emissão.

3. **Cálculo Estatístico e Métodos da IN 65/2021**:
   - Média Aritmética, Mediana e Menor Preço.
   - Identificação de valores inexequíveis e sobrepreço.
   - Desvio Padrão e Coeficiente de Variação (CV%).

4. **Exportação e Relatório Oficial de Pesquisa**:
   - Exportação completa para **planilha Excel (.xlsx)** preenchida.
   - Relatório Licitatório Oficial para impressão e PDF com memória de cálculo e despacho conclusivo.

5. **Integração e Sincronização com GitHub**:
   - Backup versionado do Banco de Preços (`licitacoes/banco-de-precos.json`).
   - Sincronização de processos e pesquisas em nuvem.
   - Exportação e publicação do código completo do aplicativo no seu próprio repositório.

---

## 🛠️ Como Rodar o App no seu Computador

### Pré-requisitos
- **Node.js** 18.0 ou superior
- **npm** (ou **pnpm** / **yarn**)

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` a partir do modelo `.env.example`:
```bash
cp .env.example .env
```
Preencha a chave de API da IA:
```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3000
```
*(Opcional: configure `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` para habilitar login OAuth por pop-up).*

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse o aplicativo no navegador em: **`http://localhost:3000`**

### 5. Compilar para Produção
```bash
npm run build
npm start
```

---

## 📂 Estrutura do Projeto

```text
├── server.ts                   # Servidor Express com rotas de IA, parser de NF-e e GitHub API
├── index.html                  # Ponto de entrada HTML
├── vite.config.ts              # Configuração Vite + Tailwind CSS
├── src/
│   ├── App.tsx                 # Componente principal e fluxo de cotações
│   ├── main.tsx                # Inicializador React 18
│   ├── components/
│   │   ├── Header.tsx          # Barra superior com botões de navegação e status
│   │   ├── ProcurementTable.tsx# Tabela dinâmica de cotações com lote
│   │   ├── PriceBankModal.tsx  # Banco de Preços com leitor de NF-e e catálogos
│   │   ├── GitHubModal.tsx     # Sincronização e exportação com GitHub
│   │   ├── ItemDetailModal.tsx # Detalhamento do item e exclusão de cotações
│   │   ├── HowToUseModal.tsx   # Guia passo a passo prático de utilização
│   │   └── ...
│   ├── types/                  # Tipagens TypeScript para licitações e GitHub
│   └── utils/                  # Cálculos estatísticos, exportação Excel/PDF e APIs
```

---

## ⚖️ Conformidade Legal
- **Lei nº 14.133/2021** - Art. 23 (Parâmetros de pesquisa de preços)
- **Instrução Normativa SEGES/ME nº 65/2021** (Procedimento para pesquisa de preços)
