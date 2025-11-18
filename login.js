import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ============================================================
// 🔥 CONFIG FIREBASE
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBWmq02P8pGbl2NmppEAIKtF9KtQ7AzTFQ",
  authDomain: "unificado-441cd.firebaseapp.com",
  projectId: "unificado-441cd",
  storageBucket: "unificado-441cd.firebasestorage.app",
  messagingSenderId: "671392063569",
  appId: "1:671392063569:web:57e3f6b54fcdc45862d870",
  measurementId: "G-6GQX395J9C",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================
// ⭐ ALERTA BONITO
// ============================================================
function showAlert(message, type = "error") {
  const alertBox = document.getElementById("alertBox");
  if (!alertBox) return alert(message);

  alertBox.innerHTML = message;
  alertBox.className = `${type} show`;
  alertBox.style.display = "block";

  setTimeout(() => {
    alertBox.classList.remove("show");
    setTimeout(() => (alertBox.style.display = "none"), 200);
  }, 3500);
}

// ============================================================
// 🔐 LOGIN
// ============================================================
document.getElementById("loginBtn").addEventListener("click", async () => {
  const matricula = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!matricula)
    return showAlert("Digite sua matrícula.", "error");

  const email = matricula.includes("@")
    ? matricula
    : `${matricula}@movebuss.local`;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      showAlert("Usuário não encontrado no banco de dados.", "error");
      return;
    }

    const userData = userDoc.data();
    localStorage.setItem("isAdmin", userData.admin === true);

    window.location.href = "index.html";
  } catch (error) {
    showAlert("Senha incorreta ou usuário inválido.", "error");
  }
});

// ============================================================
// ⌨ ENTER DISPARA LOGIN  (MANTENDO SUA LÓGICA)
// ============================================================
document.addEventListener("keydown", (event) => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  // offsetParent verifica se o elemento está realmente visível
  const loginFormVisible = form.offsetParent !== null;

  if (event.key === "Enter" && loginFormVisible) {
    event.preventDefault();
    document.getElementById("loginBtn").click();
  }
});

// ============================================================
// 🧾 MODAL CRIAR CONTA
// ============================================================
document.getElementById("showCreateAccountBtn").addEventListener("click", () => {
  document.getElementById("createAccountModal").classList.remove("hidden");
});

document.getElementById("closeModalBtn").addEventListener("click", () => {
  document.getElementById("createAccountModal").classList.add("hidden");
});

// ============================================================
// 🧍 CRIAR CONTA
// ============================================================
document.getElementById("createAccountBtn").addEventListener("click", async () => {
  const nome = document.getElementById("newName").value.trim();
  const matricula = document.getElementById("newEmail").value.trim();
  const dataAdmissao = document.getElementById("newDataAdmissao").value.trim();
  const senha = document.getElementById("newPassword").value;
  const confirmar = document.getElementById("confirmPassword").value;

  if (!nome || !matricula || !senha || !confirmar || !dataAdmissao)
    return showAlert("Preencha todos os campos.", "error");

  if (senha !== confirmar)
    return showAlert("As senhas não conferem.", "error");

  const email = matricula.includes("@")
    ? matricula
    : `${matricula}@movebuss.local`;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nome });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      nome,
      matricula,
      email,
      dataAdmissao,
      createdAt: new Date(),
      admin: false
    });

    showAlert("Conta criada com sucesso!", "success");

    document.getElementById("createAccountModal").classList.add("hidden");

  } catch (error) {
    showAlert("Erro ao criar conta: " + error.message, "error");
  }
});
