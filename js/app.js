// ============================================================
// app.js — Versão Firebase (Tempo Real + Multi-usuário)
// Clinicorp Estoque de Insumos CliniPay
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyDb9ggBmlNS5slzKMtwY9QGMRSCLWKcBhA",
  authDomain:        "controle-de-insumos-df33e.firebaseapp.com",
  databaseURL:       "https://controle-de-insumos-df33e-default-rtdb.firebaseio.com/",
  projectId:         "controle-de-insumos-df33e",
  storageBucket:     "controle-de-insumos-df33e.firebasestorage.app",
  messagingSenderId: "665114041241",
  appId:             "1:665114041241:web:1fe11d3f7bf3246f4d5108"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================================
// ROLES — definido fora do DOMContentLoaded
// ============================================================
const USER_ROLES = {
  'Admin':                  { canEdit: true,  canManage: true,  canEditCosts: true,  canAddItems: true  },
  'Jovem Aprendiz':         { canEdit: true,  canManage: false, canEditCosts: false, canAddItems: false },
  'Assistente de OPS':      { canEdit: true,  canManage: false, canEditCosts: true,  canAddItems: true  },
  'Visualizador Clinicorp': { canEdit: false, canManage: false, canEditCosts: false, canAddItems: false }
};

const ROLE_PASSWORDS = {
  'Admin':             '@Almeida7',
  'Jovem Aprendiz':    '@clini123',
  'Assistente de OPS': '@clini123!'
  // Visualizador: sem senha
};

// ============================================================
// BOOT — aguarda o DOM estar pronto
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // ----------------------------------------------------------
  // IDENTIDADE DO USUÁRIO — Role-based login
  // ----------------------------------------------------------

  // Auto-logout: expira na primeira vez que o usuário abrir o sistema após as 8h do dia
  (function checkDailyExpiry() {
    const loginTs = parseInt(localStorage.getItem('clinicorp_login_ts') || '0', 10);
    if (!loginTs) return; // sem sessão ativa, deixa o fluxo normal cuidar
    const now = new Date();
    const todayAt8 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);
    if (loginTs < todayAt8.getTime() && now >= todayAt8) {
      localStorage.removeItem('clinicorp_role');
      localStorage.removeItem('clinicorp_login_ts');
    }
  })();

  let currentRole = localStorage.getItem('clinicorp_role') || '';

  if (!currentRole || !USER_ROLES[currentRole]) {
    showRoleModal(() => {
      currentRole = localStorage.getItem('clinicorp_role');
      updateSidebarUser(currentRole);
      startApp();
    });
    return;
  }

  updateSidebarUser(currentRole);
  startApp();

  // ----------------------------------------------------------
  // MODAL DE ROLE (primeira vez ou troca)
  // ----------------------------------------------------------
  function showRoleModal(onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(15,23,42,0.7);z-index:9999;
      display:flex;align-items:center;justify-content:center;
      backdrop-filter:blur(4px);
    `;

    const roles = Object.keys(USER_ROLES);
    let selectedRole = 'Visualizador Clinicorp';

    const renderModal = () => {
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:40px 36px;width:420px;
                    text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.25);">
          <div style="width:60px;height:60px;background:#FFF0E6;border-radius:50%;
                      display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
                 fill="none" stroke="#E85D04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 style="margin:0 0 4px;font-size:20px;color:#1E293B;font-weight:700;">Bem-vindo ao Estoque CliniPay</h2>
          <p style="margin:0 0 24px;color:#64748B;font-size:13px;">Selecione seu perfil de acesso para continuar.</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
            ${roles.map(role => {
              const isViz = role === 'Visualizador Clinicorp';
              const isSel = selectedRole === role;
              return `
              <div class="role-card" data-role="${role}" style="
                border:2px solid ${isSel ? '#E85D04' : isViz ? '#22C55E' : '#E2E8F0'};
                background:${isSel ? '#FFF0E6' : isViz ? '#F0FDF4' : '#F8FAFC'};
                border-radius:10px;padding:12px 10px;cursor:pointer;
                transition:all 0.15s;font-family:'Inter',sans-serif;
                ${isViz ? 'grid-column:span 2;' : ''}
              ">
                <div style="font-size:13px;font-weight:600;color:${isSel ? '#E85D04' : isViz ? '#16A34A' : '#1E293B'};">
                  ${role}
                  ${isViz ? '<span style="margin-left:8px;background:#BBF7D0;color:#15803D;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;">Sem senha</span>' : ''}
                </div>
                <div style="font-size:11px;color:#94A3B8;margin-top:3px;">
                  ${role === 'Admin' ? 'Acesso total' :
                    role === 'Jovem Aprendiz' ? 'Edição básica' :
                    role === 'Assistente de OPS' ? 'Edição + Custos' :
                    '👋 Acesso imediato, sem senha!'}
                </div>
              </div>`;
            }).join('')}
          </div>

          <div id="password-group" style="display:${selectedRole && selectedRole !== 'Visualizador Clinicorp' ? 'block' : 'none'};margin-bottom:16px;">
            <input id="role-password-input" type="password" placeholder="Senha do perfil"
              style="width:100%;padding:12px 16px;border:1.5px solid #E2E8F0;border-radius:10px;
                     font-size:14px;outline:none;box-sizing:border-box;
                     font-family:'Inter',sans-serif;color:#1E293B;"
              onfocus="this.style.borderColor='#E85D04'"
              onblur="this.style.borderColor='#E2E8F0'"
            />
          </div>

          <p id="role-modal-error" style="display:none;color:#EF4444;font-size:13px;margin:0 0 12px;">
            Senha incorreta.
          </p>
          <p id="role-modal-select-error" style="display:none;color:#EF4444;font-size:13px;margin:0 0 12px;">
            Selecione um perfil para continuar.
          </p>

          <button id="role-modal-btn"
            style="width:100%;padding:13px;background:#E85D04;color:white;border:none;
                   border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;
                   font-family:'Inter',sans-serif;transition:background 0.2s;"
            onmouseover="this.style.background='#C44D02'"
            onmouseout="this.style.background='#E85D04'">
            Entrar
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

      // Bind role card clicks
      overlay.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', () => {
          selectedRole = card.getAttribute('data-role');
          renderModal();
        });
      });

      const pwGroup  = document.getElementById('password-group');
      const pwInput  = document.getElementById('role-password-input');
      const errMsg   = document.getElementById('role-modal-error');
      const selErr   = document.getElementById('role-modal-select-error');
      const enterBtn = document.getElementById('role-modal-btn');

      const doLogin = () => {
        errMsg.style.display   = 'none';
        selErr.style.display   = 'none';

        if (!selectedRole) {
          selErr.style.display = 'block';
          return;
        }

        if (selectedRole === 'Visualizador Clinicorp') {
          localStorage.setItem('clinicorp_role', selectedRole);
          localStorage.setItem('clinicorp_login_ts', Date.now().toString());
          overlay.remove();
          onConfirm();
          return;
        }

        const correct = ROLE_PASSWORDS[selectedRole];
        const typed   = pwInput ? pwInput.value : '';
        if (typed !== correct) {
          errMsg.style.display = 'block';
          if (pwInput) { pwInput.value = ''; pwInput.focus(); }
          return;
        }

        localStorage.setItem('clinicorp_role', selectedRole);
        localStorage.setItem('clinicorp_login_ts', Date.now().toString());
        overlay.remove();
        onConfirm();
      };

      enterBtn.addEventListener('click', doLogin);
      if (pwInput) {
        pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
        pwInput.focus();
      }
    };

    renderModal();
  }

  // Atualiza o card de usuário na sidebar
  function updateSidebarUser(role) {
    if (!role) return;
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const nameEl   = document.getElementById('sidebar-user-name');
    const cardEl   = document.getElementById('sidebar-user-card');

    if (avatarEl) avatarEl.textContent = role.charAt(0).toUpperCase();
    if (nameEl)   nameEl.textContent   = role;

    if (cardEl && !cardEl._switchBound) {
      cardEl._switchBound = true;
      cardEl.addEventListener('click', () => {
        if (confirm('Trocar de usuário?')) {
          localStorage.removeItem('clinicorp_role');
          location.reload();
        }
      });
    }
  }

  // ----------------------------------------------------------
  // MÁQUINAS EM ESTOQUE — Google Sheets
  // ----------------------------------------------------------
  let machineCount = null;

  async function fetchMachineCount() {
    try {
      const sheetId = '166u2FFjhlpAYPgKm1fIi3g6TUID1DFlcABnkN-I54KI';
      const gid     = '132862690';
      const url     = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
      const res     = await fetch(url);
      const text    = await res.text();
      const match   = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
      if (!match) throw new Error('Formato inesperado da resposta');
      const json    = JSON.parse(match[1]);
      const rows    = json.table.rows;
      const targets = new Set(['Em estoque', 'Máquinas prontas para uso']);
      let count = 0;
      rows.forEach(row => {
        if (row.c && row.c[2] && row.c[2].v != null) {
          const val = String(row.c[2].v).trim();
          if (targets.has(val)) count++;
        }
      });
      return count;
    } catch (e) {
      console.warn('Não foi possível buscar contagem de máquinas:', e);
      return null;
    }
  }

  // ----------------------------------------------------------
  // INÍCIO DA APLICAÇÃO
  // ----------------------------------------------------------
  function startApp() {
    // Role permissions
    const currentRole  = localStorage.getItem('clinicorp_role');
    const roleConfig   = USER_ROLES[currentRole] || {};
    const canEdit      = roleConfig.canEdit      || false;
    const canManage    = roleConfig.canManage    || false;
    const canEditCosts = roleConfig.canEditCosts || false;
    const canAddItems  = roleConfig.canAddItems  || false;

    const views           = document.querySelectorAll('.view-section');
    const navBtns         = document.querySelectorAll('.nav-btn');
    const pageTitle       = document.getElementById('page-title');
    const pageSubtitle    = document.getElementById('page-subtitle');
    const tableHeadRow    = document.getElementById('table-head-row');
    const tableMinRow     = document.getElementById('table-min-row');
    const tableBody       = document.getElementById('table-body');
    const cardAlerts      = document.getElementById('card-alerts');
    const cardWeeks       = document.getElementById('card-weeks');
    const cardTotalItems  = document.getElementById('card-total-items');
    const btnExport       = document.getElementById('btn-export');
    const reportItemSelect = null; // replaced by chip system

    // Hide "Novo Item" costs button for non-admin
    const btnAddCostItem = document.getElementById('btn-add-cost-item');
    if (btnAddCostItem && currentRole !== 'Admin') {
      btnAddCostItem.style.display = 'none';
    }

    // Hide orders nav for users who cannot manage orders
    if (!canAddItems) {
      const navOrders = document.getElementById('nav-orders');
      if (navOrders) navOrders.style.display = 'none';
    }

    let consumptionChart  = null;
    let items             = [];
    let weeksData         = [];
    let logsData          = [];
    let costsData         = {};
    let costsHistoryData  = [];
    let inactiveItems     = new Set();
    let showAllWeeks      = false;
    let customItemsData     = {};
    let deletedItemsData    = {};
    let itemOverridesData   = {};
    let purchaseOrdersData  = {};
    let cardOrder           = [];

    // --------------------------------------------------------
    // CHANGELOG  — adicione novas versões no topo do array
    // --------------------------------------------------------
    const CHANGELOG = [
      {
        version: '0.94',
        date: '23/06/2026',
        title: 'Exportações, painel de valor e identidade visual',
        latest: true,
        changes: [
          { tag: 'new',    text: 'PDF com layout visual completo: KPIs, grid de insumos, tabela do período e alertas em destaque' },
          { tag: 'new',    text: 'E-mail com texto estruturado em seções: resumo, alertas, estoque por item e histórico' },
          { tag: 'new',    text: 'Modal de seleção de período para PDF e E-mail: semana atual, última semana, mês atual ou mês específico' },
          { tag: 'fix',    text: 'Card "Valor atual de insumos em estoque" agora exibe o valor correto em tempo real' },
          { tag: 'change', text: 'Nome do sistema na sidebar alterado para ClinipayEstoque' },
        ]
      },
      {
        version: '0.93',
        date: '23/06/2026',
        title: 'Relatório, mini cards e melhorias gerais',
        latest: false,
        changes: [
          { tag: 'fix',    text: 'Filtro de período (4/8/12/Todas semanas) voltou a aparecer no Relatório' },
          { tag: 'fix',    text: 'Tooltip do gráfico agora mostra apenas o insumo com o cursor' },
          { tag: 'change', text: 'Título da aba de gráficos alterado para "Relatório"' },
          { tag: 'new',    text: 'Mini cards do Estoque Central podem ser reordenados (Admin)' },
          { tag: 'new',    text: 'Ordem dos mini cards reflete a ordem das colunas na tabela' },
          { tag: 'new',    text: 'Sub-aba Histórico de Compras adicionada em Custos' },
          { tag: 'new',    text: 'Atualização automática do sistema: overlay avisa quando nova versão está disponível' },
          { tag: 'new',    text: 'Card "Valor atual de insumos em estoque" adicionado ao painel principal' },
          { tag: 'fix',    text: 'Botões E-mail, PDF e CSV voltaram a funcionar no Estoque Central' },
        ]
      },
      {
        version: '0.92',
        date: '23/06/2026',
        title: 'Pedidos de Compra e correções',
        latest: false,
        changes: [
          { tag: 'fix',    text: 'Aba Custos voltou a exibir os dados corretamente' },
          { tag: 'fix',    text: 'Colunas da tabela Pedidos de Compra reordenadas e centralizadas' },
          { tag: 'new',    text: 'Modal de Confirmar Recebimento com data e valor da compra' },
          { tag: 'fix',    text: 'Tela em branco corrigida — inicialização Firebase estava ausente' },
          { tag: 'new',    text: 'Edição inline na tabela: clique em qualquer célula para editar' },
          { tag: 'new',    text: 'Aviso ao editar semanas passadas' },
        ]
      },
      {
        version: '0.91',
        date: '22/06/2026',
        title: 'Logo e identidade visual',
        latest: false,
        changes: [
          { tag: 'change', text: 'Logo da sidebar atualizado para o ícone oficial Clinicorp' },
          { tag: 'change', text: 'Subtítulo da aba Estoque Central agora exibe "Insumos da Máquina Clinipay"' },
          { tag: 'new',    text: 'Histórico de versões adicionado na aba de Logs' },
          { tag: 'new',    text: 'Popup de novidades exibido ao entrar em um novo dispositivo ou versão' },
        ]
      },
      {
        version: '0.9',
        date: '22/06/2026',
        title: 'Aba Pedidos de Compra',
        changes: [
          { tag: 'new',    text: 'Nova aba "Pedidos de Compra" para Admin e Assistente de OPS' },
          { tag: 'new',    text: 'Registro de pedidos com insumo, ticket, data e quantidade solicitada' },
          { tag: 'new',    text: 'Confirmação de chegada com data e valor de compra (opcional)' },
          { tag: 'improve',text: 'Confirmação de chegada atualiza automaticamente Custos e estoque da semana atual' },
          { tag: 'improve',text: 'Logs de pedidos criados e confirmados com badges de cor no Histórico' },
        ]
      },
      {
        version: '0.8',
        date: '19/06/2026',
        title: 'Gerenciamento de itens e relatórios avançados',
        changes: [
          { tag: 'new',    text: 'Botão (+) nos mini-cards para adicionar novos insumos (Admin e Assistente de OPS)' },
          { tag: 'new',    text: 'Edição de nome/quantidade mínima diretamente nos mini-cards (Admin)' },
          { tag: 'new',    text: 'Exclusão de itens com opção de restauração no Histórico de Logs' },
          { tag: 'improve',text: 'Relatórios: chips de período (4/8/12/Todas semanas) e seletor multi-item' },
          { tag: 'fix',    text: 'Relatórios: semanas futuras ou vazias excluídas do gráfico' },
          { tag: 'fix',    text: 'Relatórios: direção cronológica correta (semanas mais antigas à esquerda)' },
        ]
      },
      {
        version: '0.7',
        date: '15/06/2026',
        title: 'Atualização automática e controle de acesso',
        changes: [
          { tag: 'new',    text: 'Verificação automática de versão — recarga silenciosa ao detectar nova versão' },
          { tag: 'new',    text: 'Botão "Atualizar Sistema" na sidebar com destaque animado para versões novas' },
          { tag: 'new',    text: 'Logout automático diário às 8h para forçar atualização' },
        ]
      },
      {
        version: '0.6',
        date: '10/06/2026',
        title: 'Aba de Custos e inativação de itens',
        changes: [
          { tag: 'new',    text: 'Aba de Custos com valor unitário, custo total e valor de inventário' },
          { tag: 'new',    text: 'Inativação de itens nos mini-cards: oculta alertas sem deletar dados' },
          { tag: 'improve',text: 'Cards de resumo: contador de máquinas editável pelo Admin' },
          { tag: 'fix',    text: 'Formatação monetária corrigida (R$ com separadores BR)' },
        ]
      },
      {
        version: '0.5',
        date: '05/06/2026',
        title: 'Firebase em tempo real e controle de usuários',
        changes: [
          { tag: 'new',    text: 'Banco de dados Firebase Realtime — dados sincronizados em tempo real' },
          { tag: 'new',    text: 'Sistema de perfis: Admin, Jovem Aprendiz, Assistente de OPS, Visualizador' },
          { tag: 'new',    text: 'Histórico de Logs com registro de todas as edições por usuário' },
          { tag: 'new',    text: 'Modal de reporte de bug estilo Sherlock Holmes' },
          { tag: 'improve',text: 'Tabela mostra semana atual por padrão; botão para ver todas as semanas' },
        ]
      },
    ];

    // --------------------------------------------------------
    // CHANGELOG POPUP — exibe novidades ao logar em versão nova
    // --------------------------------------------------------
    function checkAndShowChangelog() {
      const SEEN_KEY   = 'clinicorp_changelog_seen';
      const currentVer = localStorage.getItem('clinicorp_app_version') || '0';
      const seenVer    = localStorage.getItem(SEEN_KEY) || '';
      if (seenVer === currentVer) return;

      // Collect unseen versions
      const seenIdx  = CHANGELOG.findIndex(v => v.version === seenVer);
      const unseen   = seenIdx === -1 ? CHANGELOG : CHANGELOG.slice(0, seenIdx);
      if (!unseen.length) return;

      localStorage.setItem(SEEN_KEY, currentVer);

      const modal = document.createElement('div');
      modal.id = 'changelog-modal';
      modal.innerHTML = `
        <div class="cl-box">
          <div style="padding:22px 24px 16px;border-bottom:1px solid #F1F5F9;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
            <div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                <span style="font-size:22px;">🚀</span>
                <h2 style="margin:0;font-size:17px;font-weight:700;color:#1E293B;">Novidades do Sistema</h2>
              </div>
              <p style="margin:0;font-size:12px;color:#94A3B8;">Atualização v${unseen[0].version} — confira o que mudou</p>
            </div>
            <button id="cl-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94A3B8;padding:2px 6px;">×</button>
          </div>
          <div style="overflow-y:auto;padding:20px 24px;flex:1;">
            ${unseen.map(v => `
              <div style="margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                  <span style="background:#E85D04;color:#fff;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;">v${v.version}</span>
                  <span style="font-size:13px;font-weight:700;color:#1E293B;">${v.title}</span>
                  <span style="font-size:11px;color:#94A3B8;margin-left:auto;">${v.date}</span>
                </div>
                <ul style="margin:0;padding:0;list-style:none;">
                  ${v.changes.map(c => {
                    const tags = { new:'#DCFCE7|#16A34A|NOVO', fix:'#FEE2E2|#DC2626|FIX', improve:'#EFF6FF|#2563EB|MELHORIA', change:'#FFF7ED|#C2410C|MUDANÇA' };
                    const [bg, col, lbl] = (tags[c.tag] || '#F1F5F9|#64748B|INFO').split('|');
                    return `<li style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #F8FAFC;font-size:13px;color:#475569;">
                      <span style="background:${bg};color:${col};font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;margin-top:1px;">${lbl}</span>
                      ${c.text}
                    </li>`;
                  }).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
          <div style="padding:14px 24px 18px;border-top:1px solid #F1F5F9;display:flex;justify-content:flex-end;">
            <button id="cl-ok" style="padding:9px 24px;border-radius:8px;border:none;background:#E85D04;color:#fff;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;">Entendido!</button>
          </div>
        </div>`;

      document.body.appendChild(modal);
      const close = () => modal.remove();
      modal.querySelector('#cl-close').addEventListener('click', close);
      modal.querySelector('#cl-ok').addEventListener('click', close);
      modal.addEventListener('click', e => { if (e.target === modal) close(); });
    }

    // --------------------------------------------------------
    // VERSION HISTORY render
    // --------------------------------------------------------
    function renderVersionHistory() {
      const container = document.getElementById('version-history-container');
      if (!container) return;
      container.innerHTML = CHANGELOG.map(v => `
        <div class="ver-card ${v.latest ? 'ver-card--latest' : ''}">
          <div class="ver-header">
            <span class="ver-badge ${v.latest ? 'ver-badge--latest' : ''}">v${v.version}</span>
            <span class="ver-title">${v.title}</span>
            <span class="ver-date">${v.date}</span>
            ${v.latest ? '<span style="font-size:11px;font-weight:700;color:#10B981;background:#F0FDF4;padding:2px 9px;border-radius:20px;">ATUAL</span>' : ''}
          </div>
          <ul class="ver-changes">
            ${v.changes.map(c => `
              <li>
                <span class="ver-tag ver-tag--${c.tag}">${
                  {new:'NOVO',fix:'FIX',improve:'MELHORIA',change:'MUDANÇA'}[c.tag] || c.tag.toUpperCase()
                }</span>
                ${c.text}
              </li>`).join('')}
          </ul>
        </div>`).join('');
    }

    // --------------------------------------------------------
    // LOGS SUB-TAB switch (global so onclick= works)
    // --------------------------------------------------------
    window.switchLogsTab = function(tab) {
      document.getElementById('logs-panel-activity').style.display  = tab === 'activity'  ? '' : 'none';
      document.getElementById('logs-panel-versions').style.display  = tab === 'versions'  ? '' : 'none';
      document.getElementById('logs-tab-activity').classList.toggle('logs-subtab--active', tab === 'activity');
      document.getElementById('logs-tab-versions').classList.toggle('logs-subtab--active', tab === 'versions');
      if (tab === 'versions') renderVersionHistory();
    };

    function rebuildItems() {
      const deleted   = new Set(Object.keys(deletedItemsData));
      const overrides = itemOverridesData;
      items = [...initialItems, ...Object.values(customItemsData)]
        .filter(it => !deleted.has(it.id))
        .map(it => ({
          ...it,
          name: overrides[it.id]?.name ?? it.name,
          min:  overrides[it.id]?.min  ?? it.min,
        }));
    }

    // --------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------
    const monthsPt = ['janeiro','fevereiro','março','abril','maio','junho',
                      'julho','agosto','setembro','outubro','novembro','dezembro'];

    function parseDateStr(dateStr) {
      if (!dateStr) return new Date(9999, 0, 1);
      const match = dateStr.match(/(\d+)\s+de\s+([a-zçá]+)/i);
      if (match) {
        const d = parseInt(match[1]);
        const m = monthsPt.indexOf(match[2].toLowerCase());
        if (m !== -1) return new Date(2026, m, d);
      }
      return new Date(9999, 0, 1);
    }

    const getCurrentStockWithDetails = () => {
      return items.map(item => {
        let latestVal = '-', latestWeek = '';
        for (let i = weeksData.length - 1; i >= 0; i--) {
          const v = weeksData[i].values[item.id];
          if (v !== undefined && v !== '' && v !== '-') {
            latestVal = v; latestWeek = weeksData[i].week; break;
          }
        }
        const inactive = inactiveItems.has(item.id);
        const isAlert  = !inactive && latestVal !== '-' && Number(latestVal) < item.min;
        return { id: item.id, name: item.name, min: item.min, value: latestVal, week: latestWeek, isAlert, inactive };
      });
    };

    const getCurrentStockValues = () => {
      const s = {};
      getCurrentStockWithDetails().forEach(d => { s[d.id] = d.value; });
      return s;
    };

    // --------------------------------------------------------
    // FIREBASE — INIT E LISTENERS EM TEMPO REAL
    // --------------------------------------------------------
    function initData() {
      items = initialItems;

      const _refreshAfterItemChange = () => {
        items.forEach(it => rptSelected.add(it.id));
        const chipContainer = document.getElementById('rpt-item-chips');
        if (chipContainer) chipContainer.innerHTML = '';
        renderTable();
        renderCards();
        if (document.getElementById('costs-view')?.classList.contains('active')) renderCosts();
        if (document.getElementById('logs-view')?.classList.contains('active')) renderLogs();
      };

      db.ref('clinicorp/customItems').on('value', snap => {
        customItemsData = snap.val() || {};
        rebuildItems();
        _refreshAfterItemChange();
      });

      db.ref('clinicorp/deletedItems').on('value', snap => {
        deletedItemsData = snap.val() || {};
        rebuildItems();
        _refreshAfterItemChange();
      });

      db.ref('clinicorp/itemOverrides').on('value', snap => {
        itemOverridesData = snap.val() || {};
        rebuildItems();
        _refreshAfterItemChange();
      });

      // Card order — Admin reordering
      db.ref('clinicorp/config/cardOrder').on('value', snap => {
        cardOrder = snap.val() || [];
        renderCards();
      });

      // Machine count — Firebase (tempo real)
      db.ref('clinicorp/config/machineCount').on('value', snap => {
        machineCount = snap.val();
        renderCards();
      });

      // Inactive items listener
      db.ref('clinicorp/config/inactiveItems').on('value', snap => {
        const data = snap.val();
        inactiveItems = new Set(data ? Object.keys(data).filter(k => data[k]) : []);
        renderTable();
        renderCards();
      });

      db.ref('clinicorp/weeksData').on('value', snap => {
        const data = snap.val();
        if (data) {
          weeksData = Array.isArray(data) ? data : Object.values(data);
        } else {
          weeksData = buildInitialWeeksStructure();
          db.ref('clinicorp/weeksData').set(weeksData);
        }
        renderTable();
        renderCards();
      });

      db.ref('clinicorp/logsData').on('value', snap => {
        const data = snap.val();
        logsData = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        if (document.getElementById('logs-view')?.classList.contains('active')) {
          renderLogs();
        }
      });

      // Purchase orders listener
      db.ref('clinicorp/purchaseOrders').on('value', snap => {
        purchaseOrdersData = snap.val() || {};
        if (document.getElementById('orders-view')?.classList.contains('active')) renderPurchaseOrders();
      });

      // Costs listener
      db.ref('clinicorp/costs').on('value', snap => {
        const data = snap.val();
        if (data) {
          costsData = data;
        } else {
          // Seed from initialCosts
          costsData = {};
          initialCosts.forEach(item => { costsData[item.id] = item; });
          db.ref('clinicorp/costs').set(costsData);
        }
        // Atualiza card de valor do estoque sempre que custos mudam
        renderCards();
        if (document.getElementById('costs-view')?.classList.contains('active')) {
          renderCosts();
        }
      });

      // Costs history listener
      db.ref('clinicorp/costsHistory').on('value', snap => {
        const data = snap.val();
        costsHistoryData = data ? Object.values(data).reverse() : [];
        if (document.getElementById('costs-view')?.classList.contains('active')) {
          renderCosts();
          if (document.getElementById('costs-panel-history')?.style.display !== 'none') renderCostsHistory();
        }
      });
    }

    function buildInitialWeeksStructure() {
      let weeks = JSON.parse(JSON.stringify(initialWeeksData));

      while (weeks.length < 52) {
        const last = weeks[weeks.length - 1];
        const num  = parseInt((last.week.match(/\d+/) || [weeks.length])[0]) + 1;
        const newW = { week: `Semana ${num}`, date: '', values: {} };
        items.forEach(item => { newW.values[item.id] = ''; });
        weeks.push(newW);
      }

      const baseDate = new Date(2026, 1, 13);
      weeks.forEach(w => {
        const match = w.week.match(/\d+/);
        if (match) {
          const weekNum = parseInt(match[0]);
          const d = new Date(baseDate);
          d.setDate(d.getDate() + (weekNum - 8) * 7);
          w.date = `sexta-feira ${d.getDate()} de ${monthsPt[d.getMonth()]}`;
        }
      });

      const today = new Date(); today.setHours(0, 0, 0, 0);
      weeks.forEach(w => {
        if (parseDateStr(w.date) < today) {
          items.forEach(item => {
            const v = w.values[item.id];
            if (v === '' || v === null || v === undefined) w.values[item.id] = '-';
          });
        }
      });

      return weeks;
    }

    function saveData() {
      db.ref('clinicorp/weeksData').set(weeksData);
    }

    function saveLogs() {
      db.ref('clinicorp/logsData').set(logsData);
    }

    function addLog(weekName, columnName, actionMsg) {
      const now = new Date();
      logsData.unshift({
        datetime: now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR'),
        week:     weekName,
        column:   columnName,
        action:   actionMsg,
        user:     localStorage.getItem('clinicorp_role') || 'Desconhecido'
      });
      saveLogs();
    }

    function addCostHistory(id, itemName, fieldLabel, oldVal, newVal) {
      const now = new Date();
      const entry = {
        datetime: now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR'),
        itemId: id,
        itemName,
        field: fieldLabel,
        oldValue: String(oldVal),
        newValue: String(newVal),
        user: localStorage.getItem('clinicorp_role') || 'Desconhecido'
      };
      // Add to main logs too
      addLog('Custos', itemName, fieldLabel + ': ' + String(oldVal) + ' → ' + String(newVal));
      // Push to costs history
      db.ref('clinicorp/costsHistory').push(entry);
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO
    // --------------------------------------------------------
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'dashboard-view') {
          pageTitle.textContent    = 'Estoque Central';
          pageSubtitle.textContent = 'Insumos da Máquina Clinipay';
          document.querySelector('.header-actions').style.display = 'flex';
          renderTable();
        } else if (targetId === 'reports-view') {
          pageTitle.textContent    = 'Relatório';
          pageSubtitle.textContent = 'Análise de consumo dos insumos ao longo do tempo.';
          document.querySelector('.header-actions').style.display = 'none';
          initReports();
        } else if (targetId === 'logs-view') {
          pageTitle.textContent    = 'Histórico de Logs';
          pageSubtitle.textContent = 'Registro de alterações feitas por cada usuário.';
          document.querySelector('.header-actions').style.display = 'none';
          renderLogs();
          // reset sub-tab to activity on nav
          switchLogsTab('activity');
        } else if (targetId === 'costs-view') {
          pageTitle.textContent    = 'Custos dos Insumos';
          pageSubtitle.textContent = 'Valores unitários e totais do inventário de insumos.';
          document.querySelector('.header-actions').style.display = 'none';
          renderCosts();
        } else if (targetId === 'orders-view') {
          pageTitle.textContent    = 'Pedidos de Compra';
          pageSubtitle.textContent = 'Gerencie pedidos e confirme chegada de insumos.';
          document.querySelector('.header-actions').style.display = 'none';
          renderPurchaseOrders();
        }
      });
    });

    // --------------------------------------------------------
    // EXPORT — CSV, PDF, E-MAIL
    // --------------------------------------------------------
    function getActiveItems() {
      return items.filter(it => !inactiveItems.has(it.id));
    }

    // ── Meses em português ───────────────────────────────────
    const MESES_PT   = { 'janeiro':1,'fevereiro':2,'março':3,'abril':4,'maio':5,'junho':6,
                         'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12 };
    const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    function getWeekMonth(w) {
      if (!w.date) return null;
      const m = w.date.match(/de\s+([a-záçã]+)/i);
      return m ? (MESES_PT[m[1].toLowerCase()] || null) : null;
    }

    function getAvailableMonths() {
      const seen = new Map();
      weeksData.forEach(w => {
        const mon = getWeekMonth(w);
        if (mon && !seen.has(mon)) seen.set(mon, MESES_NOME[mon - 1]);
      });
      return [...seen.entries()].sort((a, b) => a[0] - b[0]);
    }

    function getPeriodLabel(period, monthNum) {
      const yr = new Date().getFullYear();
      if (period === 'current-week')  return 'Semana Atual';
      if (period === 'last-week')     return 'Última Semana';
      if (period === 'current-month') return `${MESES_NOME[new Date().getMonth()]} de ${yr}`;
      if (period === 'select-month')  return `${MESES_NOME[monthNum - 1]} de ${yr}`;
      return '';
    }

    function filterWeeksByPeriod(period, monthNum) {
      const filled = weeksData.filter(w =>
        items.some(it => { const v = w.values[it.id]; return v !== undefined && v !== '' && v !== '-'; })
      );
      if (period === 'current-week')  return filled.slice(-1);
      if (period === 'last-week')     return filled.length >= 2 ? [filled[filled.length - 2]] : filled.slice(-1);
      if (period === 'current-month') return weeksData.filter(w => getWeekMonth(w) === new Date().getMonth() + 1);
      if (period === 'select-month')  return weeksData.filter(w => getWeekMonth(w) === monthNum);
      return weeksData;
    }

    // ── Modal de seleção de período ──────────────────────────
    function showExportModal(type) {
      const existing = document.getElementById('export-period-modal');
      if (existing) existing.remove();

      const availableMonths = getAvailableMonths();
      const curMonthNum     = new Date().getMonth() + 1;
      const curMonthName    = MESES_NOME[new Date().getMonth()];

      const monthOpts = availableMonths
        .map(([num, name]) => `<option value="${num}"${num === curMonthNum ? ' selected' : ''}>${name}</option>`)
        .join('');

      const overlay = document.createElement('div');
      overlay.id = 'export-period-modal';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;';

      const icon  = type === 'pdf' ? '📄' : '✉️';
      const title = type === 'pdf' ? 'Exportar PDF' : 'Exportar por E-mail';
      const btnLabel = type === 'pdf' ? 'Gerar PDF' : 'Abrir E-mail';

      const radioStyle = 'display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:9px;cursor:pointer;transition:border-color .15s;';

      overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:28px 30px;width:380px;box-shadow:0 20px 60px rgba(0,0,0,.22);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-size:22px;">${icon}</span>
            <h3 style="margin:0;font-size:16px;font-weight:700;color:#0F172A;">${title}</h3>
            <button id="epm-close" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:20px;color:#94A3B8;line-height:1;">×</button>
          </div>
          <p style="margin:0 0 16px;font-size:12px;color:#64748B;">Selecione o período do relatório:</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
            <label id="epm-l1" style="${radioStyle}">
              <input type="radio" name="epm-period" value="current-week" checked style="accent-color:#E85D04;">
              <span style="font-size:13px;color:#0F172A;font-weight:500;">Semana atual</span>
            </label>
            <label id="epm-l2" style="${radioStyle}">
              <input type="radio" name="epm-period" value="last-week" style="accent-color:#E85D04;">
              <span style="font-size:13px;color:#0F172A;font-weight:500;">Última semana registrada</span>
            </label>
            <label id="epm-l3" style="${radioStyle}">
              <input type="radio" name="epm-period" value="current-month" style="accent-color:#E85D04;">
              <span style="font-size:13px;color:#0F172A;font-weight:500;">Mês atual &nbsp;<span style="color:#64748B;">(${curMonthName})</span></span>
            </label>
            <label id="epm-l4" style="${radioStyle}">
              <input type="radio" name="epm-period" value="select-month" style="accent-color:#E85D04;">
              <span style="font-size:13px;color:#0F172A;font-weight:500;">Selecionar mês:</span>
              <select id="epm-month" style="border:1px solid #E2E8F0;border-radius:7px;padding:4px 8px;font-size:12px;font-family:inherit;color:#0F172A;">${monthOpts}</select>
            </label>
          </div>
          <div style="display:flex;gap:10px;">
            <button id="epm-cancel" style="flex:1;padding:10px;border:1.5px solid #E2E8F0;border-radius:9px;background:#fff;color:#64748B;font-size:13px;font-family:inherit;cursor:pointer;">Cancelar</button>
            <button id="epm-confirm" style="flex:1;padding:10px;border:none;border-radius:9px;background:#E85D04;color:#fff;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;">${btnLabel}</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      overlay.querySelector('#epm-close').addEventListener('click', close);
      overlay.querySelector('#epm-cancel').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

      // Highlight active label
      const labels = ['epm-l1','epm-l2','epm-l3','epm-l4'];
      const highlightActive = () => {
        labels.forEach(id => {
          const lbl = overlay.querySelector(`#${id}`);
          const inp = lbl.querySelector('input');
          lbl.style.borderColor = inp.checked ? '#E85D04' : '#E2E8F0';
          lbl.style.background  = inp.checked ? '#FFF7F0' : '#fff';
        });
      };
      overlay.querySelectorAll('input[name="epm-period"]').forEach(r => r.addEventListener('change', highlightActive));
      highlightActive();

      overlay.querySelector('#epm-confirm').addEventListener('click', () => {
        const period   = overlay.querySelector('input[name="epm-period"]:checked').value;
        const monthNum = parseInt(overlay.querySelector('#epm-month').value);
        const filtered = filterWeeksByPeriod(period, monthNum);
        close();
        if (type === 'pdf') generatePDF(filtered, period, monthNum);
        else                generateEmail(filtered, period, monthNum);
      });
    }

    // ── PDF ─────────────────────────────────────────────────
    function generatePDF(filteredWeeks, period, monthNum) {
      const activeItems   = getActiveItems();
      const now           = new Date().toLocaleDateString('pt-BR');
      const periodLabel   = getPeriodLabel(period, monthNum);
      const stockDetails  = getCurrentStockWithDetails();
      const alertItems    = stockDetails.filter(d => d.isAlert && !d.inactive);
      const currentRole   = localStorage.getItem('clinicorp_role') || '—';

      let totalValue = 0;
      stockDetails.forEach(d => {
        const cost = costsData[d.id];
        const qty  = parseFloat(d.value);
        if (cost && cost.unitValue && !isNaN(qty)) totalValue += cost.unitValue * qty;
      });

      const weeksRows = filteredWeeks.map(w =>
        `<tr>
          <td class="lft">${w.week || ''}</td>
          <td class="lft date-col">${w.date || ''}</td>
          ${activeItems.map(it => {
            const v   = w.values[it.id];
            const val = (v === undefined || v === '' || v === '-') ? '—' : v;
            const bad = it.min != null && val !== '—' && Number(val) < it.min;
            return `<td class="${bad ? 'alert-td' : ''}">${val}</td>`;
          }).join('')}
        </tr>`
      ).join('');

      const itemCards = activeItems.map(it => {
        const d       = stockDetails.find(s => s.id === it.id) || {};
        const val     = d.value ?? '—';
        const isAlert = d.isAlert;
        const cost    = costsData[it.id];
        const unit    = cost?.unitValue ? cost.unitValue.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—';
        const total   = cost?.unitValue && val !== '—'
          ? (cost.unitValue * parseFloat(val)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—';
        return `
          <div class="ic ${isAlert ? 'ic-alert' : ''}">
            <div class="ic-name">${it.name}</div>
            <div class="ic-qty ${isAlert ? 'ic-red' : ''}">${val}</div>
            <div class="ic-sub">Mín: ${it.min ?? '—'} &nbsp;|&nbsp; Unit: ${unit}</div>
            <div class="ic-total">${total}</div>
          </div>`;
      }).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Estoque CliniPay — ${periodLabel}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;padding:24px;background:#fff}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #E85D04;margin-bottom:18px}
.logo{font-size:20px;font-weight:800;color:#E85D04}.logo span{color:#1E293B}
.meta{text-align:right;color:#64748B;font-size:10px;line-height:1.7}
.period{font-size:14px;font-weight:700;color:#0F172A}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
.kpi{background:#F8FAFC;border-radius:8px;padding:11px 14px;border-left:3px solid #E85D04}
.kpi-lbl{font-size:9px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.kpi-val{font-size:19px;font-weight:800;color:#0F172A;margin-top:2px}
.kpi-val.red{color:#EF4444}
.sec-title{font-size:12px;font-weight:700;color:#0F172A;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #E2E8F0}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:18px}
.ic{border:1px solid #E2E8F0;border-radius:8px;padding:9px 11px}
.ic-alert{border-color:#FCA5A5;background:#FFF5F5}
.ic-name{font-size:9px;font-weight:600;color:#64748B;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ic-qty{font-size:21px;font-weight:800;color:#0F172A}
.ic-red{color:#EF4444}
.ic-sub{font-size:8.5px;color:#94A3B8;margin-top:1px}
.ic-total{font-size:10px;font-weight:600;color:#E85D04;margin-top:3px}
.alerts-box{background:#FFF5F5;border:1px solid #FCA5A5;border-radius:8px;padding:11px 14px;margin-bottom:18px}
.alerts-box h3{font-size:11px;color:#DC2626;font-weight:700;margin-bottom:6px}
.alert-row{font-size:10px;color:#991B1B;padding:2px 0}
table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:18px}
th{background:#F8FAFC;color:#64748B;font-weight:700;padding:7px 5px;text-align:center;border:1px solid #E2E8F0;font-size:8.5px}
td{padding:6px 5px;text-align:center;border:1px solid #F1F5F9}
td.lft{text-align:left;color:#64748B}
td.date-col{font-size:9.5px;white-space:nowrap}
td.alert-td{color:#EF4444;font-weight:700}
tr:nth-child(even) td{background:#FAFAFA}
.min-row td{background:#FFF7F0!important;color:#E85D04;font-weight:700}
.footer{margin-top:16px;padding-top:10px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:8.5px;color:#94A3B8}
@media print{@page{margin:14mm}body{padding:0}}
</style></head><body>
<div class="hdr">
  <div>
    <div class="logo">Clinicorp<span>Insumos</span></div>
    <div style="font-size:10px;color:#64748B;margin-top:3px;">Relatório de Controle de Estoque</div>
  </div>
  <div class="meta">
    <div class="period">${periodLabel}</div>
    <div>Gerado em ${now}</div>
    <div>Usuário: ${currentRole}</div>
  </div>
</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-lbl">Insumos Ativos</div><div class="kpi-val">${activeItems.length}</div></div>
  <div class="kpi"><div class="kpi-lbl">Alertas</div><div class="kpi-val ${alertItems.length > 0 ? 'red' : ''}">${alertItems.length}</div></div>
  <div class="kpi"><div class="kpi-lbl">Valor do Inventário</div><div class="kpi-val">${totalValue.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div></div>
</div>
${alertItems.length > 0 ? `<div class="alerts-box"><h3>⚠️ Estoque abaixo do mínimo</h3>${alertItems.map(d=>`<div class="alert-row">• ${d.name}: ${d.value} un. &nbsp;(mínimo: ${d.min})</div>`).join('')}</div>` : ''}
<div class="sec-title">Estoque Atual por Insumo</div>
<div class="grid">${itemCards}</div>
${filteredWeeks.length > 0 ? `
<div class="sec-title">Histórico do Período — ${filteredWeeks.length} semana(s)</div>
<table>
  <thead><tr><th style="text-align:left">Semana</th><th style="text-align:left">Data</th>${activeItems.map(it=>`<th>${it.name}</th>`).join('')}</tr></thead>
  <tbody>
    <tr class="min-row"><td class="lft" colspan="2">Qtd. Mínima</td>${activeItems.map(it=>`<td>${it.min??'—'}</td>`).join('')}</tr>
    ${weeksRows}
  </tbody>
</table>` : ''}
<div class="footer"><span>Clinicorp — Operações CliniPay</span><span>matheusleal7.github.io/estoque-clinicorp</span></div>
</body></html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }

    // ── E-MAIL ───────────────────────────────────────────────
    function generateEmail(filteredWeeks, period, monthNum) {
      const activeItems  = getActiveItems();
      const now          = new Date().toLocaleDateString('pt-BR');
      const periodLabel  = getPeriodLabel(period, monthNum);
      const stockDetails = getCurrentStockWithDetails();
      const alertItems   = stockDetails.filter(d => d.isAlert && !d.inactive);

      let totalValue = 0;
      stockDetails.forEach(d => {
        const cost = costsData[d.id];
        const qty  = parseFloat(d.value);
        if (cost && cost.unitValue && !isNaN(qty)) totalValue += cost.unitValue * qty;
      });

      const div = '─'.repeat(52);
      let body  = '';

      body += `RELATÓRIO DE ESTOQUE — CLINICORP INSUMOS\n`;
      body += `${div}\n`;
      body += `Período   : ${periodLabel}\n`;
      body += `Gerado em : ${now}\n`;
      body += `${div}\n\n`;

      body += `RESUMO GERAL\n`;
      body += `  Insumos monitorados  :  ${activeItems.length}\n`;
      body += `  Alertas ativos       :  ${alertItems.length}${alertItems.length > 0 ? '  ⚠️' : '  ✅'}\n`;
      body += `  Valor do inventário  :  ${totalValue.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}\n\n`;

      if (alertItems.length > 0) {
        body += `⚠️  ATENÇÃO — ITENS ABAIXO DO MÍNIMO\n`;
        body += `${div}\n`;
        alertItems.forEach(d => {
          body += `  • ${d.name}\n`;
          body += `      Quantidade atual : ${d.value}  |  Mínimo exigido : ${d.min}\n`;
        });
        body += `\n`;
      }

      body += `ESTOQUE ATUAL POR INSUMO\n`;
      body += `${div}\n`;
      activeItems.forEach(it => {
        const d     = stockDetails.find(s => s.id === it.id) || {};
        const val   = d.value ?? '—';
        const alert = d.isAlert;
        const cost  = costsData[it.id];
        const total = cost?.unitValue && val !== '—'
          ? (cost.unitValue * parseFloat(val)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—';
        body += `  ${alert ? '⚠️' : '✅'}  ${it.name}\n`;
        body += `       Qtd: ${val}   |   Mín: ${it.min??'—'}   |   Valor total: ${total}\n\n`;
      });

      if (filteredWeeks.length > 0) {
        body += `HISTÓRICO DE SEMANAS — ${periodLabel.toUpperCase()}\n`;
        body += `${div}\n`;
        filteredWeeks.forEach(w => {
          body += `  ${w.week || ''}${w.date ? `  —  ${w.date}` : ''}\n`;
          activeItems.forEach(it => {
            const v = w.values[it.id];
            if (v !== undefined && v !== '' && v !== '-') {
              const bad = it.min != null && Number(v) < it.min;
              body += `     ${it.name}: ${v}${bad ? '  ⚠️' : ''}\n`;
            }
          });
          body += `\n`;
        });
      }

      body += `${div}\n`;
      body += `Acesse o sistema completo:\n`;
      body += `https://matheusleal7.github.io/estoque-clinicorp/\n\n`;
      body += `Clinicorp — Operações CliniPay`;

      const subject = encodeURIComponent(`Relatório de Estoque CliniPay — ${periodLabel}`);
      window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    }

    // ── Botões ───────────────────────────────────────────────
    function buildCSV() {
      const activeItems = getActiveItems();
      const header = ['Semana', 'Data', ...activeItems.map(it => it.name)];
      const rows = weeksData.map(w => [
        w.week || '',
        w.date  || '',
        ...activeItems.map(it => {
          const v = w.values[it.id];
          return (v === undefined || v === '' || v === '-') ? '' : v;
        })
      ]);
      return [header, ...rows]
        .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
    }

    const btnCSV = document.getElementById('btn-export');
    if (btnCSV) {
      btnCSV.addEventListener('click', () => {
        const csv  = buildCSV();
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `estoque-clinicorp-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const btnPDF = document.getElementById('btn-export-pdf');
    if (btnPDF) btnPDF.addEventListener('click', () => showExportModal('pdf'));

    const btnEmail = document.getElementById('btn-share-email');
    if (btnEmail) btnEmail.addEventListener('click', () => showExportModal('email'));

    // --------------------------------------------------------
    // DASHBOARD — CARDS
    // --------------------------------------------------------
    function renderCards() {
      cardTotalItems.textContent = machineCount !== null ? machineCount : '—';
      const machinesContainer = document.getElementById('card-machines-container');
      if (machinesContainer) {
        machinesContainer.style.cursor = canManage ? 'pointer' : 'default';
        machinesContainer.title = canManage ? 'Clique para atualizar a contagem' : '';
        machinesContainer.onclick = canManage ? () => {
          const val = prompt('Quantidade de Máquinas em Estoque:', machineCount ?? '');
          if (val !== null && !isNaN(parseInt(val))) {
            db.ref('clinicorp/config/machineCount').set(parseInt(val));
          }
        } : null;
      }

      // Valor total do estoque = soma de (unitValue × qtd atual) por item
      const stockDetails = getCurrentStockWithDetails();
      let totalInventoryValue = 0;
      stockDetails.forEach(d => {
        const cost = costsData[d.id];
        const qty  = parseFloat(d.value);
        if (cost && cost.unitValue && !isNaN(qty) && qty > 0) {
          totalInventoryValue += cost.unitValue * qty;
        }
      });
      cardWeeks.textContent = totalInventoryValue.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL'
      });

      const alertsCount = getCurrentStockWithDetails().filter(d => d.isAlert).length;
      cardAlerts.textContent = alertsCount;

      const miniContainer = document.getElementById('mini-cards-container');
      if (miniContainer) {
        miniContainer.innerHTML = '';

        // Sort details by saved cardOrder (Admin may have reordered)
        let stockDetails = getCurrentStockWithDetails();
        if (cardOrder.length) {
          const orderMap = {};
          cardOrder.forEach((id, i) => { orderMap[id] = i; });
          stockDetails = [...stockDetails].sort((a, b) =>
            (orderMap[a.id] ?? 9999) - (orderMap[b.id] ?? 9999)
          );
        }

        let dragSrcId = null;

        stockDetails.forEach(detail => {
          const div = document.createElement('div');

          if (detail.inactive) {
            // Inactive style: muted, strikethrough
            div.className = 'mini-card inactive-card';
            div.innerHTML = `
              <span class="mc-title" style="color:#94A3B8;">${detail.name}</span>
              <span class="mc-value" style="color:#CBD5E1;text-decoration:line-through;">${detail.value}</span>
              ${canManage ? '<span style="font-size:9px;color:#10B981;font-weight:600;letter-spacing:0.3px;margin-top:1px;">CLIQUE PARA ATIVAR</span>' : '<span style="font-size:9px;color:#94A3B8;margin-top:1px;">INATIVO</span>'}
            `;
          } else {
            div.className = `mini-card ${detail.isAlert ? 'warning' : ''}`;
            div.innerHTML = `
              <span class="mc-title">${detail.name}</span>
              <span class="mc-value">${detail.value}</span>
              ${canManage ? '<span class="mc-hint" style="font-size:9px;color:#CBD5E1;font-weight:500;margin-top:1px;opacity:0;">⊘ inativar</span>' : ''}
            `;
          }

          if (canManage) {
            div.style.position = 'relative';
            div.style.cursor   = 'pointer';
            div.title = detail.inactive ? 'Clique para ativar este item' : 'Clique para inativar este item';
            div.addEventListener('click', () => {
              if (detail.inactive) {
                db.ref('clinicorp/config/inactiveItems/' + detail.id).remove();
              } else {
                if (confirm(`Inativar "${detail.name}"? O item continuará visível mas não gerará alertas de estoque.`)) {
                  db.ref('clinicorp/config/inactiveItems/' + detail.id).set(true);
                }
              }
            });
            if (!detail.inactive) {
              div.addEventListener('mouseenter', () => {
                div.querySelector('.mc-hint').style.opacity = '1';
                adminActions.style.opacity = '1';
                adminActions.style.pointerEvents = 'auto';
              });
              div.addEventListener('mouseleave', () => {
                div.querySelector('.mc-hint').style.opacity = '0';
                adminActions.style.opacity = '0';
                adminActions.style.pointerEvents = 'none';
              });
            }

            // Admin action buttons (edit + delete)
            const adminActions = document.createElement('div');
            adminActions.style.cssText = 'position:absolute;top:4px;right:4px;display:flex;gap:3px;opacity:0;pointer-events:none;transition:opacity .15s;';

            const editBtn = document.createElement('button');
            editBtn.title = 'Editar nome / mínimo';
            editBtn.style.cssText = 'background:#EFF6FF;border:none;border-radius:5px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;';
            editBtn.textContent = '✏️';
            editBtn.addEventListener('click', e => { e.stopPropagation(); showEditItemModal(detail); });

            const delBtn = document.createElement('button');
            delBtn.title = 'Deletar item';
            delBtn.style.cssText = 'background:#FEF2F2;border:none;border-radius:5px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;';
            delBtn.textContent = '🗑️';
            delBtn.addEventListener('click', e => { e.stopPropagation(); deleteItem(detail); });

            adminActions.appendChild(editBtn);
            adminActions.appendChild(delBtn);
            div.appendChild(adminActions);
          }

          // Drag-to-reorder — Admin only
          if (canManage) {
            const handle = document.createElement('div');
            handle.className = 'mc-drag-handle';
            handle.title = 'Arrastar para reordenar';
            handle.innerHTML = '⠿';
            handle.draggable = true;
            handle.addEventListener('mousedown', e => e.stopPropagation());

            handle.addEventListener('dragstart', e => {
              dragSrcId = detail.id;
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', detail.id);
              setTimeout(() => div.classList.add('mc-dragging'), 0);
            });
            handle.addEventListener('dragend', () => {
              div.classList.remove('mc-dragging');
              miniContainer.querySelectorAll('.mc-drag-over').forEach(el => el.classList.remove('mc-drag-over'));
            });

            div.addEventListener('dragover', e => {
              if (!dragSrcId || dragSrcId === detail.id) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              miniContainer.querySelectorAll('.mc-drag-over').forEach(el => el.classList.remove('mc-drag-over'));
              div.classList.add('mc-drag-over');
            });
            div.addEventListener('dragleave', () => div.classList.remove('mc-drag-over'));
            div.addEventListener('drop', e => {
              e.preventDefault();
              div.classList.remove('mc-drag-over');
              const fromId = e.dataTransfer.getData('text/plain');
              if (!fromId || fromId === detail.id) return;

              // Build current ordered list and swap
              let order = cardOrder.length ? [...cardOrder] : stockDetails.map(d => d.id);
              stockDetails.forEach(d => { if (!order.includes(d.id)) order.push(d.id); });
              const fromIdx = order.indexOf(fromId);
              const toIdx   = order.indexOf(detail.id);
              if (fromIdx === -1 || toIdx === -1) return;
              order.splice(fromIdx, 1);
              order.splice(toIdx, 0, fromId);
              db.ref('clinicorp/config/cardOrder').set(order);
            });

            div.appendChild(handle);
          }

          miniContainer.appendChild(div);
        });

        // "+" button — only for canAddItems roles
        if (canAddItems) {
          const addBtn = document.createElement('div');
          addBtn.className = 'mini-card add-item-card';
          addBtn.title = 'Adicionar novo insumo';
          addBtn.innerHTML = `
            <span style="font-size:24px;font-weight:300;color:#E85D04;line-height:1;">+</span>
            <span class="mc-title" style="color:#E85D04;font-weight:600;font-size:10px;margin-top:2px;">Adicionar</span>
          `;
          addBtn.style.cssText = 'cursor:pointer;border:1.5px dashed #E85D04;opacity:0.7;transition:opacity .15s,background .15s;';
          addBtn.addEventListener('mouseenter', () => { addBtn.style.opacity = '1'; addBtn.style.background = '#FFF7F0'; });
          addBtn.addEventListener('mouseleave', () => { addBtn.style.opacity = '0.7'; addBtn.style.background = ''; });
          addBtn.addEventListener('click', showAddItemModal);
          miniContainer.appendChild(addBtn);
        }
      }
    }

    // --------------------------------------------------------
    // DELETAR ITEM
    // --------------------------------------------------------
    function deleteItem(detail) {
      if (!confirm(`Deletar "${detail.name}"?\n\nO item será removido do estoque, relatórios e custos.\nVocê poderá restaurá-lo no Histórico de Logs.`)) return;

      const now = new Date();
      const datetime = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
      const fullItem = [...initialItems, ...Object.values(customItemsData)].find(i => i.id === detail.id) || detail;

      db.ref('clinicorp/deletedItems/' + detail.id).set({
        ...fullItem,
        deletedAt: datetime,
        deletedBy: localStorage.getItem('clinicorp_role') || 'Admin',
        savedOverride: itemOverridesData[detail.id] || null
      });

      if (fullItem.isCustom) db.ref('clinicorp/customItems/' + detail.id).remove();
      db.ref('clinicorp/itemOverrides/' + detail.id).remove();
      db.ref('clinicorp/costs/' + detail.id).remove();

      logsData.unshift({
        datetime, type: 'item_deleted', itemId: detail.id,
        week: '—', column: detail.name,
        action: `Item deletado — qtd mín: ${detail.min}`,
        user: localStorage.getItem('clinicorp_role') || 'Admin'
      });
      saveLogs();
    }

    // --------------------------------------------------------
    // EDITAR ITEM
    // --------------------------------------------------------
    function showEditItemModal(detail) {
      if (document.getElementById('edit-item-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'edit-item-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;display:flex;align-items:center;justify-content:center;';

      const labelStyle = 'display:block;font-size:12px;font-weight:600;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;';
      const inputStyle = 'width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;outline:none;transition:border-color .15s;';

      overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:400px;max-width:94vw;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden;">
          <div style="padding:20px 24px 14px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700;color:#1E293B;">Editar Insumo</h3>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">A alteração será refletida em todas as telas.</p>
            </div>
            <button id="edit-item-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:#94A3B8;padding:4px;">×</button>
          </div>
          <div style="padding:20px 24px;">
            <label style="${labelStyle}">Nome do insumo</label>
            <input id="edit-item-name" type="text" value="${detail.name}" maxlength="60"
              style="${inputStyle}"
              onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            <div style="margin-top:14px;">
              <label style="${labelStyle}">Quantidade mínima</label>
              <input id="edit-item-min" type="number" min="0" value="${detail.min}"
                style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <p id="edit-item-err" style="color:#EF4444;font-size:12px;margin:10px 0 0;display:none;">O nome não pode ser vazio.</p>
          </div>
          <div style="padding:14px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #F1F5F9;">
            <button id="edit-item-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid #E2E8F0;background:#fff;color:#64748B;font-size:13px;font-family:inherit;cursor:pointer;">Cancelar</button>
            <button id="edit-item-save" style="padding:8px 20px;border-radius:8px;border:none;background:#E85D04;color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;">Salvar</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector('#edit-item-close').addEventListener('click', close);
      overlay.querySelector('#edit-item-cancel').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      setTimeout(() => { const inp = overlay.querySelector('#edit-item-name'); inp.focus(); inp.select(); }, 50);

      overlay.querySelector('#edit-item-save').addEventListener('click', () => {
        const newName = overlay.querySelector('#edit-item-name').value.trim();
        const newMin  = parseInt(overlay.querySelector('#edit-item-min').value) || 0;
        if (!newName) { overlay.querySelector('#edit-item-err').style.display = 'block'; return; }

        db.ref('clinicorp/itemOverrides/' + detail.id).set({ name: newName, min: newMin });
        if (customItemsData[detail.id]) db.ref('clinicorp/customItems/' + detail.id).update({ name: newName, min: newMin });
        if (costsData[detail.id])       db.ref('clinicorp/costs/' + detail.id + '/name').set(newName);

        const now = new Date();
        logsData.unshift({
          datetime: now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR'),
          type: 'item_edited', week: '—', column: detail.name,
          action: `Insumo editado: "${detail.name}" → "${newName}" (mín: ${detail.min} → ${newMin})`,
          user: localStorage.getItem('clinicorp_role') || 'Admin'
        });
        saveLogs();
        close();
      });
    }

    // --------------------------------------------------------
    // RESTAURAR ITEM DELETADO
    // --------------------------------------------------------
    function restoreItem(itemId) {
      const deleted = deletedItemsData[itemId];
      if (!deleted) return;

      const { deletedAt, deletedBy, savedOverride, ...itemData } = deleted;

      if (itemData.isCustom) db.ref('clinicorp/customItems/' + itemId).set(itemData);
      if (savedOverride)     db.ref('clinicorp/itemOverrides/' + itemId).set(savedOverride);

      db.ref('clinicorp/costs/' + itemId).set({
        id: itemId,
        name: savedOverride?.name ?? itemData.name,
        isCustom: itemData.isCustom || false,
        qtyBought: 0, totalCost: 0, unitCost: 0, lastPurchase: '-'
      });

      db.ref('clinicorp/deletedItems/' + itemId).remove();

      const now = new Date();
      logsData.unshift({
        datetime: now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR'),
        type: 'item_restored', week: '—',
        column: savedOverride?.name ?? itemData.name,
        action: `Item restaurado: "${savedOverride?.name ?? itemData.name}"`,
        user: localStorage.getItem('clinicorp_role') || 'Admin'
      });
      saveLogs();
    }

    // --------------------------------------------------------
    // ADICIONAR NOVO ITEM
    // --------------------------------------------------------
    function showAddItemModal() {
      if (document.getElementById('add-item-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'add-item-overlay';
      overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;
        display:flex;align-items:center;justify-content:center;
      `;

      overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:420px;max-width:94vw;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden;">
          <div style="padding:20px 24px 14px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700;color:#1E293B;">Adicionar Insumo</h3>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">O item será adicionado ao estoque, relatórios e custos.</p>
            </div>
            <button id="add-item-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:#94A3B8;padding:4px;">×</button>
          </div>
          <div style="padding:20px 24px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;">Nome do insumo *</label>
            <input id="add-item-name" type="text" placeholder="Ex: Papel bolha (PCT)" maxlength="60"
              style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;outline:none;transition:border-color .15s;"
              onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
              <div>
                <label style="display:block;font-size:12px;font-weight:600;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;">Qtd. inicial</label>
                <input id="add-item-qty" type="number" min="0" placeholder="0"
                  style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;outline:none;transition:border-color .15s;"
                  onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:600;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;">Qtd. mínima</label>
                <input id="add-item-min" type="number" min="0" placeholder="0"
                  style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;outline:none;transition:border-color .15s;"
                  onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
              </div>
            </div>
            <p id="add-item-err" style="color:#EF4444;font-size:12px;margin:10px 0 0;display:none;">Informe um nome para o insumo.</p>
          </div>
          <div style="padding:14px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #F1F5F9;">
            <button id="add-item-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid #E2E8F0;background:#fff;color:#64748B;font-size:13px;font-family:inherit;cursor:pointer;">Cancelar</button>
            <button id="add-item-save" style="padding:8px 20px;border-radius:8px;border:none;background:#E85D04;color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .15s;">Adicionar</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      overlay.querySelector('#add-item-close').addEventListener('click', close);
      overlay.querySelector('#add-item-cancel').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

      // Focus
      setTimeout(() => overlay.querySelector('#add-item-name').focus(), 50);

      overlay.querySelector('#add-item-save').addEventListener('click', () => {
        const nameInput = overlay.querySelector('#add-item-name');
        const qtyInput  = overlay.querySelector('#add-item-qty');
        const minInput  = overlay.querySelector('#add-item-min');
        const errEl     = overlay.querySelector('#add-item-err');

        const name    = nameInput.value.trim();
        const initQty = parseInt(qtyInput.value) || 0;
        const minQty  = parseInt(minInput.value) || 0;

        if (!name) {
          errEl.style.display = 'block';
          nameInput.focus();
          return;
        }

        const newId   = 'custom_' + Date.now();
        const newItem = { id: newId, name, min: minQty, isCustom: true };

        // 1. Salva o novo item no Firebase
        db.ref('clinicorp/customItems/' + newId).set(newItem);

        // 2. Adiciona a qtd inicial na semana atual
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let currentIdx = weeksData.findIndex(w => parseDateStr(w.date) >= today);
        if (currentIdx === -1) currentIdx = weeksData.length - 1;
        if (currentIdx >= 0) {
          weeksData[currentIdx].values[newId] = initQty;
          saveData();
        }

        // 3. Adiciona entrada em Custos
        db.ref('clinicorp/costs/' + newId).set({
          id: newId, name, isCustom: true,
          qtyBought: 0, totalCost: 0, unitCost: 0, lastPurchase: '-'
        });

        // 4. Log
        logsData.unshift({
          datetime: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
          type: 'item_added',
          item: name,
          action: `Novo insumo adicionado (qtd inicial: ${initQty}, mín: ${minQty})`,
          user: localStorage.getItem('clinicorp_role') || 'Desconhecido'
        });
        saveLogs();

        close();
      });
    }

    // --------------------------------------------------------
    // DASHBOARD — TABELA
    // --------------------------------------------------------
    function getVisibleWeeks() {
      if (showAllWeeks) return weeksData;

      const today = new Date(); today.setHours(0, 0, 0, 0);
      for (let i = 0; i < weeksData.length; i++) {
        if (parseDateStr(weeksData[i].date) >= today) {
          return [weeksData[i]];
        }
      }
      return [weeksData[weeksData.length - 1]];
    }

    function showHistoricalEditWarning(weekName) {
      const existing = document.getElementById('hist-edit-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'hist-edit-toast';
      toast.innerHTML = `
        <span style="font-size:15px;">⚠️</span>
        <span>Editando semana passada: <strong>${weekName}</strong></span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:17px;color:#92400E;padding:0;margin-left:6px;line-height:1;">×</button>
      `;
      toast.style.cssText = [
        'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);',
        'background:#FFFBEB;border:1.5px solid #F59E0B;color:#92400E;',
        'border-radius:10px;padding:11px 18px;display:flex;align-items:center;gap:10px;',
        'font-size:13px;font-family:\'Inter\',sans-serif;z-index:9999;',
        'box-shadow:0 4px 20px rgba(0,0,0,0.12);white-space:nowrap;',
        'animation:toastSlideUp 0.2s ease;'
      ].join('');
      document.body.appendChild(toast);
      setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
    }

    function renderTable() {
      if (!items.length) return;

      tableHeadRow.querySelectorAll('th:not(.sticky-col)').forEach(t => t.remove());
      tableMinRow.querySelectorAll('th:not(.sticky-col)').forEach(t => t.remove());

      // Sort columns by cardOrder (same order as mini cards)
      const orderMap = {};
      cardOrder.forEach((id, i) => { orderMap[id] = i; });
      const sortedItems = [...items].sort((a, b) =>
        (orderMap[a.id] ?? 9999) - (orderMap[b.id] ?? 9999)
      );

      sortedItems.forEach(item => {
        const th = document.createElement('th');
        const inactive = inactiveItems.has(item.id);

        if (inactive) {
          th.style.cssText = 'text-decoration:line-through;color:#94A3B8;font-size:11px;';
        }
        th.textContent = item.name;
        tableHeadRow.appendChild(th);

        const minTh = document.createElement('th');
        minTh.textContent = item.min;
        tableMinRow.appendChild(minTh);
      });

      tableBody.innerHTML = '';

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const visibleWeeks = getVisibleWeeks();

      let currentWeekDate = null;
      for (let i = 0; i < weeksData.length; i++) {
        const d = parseDateStr(weeksData[i].date);
        if (d >= today) { currentWeekDate = weeksData[i].date; break; }
      }

      visibleWeeks.forEach(weekData => {
        const rowDate       = parseDateStr(weekData.date);
        const isCurrentWeek = weekData.date === currentWeekDate;
        const isHistorical  = rowDate < today;

        const tr = document.createElement('tr');
        if (isCurrentWeek) {
          tr.setAttribute('data-current-week', 'true');
          tr.style.cssText = 'background:linear-gradient(to right,#FFF8F5,#FFFCFA);border-left:3px solid #E85D04;';
        } else if (isHistorical) {
          tr.style.opacity = '0.75';
        }

        const tdWeek = document.createElement('th');
        tdWeek.className = 'sticky-col week-col';
        tdWeek.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:600;color:${isCurrentWeek ? '#E85D04' : '#475569'};font-size:12px;">
              ${weekData.week}
            </span>
            ${isCurrentWeek
              ? '<span style="font-size:9px;background:#FFF0E6;color:#E85D04;padding:1px 6px;border-radius:8px;font-weight:700;letter-spacing:0.3px;">ATUAL</span>'
              : ''}
          </div>
        `;
        tr.appendChild(tdWeek);

        const tdDate = document.createElement('th');
        tdDate.className = 'sticky-col date-col';
        tdDate.innerHTML = `<span style="color:#94A3B8;font-size:11px;font-weight:400;">${weekData.date}</span>`;
        tr.appendChild(tdDate);

        sortedItems.forEach(item => {
          const td  = document.createElement('td');
          const val = weekData.values[item.id] !== undefined ? weekData.values[item.id] : '-';
          const inactive = inactiveItems.has(item.id);

          if (!inactive && val !== '-' && val !== '' && Number(val) < item.min) {
            td.classList.add('warning');
          }

          const input = document.createElement('input');
          input.type      = 'text';
          input.className = 'table-input';
          input.value     = val;
          input.readOnly  = true;
          input.tabIndex  = -1;

          if (canEdit && !inactive) {
            td.classList.add('editable');

            td.addEventListener('click', () => {
              if (!input.readOnly) return;

              if (!isCurrentWeek) showHistoricalEditWarning(weekData.week);

              const oldVal = weekData.values[item.id] !== undefined ? String(weekData.values[item.id]) : '-';

              input.readOnly = false;
              input.tabIndex = 0;
              input.focus();
              input.select();

              const commit = () => {
                input.readOnly = true;
                input.tabIndex = -1;
                input.removeEventListener('keydown', onKey);

                let newVal = input.value.trim();
                if (newVal === '') newVal = '-';
                if (newVal === oldVal) return;

                if (newVal !== '-' && (isNaN(Number(newVal)) || Number(newVal) < 0)) {
                  input.value = oldVal;
                  return;
                }

                const numVal = newVal === '-' ? '-' : Number(newVal);
                weekData.values[item.id] = numVal;

                td.classList.remove('warning');
                if (!inactive && numVal !== '-' && numVal !== '' && Number(numVal) < item.min) {
                  td.classList.add('warning');
                }

                saveData();
                addLog(weekData.week, item.name, `${oldVal} → ${numVal}`);
                renderCards();
              };

              const onKey = e => {
                if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
                if (e.key === 'Escape') { input.value = oldVal; input.readOnly = true; input.tabIndex = -1; input.removeEventListener('keydown', onKey); }
                if (e.key === 'Tab')    { input.blur(); }
              };

              input.addEventListener('blur', commit, { once: true });
              input.addEventListener('keydown', onKey);
            });
          }

          td.appendChild(input);
          tr.appendChild(td);
        });

        tableBody.appendChild(tr);
      });

      // Botão alternância — fora da tabela, no container dedicado
      const toggleContainer = document.getElementById('table-toggle-container');
      if (toggleContainer) {
        toggleContainer.innerHTML = '';
        const toggleBtn = document.createElement('button');
        toggleBtn.style.cssText = `
          padding:9px 24px;border:1.5px solid #E2E8F0;background:white;
          border-radius:8px;cursor:pointer;font-size:13px;color:#64748B;
          font-family:'Inter',sans-serif;transition:all 0.2s;
        `;
        toggleBtn.textContent = showAllWeeks
          ? '↑ Mostrar apenas semana atual'
          : `↓ Ver histórico completo (${weeksData.length} semanas)`;

        toggleBtn.addEventListener('click', () => { showAllWeeks = !showAllWeeks; renderTable(); });
        toggleBtn.addEventListener('mouseenter', () => { toggleBtn.style.background = '#F8FAFC'; toggleBtn.style.borderColor = '#CBD5E1'; });
        toggleBtn.addEventListener('mouseleave', () => { toggleBtn.style.background = 'white';  toggleBtn.style.borderColor = '#E2E8F0'; });
        toggleContainer.appendChild(toggleBtn);
      }

      setTimeout(() => {
        const topH = tableHeadRow.offsetHeight;
        tableMinRow.querySelectorAll('th').forEach(c => { c.style.top = `${topH - 1}px`; });
      }, 50);

      renderCards();
    }

    // --------------------------------------------------------
    // CUSTOS
    // --------------------------------------------------------
    function renderCosts() {
      const tbody = document.getElementById('costs-body');
      if (!tbody) return;

      // Show/hide admin actions column
      const actionsCol = document.getElementById('costs-actions-col');
      if (actionsCol) actionsCol.style.display = canEditCosts ? '' : 'none';

      const btnAdd = document.getElementById('btn-add-cost-item');
      if (btnAdd) {
        btnAdd.style.display = canEditCosts ? '' : 'none';
        if (!btnAdd.dataset.bound) {
          btnAdd.dataset.bound = '1';
          btnAdd.addEventListener('click', showAddItemModal);
        }
      }

      tbody.innerHTML = '';
      const currentStock = getCurrentStockValues();
      let grandTotal = 0;

      items.forEach(item => {
        const cost = costsData[item.id] || {};
        const unitVal  = parseFloat(cost.unitValue || cost.unitPrice || 0);
        const stockQty = currentStock[item.id];
        const stockNum = (stockQty !== '-' && stockQty !== undefined && stockQty !== '') ? Number(stockQty) : 0;
        const totalVal = unitVal * stockNum;
        grandTotal += isNaN(totalVal) ? 0 : totalVal;

        const lastDate = cost.lastPurchaseDate || '—';
        const lastQty  = cost.lastPurchaseQty  || '—';
        const lastCost = (cost.lastPurchaseQty && unitVal)
          ? (cost.lastPurchaseQty * unitVal).toLocaleString('pt-BR', {minimumFractionDigits:2})
          : '—';

        const inactive = inactiveItems.has(item.id);

        const tr = document.createElement('tr');
        if (inactive) tr.style.opacity = '0.45';
        tr.innerHTML = `
          <td style="font-weight:600;color:#1E293B;">${item.name}</td>
          <td style="text-align:center;color:#64748B;">${lastQty}</td>
          <td style="text-align:center;color:#64748B;">${lastCost}</td>
          <td id="unit-val-${item.id}" style="text-align:center;font-weight:600;color:#1E293B;">
            ${unitVal > 0 ? 'R$ ' + unitVal.toLocaleString('pt-BR', {minimumFractionDigits:2}) : '—'}
          </td>
          <td style="text-align:center;color:#64748B;">${stockQty !== undefined && stockQty !== '' ? stockQty : '—'}</td>
          <td style="text-align:center;font-weight:600;color:#E85D04;">
            ${totalVal > 0 ? 'R$ ' + totalVal.toLocaleString('pt-BR', {minimumFractionDigits:2}) : '—'}
          </td>
          <td style="text-align:center;color:#94A3B8;font-size:12px;">${lastDate}</td>
          <td></td>
          <td style="text-align:center;display:${canEditCosts ? '' : 'none'}"></td>
        `;

        if (canEditCosts) {
          const editCell = tr.querySelector('td:nth-child(8)');
          const btn = document.createElement('button');
          btn.style.cssText = 'padding:4px 10px;border-radius:6px;border:1px solid #E2E8F0;background:#F8FAFC;color:#475569;font-size:12px;cursor:pointer;font-family:inherit;';
          btn.textContent = 'Editar';
          btn.addEventListener('click', () => showEditCostModal(item, cost));
          editCell.appendChild(btn);
        }

        tbody.appendChild(tr);
      });

      const totalEl = document.getElementById('costs-total-value');
      if (totalEl) {
        totalEl.textContent = grandTotal > 0
          ? 'R$ ' + grandTotal.toLocaleString('pt-BR', {minimumFractionDigits:2})
          : '—';
      }
    }

    function showEditCostModal(item, cost) {
      if (document.getElementById('edit-cost-overlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'edit-cost-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;display:flex;align-items:center;justify-content:center;';

      const curUnit  = parseFloat(cost.unitValue || cost.unitPrice || 0);
      const curQty   = cost.lastPurchaseQty || '';
      const curDate  = cost.lastPurchaseDate || '';
      const inputStyle = 'width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;outline:none;transition:border-color .15s;';
      const labelStyle = 'display:block;font-size:12px;font-weight:600;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;';

      overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:380px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden;">
          <div style="padding:20px 24px 14px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700;color:#1E293B;">Editar Custo</h3>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">${item.name}</p>
            </div>
            <button id="ec-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:#94A3B8;">×</button>
          </div>
          <div style="padding:20px 24px;display:grid;gap:14px;">
            <div>
              <label style="${labelStyle}">Valor Unitário (R$)</label>
              <input id="ec-unit" type="number" min="0" step="0.01" value="${curUnit || ''}" placeholder="0,00" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <div>
              <label style="${labelStyle}">Qtd. Última Compra</label>
              <input id="ec-qty" type="number" min="0" value="${curQty}" placeholder="0" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <div>
              <label style="${labelStyle}">Data da Última Compra</label>
              <input id="ec-date" type="date" value="${curDate}" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
          </div>
          <div style="padding:14px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #F1F5F9;">
            <button id="ec-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid #E2E8F0;background:#fff;color:#64748B;font-size:13px;font-family:inherit;cursor:pointer;">Cancelar</button>
            <button id="ec-save" style="padding:8px 20px;border-radius:8px;border:none;background:#E85D04;color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;">Salvar</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector('#ec-close').addEventListener('click', close);
      overlay.querySelector('#ec-cancel').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

      overlay.querySelector('#ec-save').addEventListener('click', () => {
        const newUnit = parseFloat(overlay.querySelector('#ec-unit').value);
        const newQty  = parseInt(overlay.querySelector('#ec-qty').value);
        const newDate = overlay.querySelector('#ec-date').value;

        const updates = {};
        if (!isNaN(newUnit)) {
          if (newUnit !== curUnit) addCostHistory(item.id, item.name, 'Valor Unitário', curUnit, newUnit);
          updates.unitValue = newUnit;
        }
        if (!isNaN(newQty))  updates.lastPurchaseQty  = newQty;
        if (newDate)         updates.lastPurchaseDate = newDate;

        db.ref('clinicorp/costs/' + item.id).update(updates);
        close();
      });
    }

    // --------------------------------------------------------
    // LOGS
    // --------------------------------------------------------
    function renderLogs() {
      const tbody = document.getElementById('logs-body');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (!logsData.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94A3B8;padding:32px;">Nenhuma atividade registrada.</td></tr>';
        return;
      }

      const badgeColors = {
        'Pedidos': '#DBEAFE|#2563EB',
        'Custos':  '#FEF9C3|#CA8A04',
      };

      logsData.slice(0, 200).forEach(log => {
        const [bg, col] = (badgeColors[log.week] || '').split('|');
        const weekBadge = (bg && col)
          ? `<span style="background:${bg};color:${col};font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;">${log.week}</span>`
          : `<span style="color:#475569;">${log.week || '—'}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:#64748B;font-size:12px;white-space:nowrap;">${log.datetime || '—'}</td>
          <td><span style="background:#FFF0E6;color:#E85D04;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">${log.user || '—'}</span></td>
          <td>${weekBadge}</td>
          <td style="color:#475569;font-size:13px;">${log.column || '—'}</td>
          <td style="color:#1E293B;font-size:13px;">${log.action || '—'}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // --------------------------------------------------------
    // CUSTOS — sub-tab switch + histórico
    // --------------------------------------------------------
    window.switchCostsTab = function(tab) {
      document.getElementById('costs-panel-current').style.display = tab === 'current' ? '' : 'none';
      document.getElementById('costs-panel-history').style.display = tab === 'history' ? '' : 'none';
      document.getElementById('costs-tab-current').classList.toggle('logs-subtab--active', tab === 'current');
      document.getElementById('costs-tab-history').classList.toggle('logs-subtab--active', tab === 'history');
      if (tab === 'history') renderCostsHistory();
    };

    function renderCostsHistory(filterItemId) {
      const tbody = document.getElementById('costs-history-body');
      if (!tbody) return;

      // Populate filter dropdown once
      const sel = document.getElementById('costs-history-item-filter');
      if (sel && sel.options.length === 1) {
        items.forEach(it => {
          const opt = document.createElement('option');
          opt.value = it.id;
          opt.textContent = it.name;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', () => renderCostsHistory(sel.value || null));
      }

      const activeFilter = filterItemId !== undefined ? filterItemId : (sel ? sel.value || null : null);

      tbody.innerHTML = '';

      // Build history: combine costsHistoryData + latest purchase dates from costsData
      let rows = [...costsHistoryData];

      // Also synthesize "current state" rows for items that have a lastPurchaseDate but no history entry
      items.forEach(it => {
        const cost = costsData[it.id] || {};
        if (cost.lastPurchaseDate && !rows.some(r => r.itemId === it.id)) {
          rows.push({
            datetime: cost.lastPurchaseDate,
            itemId: it.id,
            itemName: it.name,
            field: 'Última Compra',
            oldValue: '—',
            newValue: cost.lastPurchaseDate,
            user: '—',
            _synthetic: true,
          });
        }
      });

      if (activeFilter) rows = rows.filter(r => r.itemId === activeFilter);

      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94A3B8;padding:36px;">Nenhum histórico registrado.</td></tr>';
        return;
      }

      rows.forEach(row => {
        const formatVal = v => {
          const n = parseFloat(v);
          if (!isNaN(n) && v !== '—' && v !== '') return 'R$ ' + n.toLocaleString('pt-BR', {minimumFractionDigits:2});
          return v || '—';
        };

        const tr = document.createElement('tr');
        if (row._synthetic) tr.style.opacity = '0.6';
        tr.innerHTML = `
          <td style="font-weight:600;color:#1E293B;">${row.itemName || '—'}</td>
          <td style="text-align:center;color:#64748B;font-size:12px;white-space:nowrap;">${row.datetime || '—'}</td>
          <td style="text-align:center;">
            <span style="background:#EFF6FF;color:#2563EB;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">${row.field || '—'}</span>
          </td>
          <td style="text-align:center;color:#94A3B8;">${formatVal(row.oldValue)}</td>
          <td style="text-align:center;font-weight:600;color:#1E293B;">${formatVal(row.newValue)}</td>
          <td style="text-align:center;">
            <span style="background:#FFF0E6;color:#E85D04;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">${row.user || '—'}</span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // --------------------------------------------------------
    // RELATÓRIOS
    // --------------------------------------------------------
    const palette = ['#E85D04','#0E43D7','#10B981','#6366F1','#F59E0B',
                     '#EF4444','#8B5CF6','#14B8A6','#F43F5E','#84CC16','#06B6D4'];
    let rptWeeks    = 4;
    let rptSelected = new Set();

    function initReports() {
      // Initialize selected set (all items)
      if (rptSelected.size === 0) items.forEach(it => rptSelected.add(it.id));

      // Build item chips (once)
      const chipContainer = document.getElementById('rpt-item-chips');
      if (chipContainer && chipContainer.children.length === 0) {
        items.forEach((item, i) => {
          const chip = document.createElement('button');
          chip.className = 'rpt-item-chip chip--on';
          chip.dataset.id = item.id;
          chip.innerHTML = `<span class="chip-dot" style="background:${palette[i % palette.length]}"></span>${item.name}`;
          chip.style.borderColor = palette[i % palette.length];
          chip.addEventListener('click', () => {
            if (rptSelected.has(item.id)) {
              if (rptSelected.size === 1) return; // keep at least 1
              rptSelected.delete(item.id);
              chip.classList.replace('chip--on', 'chip--off');
              chip.style.borderColor = '#E2E8F0';
            } else {
              rptSelected.add(item.id);
              chip.classList.replace('chip--off', 'chip--on');
              chip.style.borderColor = palette[i % palette.length];
            }
            renderChart();
          });
          chipContainer.appendChild(chip);
        });
      }

      // Period chips
      const periodContainer = document.getElementById('rpt-period-chips');
      if (periodContainer && !periodContainer.dataset.bound) {
        periodContainer.dataset.bound = '1';
        const periods = [
          { label: '4 semanas', weeks: 4 },
          { label: '8 semanas', weeks: 8 },
          { label: '12 semanas', weeks: 12 },
          { label: 'Todas', weeks: 0 },
        ];
        periods.forEach(p => {
          const btn = document.createElement('button');
          btn.className = 'rpt-chip' + (p.weeks === rptWeeks ? ' rpt-chip--active' : '');
          btn.dataset.weeks = p.weeks;
          btn.textContent = p.label;
          btn.addEventListener('click', () => {
            periodContainer.querySelectorAll('.rpt-chip').forEach(b => b.classList.remove('rpt-chip--active'));
            btn.classList.add('rpt-chip--active');
            rptWeeks = parseInt(btn.dataset.weeks, 10);
            renderChart();
          });
          periodContainer.appendChild(btn);
        });
      }

      renderChart();
    }

    function renderChart() {
      // Keep only weeks that have at least one filled value (no future/empty weeks)
      const filledWeeks = weeksData.filter(w =>
        items.some(it => {
          const v = w.values[it.id];
          return v !== undefined && v !== null && v !== '' && v !== '-';
        })
      );

      // weeksData is oldest→newest; slice(-N) gives the N most recent filled weeks in chronological order
      const sliced = rptWeeks === 0
        ? filledWeeks
        : filledWeeks.slice(-rptWeeks);

      const selectedItems = items.filter(it => rptSelected.has(it.id));

      const labels = sliced.map(w => {
        if (!w.date) return w.week;
        const m = w.date.match(/de\s+([a-zçá]+)/i);
        const short = m ? m[1].substring(0, 3).toUpperCase() : '';
        return short ? `Sem ${w.week.replace(/\D+/g,'')} (${short})` : w.week;
      });

      if (consumptionChart) consumptionChart.destroy();
      const ctx = document.getElementById('consumptionChart').getContext('2d');

      const datasets = [];
      selectedItems.forEach((item, i) => {
        const color = palette[items.indexOf(item) % palette.length];
        const data = sliced.map(w => {
          const v = w.values[item.id];
          return (v === '-' || v === '' || v === undefined) ? null : Number(v);
        });
        datasets.push({
          label: item.name,
          data,
          borderColor: color,
          backgroundColor: selectedItems.length === 1
            ? color.replace(')', ',0.08)').replace('rgb', 'rgba') + (color.startsWith('#') ? '14' : '')
            : 'transparent',
          borderWidth: 2.5,
          tension: 0.35,
          fill: selectedItems.length === 1,
          pointBackgroundColor: '#fff',
          pointBorderColor: color,
          pointBorderWidth: 2,
          pointRadius: sliced.length <= 8 ? 4 : 3,
          pointHoverRadius: 6,
          spanGaps: true
        });
        // Min line when single item selected
        if (selectedItems.length === 1) {
          datasets.push({
            label: 'Mínimo aceitável',
            data: sliced.map(() => item.min),
            borderColor: '#EF4444',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            fill: false
          });
        }
      });

      // Chart title
      const titleEl = document.getElementById('rpt-chart-title');
      const subEl   = document.getElementById('rpt-chart-sub');
      if (titleEl) titleEl.textContent = selectedItems.length === 1
        ? `Consumo: ${selectedItems[0].name}`
        : `Visão Geral — ${selectedItems.length} insumos`;
      const periodLabel = rptWeeks === 0 ? 'todas as semanas' : `últimas ${sliced.length} semana(s)`;
      if (subEl) subEl.textContent = periodLabel;

      consumptionChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: true },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { family: "'Inter',sans-serif", size: 12 },
                boxWidth: 14, padding: 16, usePointStyle: true, pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: '#1E293B',
              titleFont: { family: "'Inter',sans-serif", size: 12 },
              bodyFont:  { family: "'Inter',sans-serif", size: 12 },
              padding: 12, cornerRadius: 10, caretSize: 6
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#F1F5F9', drawBorder: false },
              ticks: { font: { family: "'Inter',sans-serif", size: 11 }, color: '#94A3B8' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: "'Inter',sans-serif", size: 11 }, color: '#94A3B8', maxRotation: 30 }
            }
          }
        }
      });

      // Stats cards
      renderRptStats(selectedItems, sliced);
    }

    function renderRptStats(selectedItems, sliced) {
      const grid = document.getElementById('rpt-stats');
      if (!grid) return;
      grid.innerHTML = '';
      selectedItems.forEach((item, i) => {
        const color = palette[items.indexOf(item) % palette.length];
        const vals  = sliced
          .map(w => w.values[item.id])
          .filter(v => v !== '-' && v !== '' && v !== undefined)
          .map(Number);
        if (!vals.length) return;
        const current = vals[vals.length - 1];
        const minVal  = Math.min(...vals);
        const maxVal  = Math.max(...vals);
        const avg     = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
        const prev    = vals.length >= 2 ? vals[vals.length - 2] : current;
        const trend   = current > prev ? 'up' : current < prev ? 'down' : 'flat';
        const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
        const trendText = trend === 'up' ? 'Subindo' : trend === 'down' ? 'Caindo' : 'Estável';
        const isAlert   = current < item.min;

        const card = document.createElement('div');
        card.className = 'rpt-stat-card';
        card.style.borderLeftColor = color;
        card.innerHTML = `
          <div class="rpt-stat-name" title="${item.name}">${item.name}</div>
          <div class="rpt-stat-row">
            <span class="rpt-stat-key">Atual</span>
            <span class="rpt-stat-val ${isAlert ? 'alert' : 'ok'}">${current}</span>
          </div>
          <div class="rpt-stat-row">
            <span class="rpt-stat-key">Mínimo</span>
            <span class="rpt-stat-val">${item.min}</span>
          </div>
          <div class="rpt-stat-row">
            <span class="rpt-stat-key">Menor / Maior</span>
            <span class="rpt-stat-val">${minVal} / ${maxVal}</span>
          </div>
          <div class="rpt-stat-row">
            <span class="rpt-stat-key">Média</span>
            <span class="rpt-stat-val">${avg}</span>
          </div>
          <div class="rpt-trend ${trend}">${trendIcon} ${trendText}</div>`;
        grid.appendChild(card);
      });
    }

    // --------------------------------------------------------
    // PEDIDOS DE COMPRA
    // --------------------------------------------------------
    function renderPurchaseOrders() {
      const tbody = document.getElementById('orders-body');
      if (!tbody) return;

      // Show action buttons for permitted roles
      const btnAdd     = document.getElementById('btn-add-order');
      const btnNewItem = document.getElementById('btn-orders-new-item');
      if (btnAdd)     { btnAdd.style.display     = canAddItems ? 'inline-flex' : 'none'; }
      if (btnNewItem) { btnNewItem.style.display  = canAddItems ? 'inline-flex' : 'none'; }

      // Wire buttons once
      if (btnAdd && !btnAdd.dataset.bound) {
        btnAdd.dataset.bound = '1';
        btnAdd.addEventListener('click', showAddOrderModal);
      }
      if (btnNewItem && !btnNewItem.dataset.bound) {
        btnNewItem.dataset.bound = '1';
        btnNewItem.addEventListener('click', showAddItemModal);
      }

      tbody.innerHTML = '';

      const orders = Object.values(purchaseOrdersData)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#94A3B8;padding:36px;">Nenhum pedido registrado.</td></tr>`;
        return;
      }

      orders.forEach(order => {
        const isPending   = order.status === 'pending';
        const badgeClass  = isPending ? 'order-badge--pending' : 'order-badge--confirmed';
        const badgeLabel  = isPending ? '⏳ Aguardando' : '✅ Recebido';

        // support both old field names (ticketNumber/orderDate/requestedQty) and new (ticket/date/qty)
        const ticketVal = order.ticketNumber || order.ticket || '—';
        const dateVal   = order.orderDate   || order.date   || '—';
        const qtyVal    = order.requestedQty != null ? order.requestedQty : (order.qty != null ? order.qty : '—');

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;color:#1E293B;">${order.itemName}</td>
          <td style="text-align:center;color:#64748B;font-family:monospace;font-size:13px;">${ticketVal}</td>
          <td style="text-align:center;color:#64748B;">${dateVal}</td>
          <td style="text-align:center;font-weight:600;color:#1E293B;">${qtyVal}</td>
          <td style="text-align:center;"><span class="order-badge ${badgeClass}">${badgeLabel}</span></td>
          <td style="text-align:center;color:#64748B;">${order.arrivalDate || '—'}</td>
          <td style="text-align:center;color:#64748B;">${order.purchaseValue ? 'R$ ' + Number(order.purchaseValue).toLocaleString('pt-BR', {minimumFractionDigits:2}) : '—'}</td>
          <td style="text-align:right;"></td>
        `;

        const actionCell = tr.querySelector('td:last-child');
        if (isPending && canAddItems) {
          const btn = document.createElement('button');
          btn.style.cssText = 'padding:5px 12px;border-radius:7px;border:1px solid #BBF7D0;background:#F0FDF4;color:#15803D;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;';
          btn.textContent = '✓ Confirmar Recebimento';
          btn.addEventListener('click', () => showConfirmArrivalModal(order));
          actionCell.appendChild(btn);
        } else if (!isPending) {
          actionCell.innerHTML = `<span style="font-size:11px;color:#94A3B8;">por ${order.confirmedBy || '—'}</span>`;
        }

        tbody.appendChild(tr);
      });
    }

    function showConfirmArrivalModal(order) {
      if (document.getElementById('confirm-arrival-overlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'confirm-arrival-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;display:flex;align-items:center;justify-content:center;';
      const labelStyle = 'display:block;font-size:12px;font-weight:600;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;';
      const inputStyle = 'width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;outline:none;transition:border-color .15s;';
      const ticketVal = order.ticketNumber || order.ticket || '—';
      const qtyVal    = order.requestedQty != null ? order.requestedQty : (order.qty != null ? order.qty : '—');
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:420px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden;">
          <div style="padding:20px 24px 14px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700;color:#1E293B;">Confirmar Recebimento</h3>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">Registre a chegada do pedido.</p>
            </div>
            <button id="ca-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:#94A3B8;padding:4px;">×</button>
          </div>
          <div style="padding:16px 24px;background:#F8FAFC;border-bottom:1px solid #F1F5F9;font-size:13px;color:#475569;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div><span style="font-weight:600;color:#1E293B;">Insumo:</span> ${order.itemName}</div>
            <div><span style="font-weight:600;color:#1E293B;">Qtd. Pedida:</span> ${qtyVal}</div>
            <div><span style="font-weight:600;color:#1E293B;">Ticket:</span> ${ticketVal}</div>
          </div>
          <div style="padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <label style="${labelStyle}">Data de Recebimento *</label>
              <input id="ca-date" type="date" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <div>
              <label style="${labelStyle}">Valor da Compra (R$)</label>
              <input id="ca-value" type="number" min="0" step="0.01" placeholder="0,00" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <p id="ca-err" style="grid-column:1/-1;color:#EF4444;font-size:12px;margin:0;display:none;">Informe a data de recebimento.</p>
          </div>
          <div style="padding:14px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #F1F5F9;">
            <button id="ca-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid #E2E8F0;background:#fff;color:#64748B;font-size:13px;font-family:inherit;cursor:pointer;">Cancelar</button>
            <button id="ca-save" style="padding:8px 20px;border-radius:8px;border:none;background:#15803D;color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;">Confirmar Recebimento</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#ca-date').value = new Date().toISOString().split('T')[0];
      const close = () => overlay.remove();
      overlay.querySelector('#ca-close').addEventListener('click', close);
      overlay.querySelector('#ca-cancel').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      overlay.querySelector('#ca-save').addEventListener('click', () => {
        const dateVal  = overlay.querySelector('#ca-date').value;
        const valueVal = overlay.querySelector('#ca-value').value;
        const errEl    = overlay.querySelector('#ca-err');
        if (!dateVal) { errEl.style.display = 'block'; return; }
        const updates = {
          status:      'confirmed',
          arrivalDate: dateVal,
          confirmedBy: localStorage.getItem('clinicorp_role') || 'Desconhecido',
          confirmedAt: new Date().toISOString(),
        };
        if (valueVal && !isNaN(parseFloat(valueVal))) {
          updates.purchaseValue = parseFloat(valueVal);
          const qty = order.requestedQty || order.qty;
          if (qty && Number(qty) > 0) {
            const unitPrice = parseFloat(valueVal) / Number(qty);
            const itemId = order.itemId;
            if (itemId && costsData[itemId]) {
              db.ref('clinicorp/costs/' + itemId + '/unitValue').set(unitPrice);
              db.ref('clinicorp/costs/' + itemId + '/lastPurchaseDate').set(dateVal);
              db.ref('clinicorp/costs/' + itemId + '/lastPurchaseQty').set(Number(qty));
              addCostHistory(itemId, order.itemName, 'Valor Unitário (pedido confirmado)',
                costsData[itemId].unitValue || 0, unitPrice);
            }
          }
        }
        db.ref('clinicorp/purchaseOrders/' + order.id).update(updates);
        addLog('Pedidos', order.itemName, `Recebimento confirmado: ${qtyVal}x ${order.itemName}`);
        close();
      });
    }

    function showAddOrderModal() {
      if (document.getElementById('add-order-overlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'add-order-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;display:flex;align-items:center;justify-content:center;';
      const labelStyle = 'display:block;font-size:12px;font-weight:600;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;';
      const inputStyle = 'width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;outline:none;transition:border-color .15s;';
      const itemOptions = items.map(it => `<option value="${it.id}" data-name="${it.name}">${it.name}</option>`).join('');
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:460px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden;">
          <div style="padding:20px 24px 14px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:700;color:#1E293B;">Novo Pedido de Compra</h3>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">Registre um pedido pendente de confirmação.</p>
            </div>
            <button id="ao-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:#94A3B8;padding:4px;">×</button>
          </div>
          <div style="padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div style="grid-column:1/-1;">
              <label style="${labelStyle}">Insumo *</label>
              <select id="ao-item" style="${inputStyle}background:#fff;"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
                <option value="">— Selecione —</option>
                ${itemOptions}
              </select>
            </div>
            <div>
              <label style="${labelStyle}">Nº do Ticket</label>
              <input id="ao-ticket" type="text" placeholder="Ex: TK-1234" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <div>
              <label style="${labelStyle}">Data do Pedido *</label>
              <input id="ao-date" type="date" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <div style="grid-column:1/-1;">
              <label style="${labelStyle}">Qtd. Solicitada *</label>
              <input id="ao-qty" type="number" min="1" placeholder="0" style="${inputStyle}"
                onfocus="this.style.borderColor='#E85D04'" onblur="this.style.borderColor='#E2E8F0'">
            </div>
            <p id="ao-err" style="grid-column:1/-1;color:#EF4444;font-size:12px;margin:0;display:none;">Preencha todos os campos obrigatórios (*).</p>
          </div>
          <div style="padding:14px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #F1F5F9;">
            <button id="ao-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid #E2E8F0;background:#fff;color:#64748B;font-size:13px;font-family:inherit;cursor:pointer;">Cancelar</button>
            <button id="ao-save" style="padding:8px 20px;border-radius:8px;border:none;background:#E85D04;color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;">Registrar Pedido</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#ao-date').value = new Date().toISOString().split('T')[0];
      const close = () => overlay.remove();
      overlay.querySelector('#ao-close').addEventListener('click', close);
      overlay.querySelector('#ao-cancel').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      overlay.querySelector('#ao-save').addEventListener('click', () => {
        const itemSel = overlay.querySelector('#ao-item');
        const ticket  = overlay.querySelector('#ao-ticket').value.trim();
        const date    = overlay.querySelector('#ao-date').value;
        const qty     = parseInt(overlay.querySelector('#ao-qty').value);
        const errEl   = overlay.querySelector('#ao-err');
        if (!itemSel.value || !date || isNaN(qty) || qty < 1) { errEl.style.display = 'block'; return; }
        const order = {
          id:        Date.now().toString(),
          itemId:    itemSel.value,
          itemName:  itemSel.options[itemSel.selectedIndex].dataset.name,
          ticket, date, qty,
          status:    'pending',
          createdAt: new Date().toISOString(),
          createdBy: currentRole
        };
        db.ref('clinicorp/purchaseOrders/' + order.id).set(order);
        addLog('Pedidos', order.itemName, `Pedido criado: ${qty}x ${order.itemName} (ticket: ${ticket || 'N/A'})`);
        close();
      });
    }

    // --------------------------------------------------------
    // FORCE REFRESH — controle de versão via Firebase
    // --------------------------------------------------------
    function checkForceRefresh() {
      db.ref('clinicorp/config/appVersion').on('value', snap => {
        const remoteVersion = snap.val();
        if (!remoteVersion) return;

        const seenVersion = localStorage.getItem('appVersionSeen');

        // Já viu esta versão — sem overlay
        if (seenVersion === String(remoteVersion)) return;

        // Versão nova: mostra overlay bloqueante
        const existing = document.getElementById('force-refresh-overlay');
        if (existing) return; // já está visível

        const overlay = document.createElement('div');
        overlay.id = 'force-refresh-overlay';
        overlay.style.cssText = [
          'position:fixed', 'inset:0', 'z-index:99999',
          'background:rgba(15,23,42,0.82)', 'backdrop-filter:blur(6px)',
          'display:flex', 'align-items:center', 'justify-content:center',
          'flex-direction:column', 'gap:18px', 'font-family:Inter,sans-serif'
        ].join(';');

        overlay.innerHTML = `
          <div style="background:#fff;border-radius:16px;padding:36px 40px;text-align:center;
                      max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
            <div style="font-size:36px;margin-bottom:12px;">🔄</div>
            <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0F172A;">
              Nova versão disponível
            </h2>
            <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.5;">
              O sistema foi atualizado. Clique no botão abaixo para carregar a versão mais recente.
            </p>
            <button id="force-refresh-btn"
              style="width:100%;padding:12px 0;border-radius:10px;border:none;
                     background:#E85D04;color:#fff;font-size:15px;font-weight:700;
                     font-family:inherit;cursor:pointer;transition:background .15s;">
              Atualizar Sistema
            </button>
            <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;">
              Versão ${remoteVersion}
            </p>
          </div>`;

        document.body.appendChild(overlay);

        overlay.querySelector('#force-refresh-btn').addEventListener('click', () => {
          localStorage.setItem('appVersionSeen', String(remoteVersion));
          // Cache-bust via query string
          const url = location.href.split('?')[0] + '?v=' + Date.now();
          location.replace(url);
        });
      });
    }

    // --------------------------------------------------------
    // KICKOFF — inicia listeners e changelog
    // --------------------------------------------------------
    checkForceRefresh();
    initData();
    checkAndShowChangelog();

  } // end startApp

}); // end DOMContentLoaded
