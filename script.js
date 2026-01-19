// script.js
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ============================================================
// ⭐ ALERTA GLOBAL (INDEX)  ← ÚNICA ADIÇÃO
// ============================================================
function showAlert(message, type = "error") {
  const alertBox = document.getElementById("alertBox");

  if (!alertBox) {
    alert(message);
    return;
  }

  alertBox.textContent = message;
  alertBox.className = `alert ${type} show`;
  alertBox.style.display = "block";

  setTimeout(() => {
    alertBox.classList.remove("show");
    setTimeout(() => {
      alertBox.style.display = "none";
    }, 200);
  }, 3500);
}

// 🔹 Elementos principais
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logoutBtn');
const changePassBtn = document.getElementById('changePassBtn');
const sidebarBadge = document.getElementById('sidebarBadge');
const frame = document.getElementById('mainFrame');
const iframeContainer = document.getElementById('iframeContainer');
const avisosSection = document.getElementById('avisosSection');
const dataVigenteSpan = document.getElementById('dataVigente');

// 🔹 Rotas
const ROUTES = {
  home: null,
  abastecimento: "sistemas/abastecimento/index.html",
  emprestimo: "sistemas/emprestimo/index.html",
  relatorios: "sistemas/emprestimo/emprestimocartao-main/relatorio.html",
  diferencas: "sistemas/diferencas/index.html",
  escala: "sistemas/escala/escala.html"
};

// 🔹 Loading overlay
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'loadingOverlay';
loadingOverlay.innerHTML = `<div class="spinner"></div><div>Carregando...</div>`;
document.body.appendChild(loadingOverlay);
function showLoading() { loadingOverlay.style.display = 'flex'; }
function hideLoading() { loadingOverlay.style.display = 'none'; }

// 🔹 Ajustes iniciais
document.addEventListener("DOMContentLoaded", () => {
  const topbar = document.querySelector(".topbar");
  if (topbar) topbar.style.height = "32px";
  iframeContainer.style.height = "calc(100vh - 32px)";
  iframeContainer.style.top = "0";
  frame.style.height = "calc(100vh - 32px)";
});

// 🔹 Navegação
function goHome() {
  iframeContainer.classList.remove('full');
  iframeContainer.style.display = 'none';
  avisosSection.style.display = 'block';
  sidebar.style.display = 'flex';
}

function openRoute(route) {
  const src = ROUTES[route];
  if (!src) { goHome(); return; }

  showLoading();
  avisosSection.style.display = 'none';
  iframeContainer.style.display = 'block';
  iframeContainer.classList.add('full');

  frame.onload = async () => {
    await sendAuthToIframe();
    ajustarAlturaIframe(frame);
    hideLoading();
  };

  frame.src = src;
}

// 🔹 Data
if (dataVigenteSpan) {
  const hoje = new Date();
  dataVigenteSpan.textContent =
    String(hoje.getDate()).padStart(2, '0') + "/" +
    String(hoje.getMonth() + 1).padStart(2, '0') + "/" +
    hoje.getFullYear();
}

// ============================================================
// 🔹 Garante usuário no Firestore
// ============================================================
async function ensureUserInFirestore(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const matricula = (user.email || "").split("@")[0];

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || "",
      matricula,
      nome: user.displayName || matricula,
      admin: false,
      createdAt: new Date()
    });
  }

  const finalSnap = await getDoc(ref);
  return {
    matricula: finalSnap.data().matricula,
    isAdmin: finalSnap.data().admin === true
  };
}

// ============================================================
// 🔹 AUTENTICAÇÃO
// ============================================================
onAuthStateChanged(auth, async (user) => {
  showLoading();

  if (!user) {
    hideLoading();
    window.location.href = "login.html";
    return;
  }

  const { matricula, isAdmin } = await ensureUserInFirestore(user);

  // 🔒 VERIFICA EMAIL DE RECUPERAÇÃO (BLOQUEANTE)
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.data().emailRecuperacao) {
    bloquearSistema();
    mostrarModalEmailRecuperacao(user);
    hideLoading();
    return;
  }

  // 🔓 Liberação normal
  sidebar.classList.remove('hidden');
  sidebarBadge.textContent = matricula;

  if (!isAdmin) {
    document.querySelectorAll('.adminOnly')
      .forEach(b => b.style.display = 'none');
  }

  goHome();
  hideLoading();
});

// ============================================================
// 🔹 BLOQUEIO DO SISTEMA
// ============================================================
function bloquearSistema() {
  document.body.style.overflow = "hidden";
  sidebar.style.pointerEvents = "none";
  iframeContainer.style.display = "none";
  avisosSection.style.display = "none";
}

function liberarSistema() {
  document.body.style.overflow = "";
  sidebar.style.pointerEvents = "auto";
  goHome();
}

// ============================================================
// 📩 MODAL EMAIL DE RECUPERAÇÃO (PADRÃO)
// ============================================================
function mostrarModalEmailRecuperacao(user) {
  if (document.getElementById("modalEmailRecuperacao")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="modalEmailRecuperacao" class="modal-overlay">
      <div class="modal-box">
        <h2>Email de Recuperação</h2>

        <label>Email para recuperar sua senha</label>
        <input type="email" id="emailRecuperacaoInput" placeholder="exemplo@email.com">

        <div class="modal-actions">
          <button class="btn-confirm" id="salvarEmailRecuperacao">Salvar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById("salvarEmailRecuperacao").onclick = async () => {
    const email = document.getElementById("emailRecuperacaoInput").value.trim();
    if (!email.includes("@")) {
      showAlert("Digite um email válido.", "error");
      return;
    }

    await setDoc(doc(db, "users", user.uid), {
      emailRecuperacao: email
    }, { merge: true });

    document.getElementById("modalEmailRecuperacao").remove();
    liberarSistema();
    showAlert("Email de recuperação salvo com sucesso!", "success");
  };
}

// ============================================================
// 🔹 Logout
// ============================================================
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);
    window.location.href = "login.html";
  };
}

// ============================================================
// 🔹 Ajuste iframe
// ============================================================
function ajustarAlturaIframe(iframe) {
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    iframe.style.height = doc.body.scrollHeight + "px";
  } catch {}
}
