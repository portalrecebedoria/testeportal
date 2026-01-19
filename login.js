import { app, auth, db } from "./firebaseConfig_v2.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collection
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// =======================================================
// 🔔 Alerta bonito
// =======================================================
function showAlert(message, type = "error") {
  const alertBox = document.getElementById("alertBox");
  alertBox.textContent = message;
  alertBox.className = `alert-box ${type}`;
  alertBox.style.opacity = "1";

  setTimeout(() => {
    alertBox.style.opacity = "0";
  }, 3500);
}

// =======================================================
// 🔄 Alternar formulários
// =======================================================
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
const formTitle = document.getElementById("formTitle");

registerForm.style.display = "none";

showRegister.addEventListener("click", () => {
  loginForm.style.display = "none";
  registerForm.style.display = "block";
  formTitle.textContent = "Registrar";
});

showLogin.addEventListener("click", () => {
  registerForm.style.display = "none";
  loginForm.style.display = "block";
  formTitle.textContent = "Login";
});

// =======================================================
// ⌨ ENTER faz login
// =======================================================
document.addEventListener("keydown", (event) => {
  const loginVisible = loginForm.style.display !== "none";
  if (event.key === "Enter" && loginVisible) {
    event.preventDefault();
    document.getElementById("btnLogin").click();
  }
});

// =======================================================
// 🔐 LOGIN (INALTERADO NA LÓGICA)
// =======================================================
document.getElementById("btnLogin").addEventListener("click", async () => {
  const matricula = document.getElementById("loginMatricula").value.trim();
  const senha = document.getElementById("loginSenha").value.trim();

  if (!matricula || !senha)
    return showAlert("Preencha todos os campos.", "error");

  try {
    await signInWithEmailAndPassword(
      auth,
      `${matricula}@movebuss.local`,
      senha
    );
    window.location.href = "index.html";
  } catch {
    showAlert("Senha incorreta ou usuário inválido.", "error");
  }
});

// =======================================================
// 🔑 RECUPERAR SENHA (NOVO)
// =======================================================
document.getElementById("recoverPassword").addEventListener("click", async () => {
  const matricula = document.getElementById("loginMatricula").value.trim();

  if (!matricula)
    return showAlert("Informe a matrícula.", "error");

  try {
    // busca usuário pelo campo matricula
    const q = query(
      collection(db, "users"),
      where("matricula", "==", matricula)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty)
      return showAlert("Usuário não encontrado.", "error");

    const userData = snapshot.docs[0].data();

    if (!userData.emailRecuperacao)
      return showAlert(
        "Usuário ainda não possui email de recuperação cadastrado.",
        "error"
      );

    await sendPasswordResetEmail(auth, userData.emailRecuperacao);

    showAlert(
      "Email de recuperação enviado com sucesso!",
      "success"
    );

  } catch (e) {
    showAlert("Erro ao enviar email de recuperação.", "error");
  }
});

// =======================================================
// 📝 REGISTRO (INALTERADO)
// =======================================================
document.getElementById("btnRegistrar").addEventListener("click", async () => {
  const nome = document.getElementById("regNome").value.trim();
  const matricula = document.getElementById("regMatricula").value.trim();
  const dataAdmissao = document.getElementById("regDataAdmissao").value.trim();
  const senha = document.getElementById("regSenha").value.trim();
  const confirmaSenha = document.getElementById("regConfirmaSenha").value.trim();

  if (!nome || !matricula || !senha || !confirmaSenha || !dataAdmissao)
    return showAlert("Preencha todos os campos.", "error");

  if (senha !== confirmaSenha)
    return showAlert("As senhas não conferem.", "error");

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      `${matricula}@movebuss.local`,
      senha
    );

    await updateProfile(cred.user, { displayName: nome });

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      nome,
      matricula,
      email: `${matricula}@movebuss.local`,
      emailRecuperacao: "",
      dataAdmissao,
      createdAt: new Date(),
      admin: false
    });

    showAlert("Usuário registrado com sucesso!", "success");

    registerForm.style.display = "none";
    loginForm.style.display = "block";
    formTitle.textContent = "Login";

  } catch (e) {
    showAlert("Erro ao registrar: " + e.message, "error");
  }
});
