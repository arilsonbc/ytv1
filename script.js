
// ---------------------------
// Storage keys
// ---------------------------
const STORAGE = {
  THEME: "theme",
  PROMPTS: "yt_prompts_v2",
  HISTORY: "yt_history_v2",
  ROTEIROS: "yt_roteiros_v1",
  CANAIS: "yt_canais_kibe_v1"
};

const DEFAULT_PROMPTS = {
  thumb: `Eu vou te enviar minha thumbnail e preciso que você aja como um designer gráfico profissional especializado em thumbnails para YouTube de alto CTR...
(cole aqui seu prompt completo de thumbnail)`,
  short: `Você é um roteirista profissional para Shorts do YouTube. Crie um roteiro com:
- Gancho absurdo nos 2-3 primeiros segundos
- Linguagem simples e direta
- 1 ideia principal + CTA final
Tema: [COLE A IDEIA AQUI]`,
  roteiro: `Olá, sou youtuber e quero reescrever um roteiro com base na transcrição que vou te enviar.
Reescreva de forma natural, envolvente, fácil de narrar e sem enrolação.
Mantenha as informações importantes e organize em:
1) Gancho
2) Contexto
3) Explicação passo a passo
4) Alertas/pegadinhas
5) Conclusão + CTA`
};

// ---------------------------
// Elements
// ---------------------------
const $ = (id) => document.getElementById(id);
const els = {
  themeToggle: $("themeToggle"),

  videoUrl: $("videoUrl"),
  btnAnalisar: $("btnAnalisar"),
  btnLimpar: $("btnLimpar"),
  analisarText: $("analisarText"),
  analisarIcon: $("analisarIcon"),

  titleBox: $("titleBox"),
  videoTitle: $("videoTitle"),
  linkYtOriginal: $("linkYtOriginal"),
  linkVideo: $("linkVideo"),
  btnCopiarTitulo: $("btnCopiarTitulo"),
  btnCopiarLink: $("btnCopiarLink"),
  btnAbrirEditor: $("btnAbrirEditor"),

  thumbImgPreview: $("thumbImgPreview"),
  thumbBadge: $("thumbBadge"),
  btnDownloadThumb: $("btnDownloadThumb"),

  toast: $("toast"),

  // top tabs
  topTabs: Array.from(document.querySelectorAll('[data-top-tab]')),
  topPanels: ["top-producao", "top-canais"].map(id => $(id)),

  // sub tabs (produção)
  subTabs: Array.from(document.querySelectorAll('[data-sub-tab]')),
  subPanels: ["sub-workflow", "sub-prompts", "sub-historico", "sub-config"].map(id => $(id)),

  // prompts
  promptSelect: $("promptSelect"),
  statusSelect: $("statusSelect"),
  promptEditor: $("promptEditor"),
  btnSalvarPrompt: $("btnSalvarPrompt"),
  btnCopiarPromptAtual: $("btnCopiarPromptAtual"),
  btnResetPrompt: $("btnResetPrompt"),

  // histórico
  historyGrid: $("historyGrid"),
  historySearch: $("historySearch"),
  historyFilterStatus: $("historyFilterStatus"),
  btnLimparHistorico: $("btnLimparHistorico"),

  // config
  btnExportar: $("btnExportar"),
  importFile: $("importFile"),
  btnResetTudo: $("btnResetTudo"),
  btnAbrirPastaDica: $("btnAbrirPastaDica"),
  dicaTexto: $("dicaTexto"),

  // roteiro modal
  roteiroModal: $("roteiroModal"),
  roteiroEditor: $("roteiroEditor"),
  roteiroMeta: $("roteiroMeta"),
  btnFecharEditor: $("btnFecharEditor"),
  btnSalvarRoteiro: $("btnSalvarRoteiro"),
  btnCopiarRoteiro: $("btnCopiarRoteiro"),
  btnBaixarRoteiro: $("btnBaixarRoteiro"),
  btnLimparRoteiro: $("btnLimparRoteiro"),

  // canais
  chNome: $("chNome"),
  chNicho: $("chNicho"),
  chUrl: $("chUrl"),
  chNotas: $("chNotas"),
  btnAddCanal: $("btnAddCanal"),
  canaisGrid: $("canaisGrid"),
  canalSearch: $("canalSearch"),
  canalFilterNicho: $("canalFilterNicho"),
  btnLimparCanais: $("btnLimparCanais"),
};

// ---------------------------
// Theme
// ---------------------------
function loadTheme() {
  const t = localStorage.getItem(STORAGE.THEME) || "dark";
  document.documentElement.setAttribute("data-theme", t);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE.THEME, next);
}

// ---------------------------
// Toast
// ---------------------------
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.setAttribute("data-show", "true");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.removeAttribute("data-show"), 1200);
}

// ---------------------------
// Helpers
// ---------------------------
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function parseYouTubeId(input) {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.replace("/", "").slice(0, 11);
    const v = url.searchParams.get("v");
    if (v && v.length === 11) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.indexOf("embed");
    if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1].slice(0, 11);
    return null;
  } catch {
    return null;
  }
}

async function fetchTitle(cleanUrl) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`);
    if (!res.ok) throw new Error("oEmbed falhou");
    const data = await res.json();
    return data?.title || "Vídeo do YouTube";
  } catch {
    return "Vídeo do YouTube";
  }
}

function setLoading(isLoading) {
  els.btnAnalisar.disabled = isLoading;
  els.analisarText.textContent = isLoading ? "Carregando..." : "Analisar";
  els.analisarIcon.textContent = isLoading ? "⏳" : "⚡";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copiado ✅");
  } catch {
    toast("Não foi possível copiar");
  }
}

function setThumbnailWithFallback(videoId) {
  const candidates = [
    { label: "MAXRES", url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
    { label: "HQ", url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
    { label: "MQ", url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
  ];
  return new Promise((resolve) => {
    let i = 0; const img = new Image();
    const tryNext = () => {
      if (i >= candidates.length) return resolve(candidates[candidates.length - 1]);
      const c = candidates[i++];
      img.onload = () => resolve(c);
      img.onerror = tryNext;
      img.src = c.url + `?t=${Date.now()}`;
    };
    tryNext();
  });
}

// ---------------------------
// Storage helpers
// ---------------------------
function getPrompts() {
  const saved = localStorage.getItem(STORAGE.PROMPTS);
  if (!saved) return { ...DEFAULT_PROMPTS };
  try {
    const obj = JSON.parse(saved);
    return { ...DEFAULT_PROMPTS, ...obj };
  } catch {
    return { ...DEFAULT_PROMPTS };
  }
}
function savePrompts(prompts) {
  localStorage.setItem(STORAGE.PROMPTS, JSON.stringify(prompts));
}

function getHistory() {
  const saved = localStorage.getItem(STORAGE.HISTORY);
  if (!saved) return [];
  try { return JSON.parse(saved) || []; } catch { return []; }
}
function saveHistory(hist) {
  localStorage.setItem(STORAGE.HISTORY, JSON.stringify(hist));
}

function getRoteiros() {
  try { return JSON.parse(localStorage.getItem(STORAGE.ROTEIROS) || "{}"); }
  catch { return {}; }
}
function saveRoteiros(obj) {
  localStorage.setItem(STORAGE.ROTEIROS, JSON.stringify(obj));
}

function getCanais() {
  const saved = localStorage.getItem(STORAGE.CANAIS);
  if (!saved) return [];
  try { return JSON.parse(saved) || []; } catch { return []; }
}
function saveCanais(list) {
  localStorage.setItem(STORAGE.CANAIS, JSON.stringify(list));
}

function formatDate(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ---------------------------
// Top nav + Subnav
// ---------------------------
function openTopTab(panelId) {
  els.topTabs.forEach(t => t.setAttribute("aria-selected", t.dataset.topTab === panelId ? "true" : "false"));
  els.topPanels.forEach(p => p.hidden = (p.id !== panelId));
  if (panelId === "top-canais") renderCanais();
}

function openSubTab(panelId) {
  els.subTabs.forEach(t => t.setAttribute("aria-selected", t.dataset.subTab === panelId ? "true" : "false"));
  els.subPanels.forEach(p => p.hidden = (p.id !== panelId));
  if (panelId === "sub-historico") renderHistory();
  if (panelId === "sub-prompts") loadPromptEditor();
}

// ---------------------------
// Prompts
// ---------------------------
function loadPromptEditor() {
  const prompts = getPrompts();
  const key = els.promptSelect.value;
  els.promptEditor.value = prompts[key] || "";
}
function savePromptEditor() {
  const prompts = getPrompts();
  const key = els.promptSelect.value;
  prompts[key] = els.promptEditor.value || "";
  savePrompts(prompts);
  toast("Prompt salvo ✅");
}
function resetPromptToDefault() {
  const key = els.promptSelect.value;
  const prompts = getPrompts();
  prompts[key] = DEFAULT_PROMPTS[key];
  savePrompts(prompts);
  loadPromptEditor();
  toast("Restaurado ↩︎");
}

// ---------------------------
// Roteiro modal + autosave
// ---------------------------
function roteiroKeyFromVideoId(videoId) { return videoId ? `video:${videoId}` : "global"; }

let activeRoteiroKey = "global";
let roteiroAutosaveTimer = null;

function salvarRoteiroByKey(key) {
  const map = getRoteiros();
  map[key] = els.roteiroEditor.value || "";
  saveRoteiros(map);
}
function scheduleAutosave() {
  clearTimeout(roteiroAutosaveTimer);
  roteiroAutosaveTimer = setTimeout(() => {
    salvarRoteiroByKey(activeRoteiroKey);
    toast("Roteiro salvo ✅");
  }, 700);
}

function openEditorForKey(key) {
  const map = getRoteiros();
  els.roteiroEditor.value = map[key] || "";
  els.roteiroMeta.textContent = key.startsWith("video:") ? `Vinculado ao vídeo: ${key.replace("video:", "")}` : "Roteiro global (não vinculado)";
  activeRoteiroKey = key;

  els.roteiroModal.setAttribute("data-open", "true");
  els.roteiroModal.setAttribute("aria-hidden", "false");
  setTimeout(() => els.roteiroEditor.focus(), 50);
}
function openEditor() {
  const key = current?.id ? roteiroKeyFromVideoId(current.id) : "global";
  openEditorForKey(key);
}
function closeEditor() {
  els.roteiroModal.removeAttribute("data-open");
  els.roteiroModal.setAttribute("aria-hidden", "true");
}
function salvarRoteiroManual() {
  salvarRoteiroByKey(activeRoteiroKey);
  toast("Salvo ✅");
}
function baixarRoteiroTxt() {
  const key = activeRoteiroKey || "global";
  const name = key.startsWith("video:") ? `roteiro-${key.replace("video:", "")}.txt` : "roteiro.txt";

  const blob = new Blob([els.roteiroEditor.value || ""], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  toast("Baixado ✅");
}
function limparRoteiro() {
  if (!confirm("Limpar o roteiro do editor?")) return;
  els.roteiroEditor.value = "";
  salvarRoteiroByKey(activeRoteiroKey);
  toast("Limpo ✅");
}

// ---------------------------
// Histórico (auto-save no analisar)
// ---------------------------
function upsertHistory(entry) {
  let hist = getHistory();
  const existing = hist.find(x => x.id === entry.id);

  if (existing) {
    const keepStatus = existing.status || entry.status || "IDEIA";
    hist = hist.map(x => x.id === entry.id ? { ...x, ...entry, status: keepStatus } : x);
  } else {
    hist.unshift(entry);
  }
  hist = hist.slice(0, 120);
  saveHistory(hist);
  renderHistory();
}

function removeFromHistory(id) {
  const hist = getHistory().filter(x => x.id !== id);
  saveHistory(hist);
  renderHistory();
  toast("Removido");
}

function updateHistoryStatus(id, status) {
  const hist = getHistory().map(x => x.id === id ? { ...x, status } : x);
  saveHistory(hist);
  renderHistory();
  toast("Status atualizado");
}

function renderHistory() {
  const q = (els.historySearch.value || "").trim().toLowerCase();
  const filterStatus = els.historyFilterStatus.value || "";
  const hist = getHistory().filter(item => {
    const matchTitle = !q || (item.titulo || "").toLowerCase().includes(q);
    const matchStatus = !filterStatus || (item.status === filterStatus);
    return matchTitle && matchStatus;
  });

  if (hist.length === 0) {
    els.historyGrid.innerHTML = `<div style="padding: 18px; color: var(--muted); font-weight: 900;">Nada no histórico (ainda).</div>`;
    return;
  }

  els.historyGrid.innerHTML = hist.map(item => `
        <div class="history-card">
          <button class="remove" title="Remover" data-remove="${item.id}">✕</button>
          <a href="${item.url}" target="_blank" rel="noreferrer">
            <img src="https://img.youtube.com/vi/${item.id}/mqdefault.jpg" alt="Thumb do vídeo">
          </a>
          <div class="meta">
            <strong>${escapeHtml(item.titulo || "Vídeo do YouTube")}</strong>
            <div class="line">
              <span>${escapeHtml(item.status || "IDEIA")}</span>
              <span>${escapeHtml(formatDate(item.ts || Date.now()))}</span>
            </div>
            <select data-status="${item.id}" class="mini-input" style="height:36px">
              ${["IDEIA", "ROTEIRO", "GRAVADO", "EDITADO", "POSTADO"].map(s => `
                <option value="${s}" ${item.status === s ? "selected" : ""}>${s}</option>
              `).join("")}
            </select>
            <button class="btn" data-open-roteiro="${item.id}">📝 Abrir roteiro</button>
          </div>
        </div>
      `).join("");

  els.historyGrid.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      removeFromHistory(btn.getAttribute("data-remove"));
    });
  });

  els.historyGrid.querySelectorAll("select[data-status]").forEach(sel => {
    sel.addEventListener("change", () => updateHistoryStatus(sel.dataset.status, sel.value));
  });

  els.historyGrid.querySelectorAll("[data-open-roteiro]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const vid = btn.getAttribute("data-open-roteiro");
      openEditorForKey(roteiroKeyFromVideoId(vid));
    });
  });
}

// ---------------------------
// Canais para Kibe (lista local)
// ---------------------------
function addCanal() {
  const url = (els.chUrl.value || "").trim();
  if (!url) {
    toast("Cole o link do canal");
    els.chUrl.focus();
    return;
  }

  const nome = (els.chNome.value || "").trim();
  const nicho = (els.chNicho.value || "").trim();
  const notas = (els.chNotas.value || "").trim();

  const item = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
    url,
    nome: nome || "Canal",
    nicho,
    notas,
    ts: Date.now()
  };

  let list = getCanais();
  // evita duplicar exato pelo url
  list = list.filter(x => x.url !== url);
  list.unshift(item);
  list = list.slice(0, 300);
  saveCanais(list);

  els.chNome.value = "";
  els.chNicho.value = "";
  els.chUrl.value = "";
  els.chNotas.value = "";

  renderCanais();
  toast("Canal salvo ✅");
}

function removeCanal(id) {
  const list = getCanais().filter(x => x.id !== id);
  saveCanais(list);
  renderCanais();
  toast("Removido");
}

function renderCanais() {
  const q = (els.canalSearch.value || "").trim().toLowerCase();
  const nichoQ = (els.canalFilterNicho.value || "").trim().toLowerCase();

  const list = getCanais().filter(item => {
    const matchQ =
      !q ||
      (item.nome || "").toLowerCase().includes(q) ||
      (item.url || "").toLowerCase().includes(q) ||
      (item.notas || "").toLowerCase().includes(q);

    const matchNicho = !nichoQ || (item.nicho || "").toLowerCase().includes(nichoQ);
    return matchQ && matchNicho;
  });

  if (list.length === 0) {
    els.canaisGrid.innerHTML = `<div style="padding: 18px; color: var(--muted); font-weight: 900;">Nenhum canal salvo ainda.</div>`;
    return;
  }

  els.canaisGrid.innerHTML = list.map(item => `
        <div class="channel-card">
          <button class="remove" title="Remover" data-remove-canal="${item.id}">✕</button>
          <div class="meta">
            <strong>${escapeHtml(item.nome || "Canal")}</strong>
            <div class="line">
              <span>${escapeHtml(item.nicho || "—")}</span>
              <span>${escapeHtml(formatDate(item.ts || Date.now()))}</span>
            </div>
            <div class="row" style="gap:8px">
              <a class="btn" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">🌐 Abrir canal</a>
              <button class="btn" data-copy-canal="${item.id}">🔗 Copiar link</button>
            </div>
            ${item.notas ? `<div class="card" style="padding:10px; border-radius:14px; background:var(--surface2); border:1px solid var(--border);">
              <div style="font-size:11px; font-weight:900; opacity:.7; margin-bottom:6px">NOTAS</div>
              <div style="font-size:12px; line-height:1.4; color:var(--muted); font-weight:850; white-space:pre-wrap">${escapeHtml(item.notas)}</div>
            </div>` : ""}
          </div>
        </div>
      `).join("");

  els.canaisGrid.querySelectorAll("[data-remove-canal]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      removeCanal(btn.getAttribute("data-remove-canal"));
    });
  });

  els.canaisGrid.querySelectorAll("[data-copy-canal]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = btn.getAttribute("data-copy-canal");
      const item = getCanais().find(x => x.id === id);
      if (!item) return;
      copyText(item.url);
    });
  });
}

// ---------------------------
// Main flow (auto-salva histórico ao analisar)
// ---------------------------
let current = { id: null, url: null, title: null };

async function processar() {
  const raw = els.videoUrl.value.trim();
  const id = parseYouTubeId(raw);
  if (!id) {
    toast("Cole um link válido do YouTube");
    els.videoUrl.focus();
    return;
  }

  const cleanUrl = `https://www.youtube.com/watch?v=${id}`;
  setLoading(true);

  els.linkYtOriginal.href = cleanUrl;
  els.linkVideo.href = cleanUrl;

  const titulo = await fetchTitle(cleanUrl);
  els.videoTitle.textContent = titulo;

  const best = await setThumbnailWithFallback(id);
  els.thumbBadge.textContent = best.label;
  els.thumbImgPreview.src = best.url;
  els.btnDownloadThumb.href = best.url;

  els.titleBox.style.display = "block";

  current = { id, url: cleanUrl, title: titulo };

  const statusDefault = els.statusSelect.value || "IDEIA";
  upsertHistory({ id: current.id, url: current.url, titulo: current.title, status: statusDefault, ts: Date.now() });

  setLoading(false);
  toast("Salvo no histórico ✅");
}

function limparCampos() {
  els.videoUrl.value = "";
  els.titleBox.style.display = "none";
  els.thumbImgPreview.removeAttribute("src");
  els.thumbBadge.textContent = "THUMB";
  current = { id: null, url: null, title: null };
}

// ---------------------------
// Export / Import / Reset (inclui canais)
// ---------------------------
function exportJSON() {
  const payload = {
    version: 4,
    exportedAt: Date.now(),
    prompts: getPrompts(),
    history: getHistory(),
    roteiros: getRoteiros(),
    canais: getCanais(),
    theme: localStorage.getItem(STORAGE.THEME) || "light"
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "yt-toolbox-backup.json";
  a.click();

  URL.revokeObjectURL(url);
  toast("Exportado ✅");
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.prompts) savePrompts(data.prompts);
      if (data.history) saveHistory(data.history);
      if (data.roteiros) saveRoteiros(data.roteiros);
      if (data.canais) saveCanais(data.canais);
      if (data.theme) { localStorage.setItem(STORAGE.THEME, data.theme); loadTheme(); }

      toast("Importado ✅");
      loadPromptEditor();
      renderHistory();
      renderCanais();
    } catch {
      toast("JSON inválido");
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm("Isso vai apagar prompts, histórico, roteiros e canais. Continuar?")) return;
  localStorage.removeItem(STORAGE.PROMPTS);
  localStorage.removeItem(STORAGE.HISTORY);
  localStorage.removeItem(STORAGE.ROTEIROS);
  localStorage.removeItem(STORAGE.CANAIS);
  toast("Resetado ✅");
  loadPromptEditor();
  renderHistory();
  renderCanais();
}

// ---------------------------
// Init + Events
// ---------------------------
loadTheme();

// top tabs
els.topTabs.forEach(tab => tab.addEventListener("click", () => openTopTab(tab.dataset.topTab)));

// sub tabs (produção)
els.subTabs.forEach(tab => tab.addEventListener("click", () => openSubTab(tab.dataset.subTab)));

// theme
els.themeToggle.addEventListener("click", toggleTheme);

// main
els.btnAnalisar.addEventListener("click", processar);
els.btnLimpar.addEventListener("click", limparCampos);
els.videoUrl.addEventListener("keydown", (e) => { if (e.key === "Enter") processar(); });

els.btnCopiarTitulo.addEventListener("click", () => copyText(els.videoTitle.textContent || ""));
els.btnCopiarLink.addEventListener("click", () => {
  if (!current.url) return toast("Analise um vídeo primeiro");
  copyText(current.url);
});

// prompt quick copy buttons
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-copy-prompt]");
  if (!btn) return;
  const key = btn.getAttribute("data-copy-prompt");
  const prompts = getPrompts();
  copyText(prompts[key] || DEFAULT_PROMPTS[key] || "");
});

// prompts
els.promptSelect.addEventListener("change", loadPromptEditor);
els.btnSalvarPrompt.addEventListener("click", savePromptEditor);
els.btnCopiarPromptAtual.addEventListener("click", () => copyText(els.promptEditor.value || ""));
els.btnResetPrompt.addEventListener("click", resetPromptToDefault);

// histórico
els.historySearch.addEventListener("input", renderHistory);
els.historyFilterStatus.addEventListener("change", renderHistory);
els.btnLimparHistorico.addEventListener("click", () => {
  if (confirm("Limpar todo o histórico?")) {
    localStorage.removeItem(STORAGE.HISTORY);
    renderHistory();
    toast("Histórico limpo");
  }
});

// config
els.btnExportar.addEventListener("click", exportJSON);
els.importFile.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) importJSON(f);
  e.target.value = "";
});
els.btnResetTudo.addEventListener("click", resetAll);
els.btnAbrirPastaDica.addEventListener("click", () => {
  toast("Dica exibida 👇");
  els.dicaTexto.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Editor: abrir / fechar
els.btnAbrirEditor.addEventListener("click", openEditor);
els.btnFecharEditor.addEventListener("click", closeEditor);

// Editor actions
els.btnSalvarRoteiro.addEventListener("click", salvarRoteiroManual);
els.btnCopiarRoteiro.addEventListener("click", () => copyText(els.roteiroEditor.value || ""));
els.btnBaixarRoteiro.addEventListener("click", baixarRoteiroTxt);
els.btnLimparRoteiro.addEventListener("click", limparRoteiro);

// autosave do roteiro
els.roteiroEditor.addEventListener("input", scheduleAutosave);

// fechar modal fora + ESC
els.roteiroModal.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "true") closeEditor();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeEditor();
});

// canais
els.btnAddCanal.addEventListener("click", addCanal);
els.canalSearch.addEventListener("input", renderCanais);
els.canalFilterNicho.addEventListener("input", renderCanais);
els.btnLimparCanais.addEventListener("click", () => {
  if (!confirm("Limpar todos os canais salvos?")) return;
  localStorage.removeItem(STORAGE.CANAIS);
  renderCanais();
  toast("Canais limpos");
});

// start
loadPromptEditor();
renderHistory();
renderCanais();
openTopTab("top-producao");
openSubTab("sub-workflow");
