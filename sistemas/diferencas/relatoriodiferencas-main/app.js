// =========================
// 🔥 IMPORTS FIREBASE
// =========================
import {
    db,
    auth,
    onAuthStateChanged,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    orderBy
} from "./firebase.js";

// =========================
// 🔥 ELEMENTOS
// =========================
const modalRelatorios = document.getElementById("modalRelatorios");
const modalResumo = document.getElementById("modalResumo");
const posModal = document.getElementById("posModal");

const btnAbrirRelatorios = document.getElementById("btnAbrirRelatorios");
const btnFecharModalRelatorios = document.getElementById("btnFecharModalRelatorios");
const btnFecharResumo = document.getElementById("btnFecharResumo");

// Filtros
const filtroMatricula = document.getElementById("filtroMatricula");
const filtroDataGlobal = document.getElementById("filtroDataGlobal");

const listaRelatoriosModal = document.getElementById("listaRelatoriosModal");

let usuarioLogado = null;
let isAdmin = false;

// =========================
// 🔥 CARREGAR DADOS DO USUÁRIO
// =========================
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    usuarioLogado = user;

    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    isAdmin = userDoc.exists() && userDoc.data().admin === true;

    aplicarPermissoes();
    carregarMatriculas();
});

// =========================
// 🔥 PERMISSÕES
// =========================
function aplicarPermissoes() {
    document.querySelectorAll(".admin-only").forEach(el => {
        el.hidden = !isAdmin;
    });

    document.querySelectorAll(".user-only").forEach(el => {
        el.hidden = isAdmin;
    });
}

// =========================
// 🔥 CARREGAR MATRÍCULAS
// =========================
async function carregarMatriculas() {
    const snap = await getDocs(collection(db, "usuarios"));

    const matriculas = [];

    snap.forEach(doc => {
        matriculas.push({ id: doc.id, ...doc.data() });
    });

    // Preenche filtro do modal
    filtroMatricula.innerHTML = `<option value="">Selecione</option>`;
    matriculas.forEach(m => {
        filtroMatricula.innerHTML += `<option value="${m.matricula}">${m.matricula} - ${m.nome}</option>`;
    });

    // Campo do admin "Resumo do Recebedor"
    const selectMatriculas = document.getElementById("selectMatriculas");
    selectMatriculas.innerHTML = `<option value="">Selecione</option>`;
    matriculas.forEach(m => {
        selectMatriculas.innerHTML += `<option value="${m.matricula}">${m.matricula} - ${m.nome}</option>`;
    });

    // Para admins → manter sempre "Selecione"
    if (isAdmin) {
        filtroMatricula.value = "";
        selectMatriculas.value = "";
    }
}

// =========================
// 🔥 ABRIR E FECHAR MODAIS
// =========================

// Abrir modal de relatórios
btnAbrirRelatorios.addEventListener("click", () => {
    modalRelatorios.showModal();
});

// FECHAR SOMENTE O MODAL DE RELATÓRIOS
btnFecharModalRelatorios.addEventListener("click", () => {
    modalRelatorios.close();
});

// FECHAR SOMENTE O RESUMO (sem fechar o modal principal)
btnFecharResumo.addEventListener("click", () => {
    modalResumo.close();
});

// =========================
// 🔥 CARREGAR RELATÓRIOS
// =========================
document.getElementById("btnFiltrarPorData").addEventListener("click", async () => {
    const data = filtroDataGlobal.value;
    const matricula = filtroMatricula.value;

    let q = query(collection(db, "relatorios"), orderBy("data", "desc"));

    if (data) {
        q = query(collection(db, "relatorios"), where("data", "==", data));
    }

    if (matricula) {
        q = query(collection(db, "relatorios"), where("matricula", "==", matricula));
    }

    const snap = await getDocs(q);

    listaRelatoriosModal.innerHTML = "";

    snap.forEach(doc => {
        const r = doc.data();

        const item = document.createElement("div");
        item.classList.add("item-relatorio");
        item.innerHTML = `
            <strong>${r.data}</strong><br>
            Matrícula: ${r.matricula}<br>
            Diferença: <b>${r.diferenca}</b><br>
            <button class="btn outline verResumo" data-id="${doc.id}">Ver Resumo</button>
        `;

        listaRelatoriosModal.appendChild(item);
    });

    document.querySelectorAll(".verResumo").forEach(btn => {
        btn.addEventListener("click", abrirResumoRelatorio);
    });
});

// =========================
// 🔥 MOSTRAR RESUMO DO RELATÓRIO
// =========================
async function abrirResumoRelatorio(e) {
    const id = e.target.dataset.id;
    const docRef = await getDoc(doc(db, "relatorios", id));

    if (!docRef.exists()) return;

    const r = docRef.data();

    document.getElementById("conteudoResumo").innerHTML = `
        <p><b>Matrícula:</b> ${r.matricula}</p>
        <p><b>Data:</b> ${r.data}</p>
        <p><b>Folha:</b> R$ ${r.folha}</p>
        <p><b>Dinheiro:</b> R$ ${r.dinheiro}</p>
        <p><b>Diferença:</b> ${r.diferenca}</p>
        <p><b>Obs:</b> ${r.observacao || "-"}</p>
    `;

    modalResumo.showModal();
}

