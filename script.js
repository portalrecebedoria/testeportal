// script.js
import { auth, db } from "./firebaseConfig.js";
import { 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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

// 🔹 Ajusta topbar e iframe
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

    const user = auth.currentUser;
    if (user) {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const isAdmin = userSnap.exists() ? userSnap.data().admin === true : false;
      if (!isAdmin && route === 'escala') {
        frame.contentWindow.postMessage({ type: "aumentarBadges" }, "*");
      }
    }
    hideLoading();
  };
  frame.src = src;
}

// 🔹 (restante do arquivo permanece IDÊNTICO)
// 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹
// 👉 NADA FOI ALTERADO ATÉ AQUI
// 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹

// ============================================================
// 🔹 RECUPERAÇÃO DE SENHA (ADICIONADO)
// ============================================================
window.recuperarSenha = async function(email) {
  try {
    if (!email) {
      showAlert("Informe o email para recuperação.", "error");
      return;
    }

    await sendPasswordResetEmail(auth, email);
    showAlert("Email de recuperação enviado com sucesso.", "success");

  } catch (error) {
    console.error("Erro ao enviar recuperação:", error);

    let msg = "Falha ao enviar email de recuperação.";
    if (error.code === "auth/user-not-found") {
      msg = "Usuário não encontrado.";
    } else if (error.code === "auth/invalid-email") {
      msg = "Email inválido.";
    }

    showAlert(msg, "error");
  }
};
