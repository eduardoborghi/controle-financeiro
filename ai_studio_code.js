// ================= ESTADO DA APLICAÇÃO =================
let transacoes = JSON.parse(localStorage.getItem('transacoes')) ||[];
let cartoes = JSON.parse(localStorage.getItem('cartoes')) ||[];
let senhaApp = localStorage.getItem('senha_app') || 'eduardoborghi';
let graficoCategorias, graficoPagamentos;

// Configura a data padrão para hoje no formulário
document.getElementById('t-data').valueAsDate = new Date();

// ================= SISTEMA DE LOGIN =================
function login() {
    const input = document.getElementById('password-input').value;
    if (input === senhaApp) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        atualizarDashboard();
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function logout() {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('password-input').value = '';
}

function mudarSenha() {
    const nova = document.getElementById('nova-senha').value;
    if(nova.length < 3) return alert('A senha deve ter no mínimo 3 caracteres.');
    senhaApp = nova;
    localStorage.setItem('senha_app', senhaApp);
    alert('Senha atualizada com sucesso!');
    document.getElementById('nova-senha').value = '';
}

// ================= NAVEGAÇÃO =================
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    if(tabId === 'resumo') atualizarDashboard();
}

// ================= TRANSAÇÕES =================
document.getElementById('form-transacao').addEventListener('submit', function(e) {
    e.preventDefault();
    const transacao = {
        id: Date.now(),
        descricao: document.getElementById('t-descricao').value,
        tipo: document.getElementById('t-tipo').value,
        valor: parseFloat(document.getElementById('t-valor').value),
        qtd: parseInt(document.getElementById('t-qtd').value),
        categoria: document.getElementById('t-categoria').value,
        pagamento: document.getElementById('t-pagamento').value,
        data: document.getElementById('t-data').value
    };
    
    transacoes.push(transacao);
    salvarDados();
    this.reset();
    document.getElementById('t-data').valueAsDate = new Date();
    alert('Transação adicionada!');
    renderizarTransacoes();
});

function renderizarTransacoes() {
    const tbody = document.getElementById('tabela-transacoes');
    tbody.innerHTML = '';
    
    // Ordenar da mais recente para a mais antiga
    const transacoesOrdenadas = [...transacoes].sort((a,b) => new Date(b.data) - new Date(a.data));

    transacoesOrdenadas.forEach(t => {
        const total = t.valor * t.qtd;
        const corValor = t.tipo === 'receita' ? 'text-green-600' : 'text-red-600';
        const sinal = t.tipo === 'receita' ? '+' : '-';

        tbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3">${t.data.split('-').reverse().join('/')}</td>
                <td class="p-3 font-medium">${t.descricao}</td>
                <td class="p-3"><span class="bg-gray-200 text-xs px-2 py-1 rounded">${t.categoria}</span></td>
                <td class="p-3">${t.pagamento}</td>
                <td class="p-3">${t.qtd}</td>
                <td class="p-3 font-bold ${corValor}">${sinal} R$ ${total.toFixed(2)}</td>
                <td class="p-3">
                    <button onclick="deletarTransacao(${t.id})" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function deletarTransacao(id) {
    if(confirm('Apagar esta transação?')) {
        transacoes = transacoes.filter(t => t.id !== id);
        salvarDados();
        renderizarTransacoes();
        atualizarDashboard();
    }
}

// ================= CARTÕES =================
document.getElementById('form-cartao').addEventListener('submit', function(e) {
    e.preventDefault();
    const cartao = {
        id: Date.now(),
        nome: document.getElementById('c-nome').value,
        banco: document.getElementById('c-banco').value,
        vencimento: document.getElementById('c-vencimento').value
    };
    cartoes.push(cartao);
    salvarDados();
    this.reset();
    renderizarCartoes();
});

function renderizarCartoes() {
    const lista = document.getElementById('lista-cartoes');
    lista.innerHTML = '';
    cartoes.forEach(c => {
        lista.innerHTML += `
            <div class="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-xl shadow-lg relative">
                <button onclick="deletarCartao(${c.id})" class="absolute top-4 right-4 text-slate-400 hover:text-white"><i class="fa-solid fa-trash"></i></button>
                <i class="fa-solid fa-credit-card text-3xl mb-4 text-slate-300"></i>
                <h4 class="text-xl font-bold uppercase tracking-widest mb-1">${c.nome}</h4>
                <p class="text-slate-400 text-sm mb-4">${c.banco}</p>
                <p class="text-sm">Vence dia: <span class="font-bold text-blue-300">${c.vencimento}</span></p>
            </div>
        `;
    });
}

function deletarCartao(id) {
    if(confirm('Remover este cartão?')) {
        cartoes = cartoes.filter(c => c.id !== id);
        salvarDados();
        renderizarCartoes();
    }
}

// ================= DASHBOARD & GRÁFICOS =================
function atualizarDashboard() {
    let receitas = 0, despesas = 0;
    let gastosPorCat = {}, gastosPorPgto = {};

    transacoes.forEach(t => {
        const total = t.valor * t.qtd;
        if (t.tipo === 'receita') {
            receitas += total;
        } else {
            despesas += total;
            // Somar para gráficos (apenas despesas)
            gastosPorCat[t.categoria] = (gastosPorCat[t.categoria] || 0) + total;
            gastosPorPgto[t.pagamento] = (gastosPorPgto[t.pagamento] || 0) + total;
        }
    });

    const saldo = receitas - despesas;

    document.getElementById('total-receitas').innerText = `R$ ${receitas.toFixed(2)}`;
    document.getElementById('total-despesas').innerText = `R$ ${despesas.toFixed(2)}`;
    document.getElementById('saldo-atual').innerText = `R$ ${saldo.toFixed(2)}`;
    
    if(saldo < 0) {
        document.getElementById('saldo-atual').classList.replace('text-blue-600', 'text-red-600');
    } else {
        document.getElementById('saldo-atual').classList.replace('text-red-600', 'text-blue-600');
    }

    renderizarGraficos(gastosPorCat, gastosPorPgto);
    renderizarTransacoes();
    renderizarCartoes();
}

function renderizarGraficos(dadosCat, dadosPgto) {
    const ctxCat = document.getElementById('chartCategorias');
    const ctxPgto = document.getElementById('chartPagamentos');

    if(graficoCategorias) graficoCategorias.destroy();
    if(graficoPagamentos) graficoPagamentos.destroy();

    // Gráfico de Categorias (Rosca)
    graficoCategorias = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dadosCat),
            datasets:[{
                data: Object.values(dadosCat),
                backgroundColor:['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
            }]
        }
    });

    // Gráfico de Pagamentos (Barra)
    graficoPagamentos = new Chart(ctxPgto, {
        type: 'bar',
        data: {
            labels: Object.keys(dadosPgto),
            datasets:[{
                label: 'Gastos R$',
                data: Object.values(dadosPgto),
                backgroundColor: '#3b82f6'
            }]
        }
    });
}

// ================= UTILIDADES =================
function salvarDados() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
    localStorage.setItem('cartoes', JSON.stringify(cartoes));
}

// Backup de dados (Exportar)
function exportarDados() {
    const dados = { transacoes, cartoes, senhaApp };
    const blob = new Blob([JSON.stringify(dados)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

// Restaurar dados (Importar)
function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            transacoes = dados.transacoes ||[];
            cartoes = dados.cartoes ||[];
            if(dados.senhaApp) {
                senhaApp = dados.senhaApp;
                localStorage.setItem('senha_app', senhaApp);
            }
            salvarDados();
            alert('Dados importados com sucesso!');
            atualizarDashboard();
        } catch (err) {
            alert('Erro ao importar arquivo. Certifique-se de que é um backup válido.');
        }
    };
    reader.readAsText(file);
}

function limparTudo() {
    if(confirm('ATENÇÃO: Isso apagará todas as suas transações e cartões. Tem certeza?')) {
        transacoes = [];
        cartoes =[];
        salvarDados();
        atualizarDashboard();
        alert('Dados apagados.');
    }
}