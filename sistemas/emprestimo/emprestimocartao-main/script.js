// Espera carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
    const tipoCartao = document.getElementById("tipoCartao");
    const digiconField = document.getElementById("digiconField");
    const prodataField = document.getElementById("prodataField");
    const meiaViagemField = document.getElementById("meiaViagemField");
    const dataRetirada = document.getElementById("dataRetirada");
    const form = document.getElementById("emprestimoForm");

    // Preenche a data automaticamente (pt-BR)
    function atualizarDataHoje() {
        const hoje = new Date();
        return hoje.toLocaleDateString("pt-BR");
    }

    dataRetirada.value = atualizarDataHoje();

    // Reset inicial dos campos dinâmicos
    if (digiconField) digiconField.style.display = "none";
    if (prodataField) prodataField.style.display = "none";
    if (meiaViagemField) meiaViagemField.style.display = "none";

    // Mostra/oculta campos de acordo com o tipo selecionado
    if (tipoCartao) {
      tipoCartao.addEventListener("change", () => {
        // Oculta tudo antes
        if (digiconField) digiconField.style.display = "none";
        if (prodataField) prodataField.style.display = "none";
        if (meiaViagemField) meiaViagemField.style.display = "none";

        if (tipoCartao.value === "DIGICON") {
            if (digiconField) digiconField.style.display = "flex";
            if (meiaViagemField) meiaViagemField.style.display = "flex";
        } 
        else if (tipoCartao.value === "PRODATA") {
            if (prodataField) prodataField.style.display = "flex";
            if (meiaViagemField) meiaViagemField.style.display = "flex";
        } 
        else if (tipoCartao.value === "MEIA") {
            if (meiaViagemField) meiaViagemField.style.display = "flex";
        }
      });
    }

    // Calcula o prazo de devolução automaticamente
    function calcularPrazo(motivo) {
        const prazo = new Date();
        const m = (motivo || "").toLowerCase();

        if (m === "perda" || m === "roubo/furto") {
            prazo.setDate(prazo.getDate() + 3);
        } else if (m === "danificado") {
            prazo.setDate(prazo.getDate() + 2);
        } else {
            prazo.setDate(prazo.getDate() + 1);
        }

        return prazo.toLocaleDateString("pt-BR");
    }

    // Função de salvar registro
    if (form) {
      form.addEventListener("submit", async (e) => {
          e.preventDefault();

          const dados = {
              nomeMotorista: (document.getElementById("nomeMotorista")?.value || "").trim(),
              matriculaMotorista: (document.getElementById("matriculaMotorista")?.value || "").trim(),
              tipoCartao: tipoCartao ? tipoCartao.value : "",

              // Apenas coleta o valor real dos campos visíveis
              numBordoDigicon: ((document.getElementById("numBordoDigicon")?.value) || "").trim(),
              numBordoProdata: ((document.getElementById("numBordoProdata")?.value) || "").trim(),
              numMeiaViagem: ((document.getElementById("numMeiaViagem")?.value) || "").trim(),

              motivo: (document.getElementById("motivo")?.value || ""),
              matriculaEmpresto: (document.getElementById("matriculaEmpresto")?.value || "").trim(),

              dataRetirada: dataRetirada ? dataRetirada.value : atualizarDataHoje(),
              prazoDevolucao: calcularPrazo(document.getElementById("motivo")?.value || ""),

              status: "em aberto",
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
          };

          try {
              // Salvar no Firestore
              await db.collection("emprestimos").add(dados);

              // Gera os PDFs (funções devem existir no projeto)
              if (typeof gerarPDF_A4 === 'function') gerarPDF_A4(dados);
              if (typeof gerarPDF_Termica === 'function') gerarPDF_Termica(dados);

              alert("Registro salvo com sucesso!");

              // Resetar formulário
              form.reset();
              if (dataRetirada) dataRetirada.value = atualizarDataHoje();

              // Ocultar campos dinâmicos após reset
              if (digiconField) digiconField.style.display = "none";
              if (prodataField) prodataField.style.display = "none";
              if (meiaViagemField) meiaViagemField.style.display = "none";

          } catch (error) {
              console.error("Erro ao salvar:", error);
              alert("Erro ao salvar registro. Veja o console.");
          }
      });
    }
});
