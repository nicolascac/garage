// --- Classe Manutencao (Sem alterações) ---
class Manutencao {
    constructor(data, tipo, custo, descricao = '') {
        this.data = data instanceof Date ? data : new Date(data);
        if (isNaN(this.data.getTime())) {
            console.warn("Data fornecida resultou em data inválida:", data);
        }
        this.tipo = tipo.trim();
        this.custo = parseFloat(custo) || 0;
        this.descricao = descricao.trim();
        this.id = `man-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
    }

    validar() {
        const erros = [];
        if (!(this.data instanceof Date) || isNaN(this.data.getTime())) {
            erros.push("Data inválida.");
        }
        if (!this.tipo) {
            erros.push("Tipo de serviço é obrigatório.");
        }
        if (this.custo < 0) {
            erros.push("Custo não pode ser negativo.");
        }
        return erros;
    }

    formatar(incluirVeiculo = false, nomeVeiculo = '') {
        let dataFormatada = "Data inválida";
        if (this.data instanceof Date && !isNaN(this.data.getTime())) {
             dataFormatada = this.data.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        let str = `<strong>${this.tipo}</strong> em ${dataFormatada} - ${custoFormatado}`;
        if (this.descricao) {
            str += ` <em>(${this.descricao})</em>`;
        }
         if (incluirVeiculo && nomeVeiculo) {
            str += ` - [Veículo: ${nomeVeiculo}]`;
        }
        return str;
    }

    toJSON() {
        return {
            data: (this.data instanceof Date && !isNaN(this.data.getTime())) ? this.data.toISOString() : null,
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
            id: this.id
        };
    }
}

// --- Classes de Veículos (Sem alterações significativas na estrutura base) ---
class Veiculo {
    constructor(modelo, cor, id = null, tipoVeiculo = 'Veiculo') {
        this.id = id || `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.ligado = false;
        this.velocidade = 0;
        this.historicoManutencao = [];
        this.tipoVeiculo = tipoVeiculo;
    }

    ligar() {
        if (this.ligado) {
            exibirNotificacao(`${this.modelo} já está ligado.`, 'warning');
            return;
        }
        this.ligado = true;
        exibirNotificacao(`${this.modelo} ligado.`, 'info');
        if (typeof atualizarInfoVeiculoNoModal === 'function') atualizarInfoVeiculoNoModal(this.id);
        salvarGaragem();
    }

    desligar() {
        if (!this.ligado) {
            exibirNotificacao(`${this.modelo} já está desligado.`, 'warning');
            return;
        }
        this.ligado = false;
        this.velocidade = 0;
        exibirNotificacao(`${this.modelo} desligado.`, 'info');
        if (typeof atualizarInfoVeiculoNoModal === 'function') atualizarInfoVeiculoNoModal(this.id);
        salvarGaragem();
    }

    acelerar(incremento = 10) {
        if (!this.ligado) {
            exibirNotificacao(`${this.modelo} não pode acelerar, está desligado.`, 'error');
            return;
        }
        this.velocidade += incremento;
        exibirNotificacao(`${this.modelo} acelerou para ${this.velocidade} km/h.`, 'info');
        if (typeof atualizarInfoVeiculoNoModal === 'function') atualizarInfoVeiculoNoModal(this.id);
        // salvarGaragem(); // Opcional
    }

    buzinar() {
        exibirNotificacao(`${this.modelo} buzinou: 📣 Beep beep!`, 'info');
    }

    getInfoBasicaHTML() {
        return `
            <p><strong>ID:</strong> ${this.id}</p>
            <p><strong>Tipo:</strong> ${this.tipoVeiculo}</p>
            <p><strong>Modelo:</strong> ${this.modelo}</p>
            <p><strong>Cor:</strong> ${this.cor}</p>
            <p><strong>Ligado:</strong> <span class="status-${this.ligado ? 'on' : 'off'}">${this.ligado ? 'Sim' : 'Não'}</span></p>
            <p><strong>Velocidade:</strong> ${this.velocidade} km/h</p>
        `;
    }

    getInfoEspecificaHTML() { return ''; }

    exibirInformacoesCompletaHTML() {
        return this.getInfoBasicaHTML() + this.getInfoEspecificaHTML();
    }

    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
            console.error("Objeto inválido passado para adicionarManutencao:", manutencao);
            exibirNotificacao("Erro interno: Tentativa de adicionar manutenção inválida.", 'error');
            return false;
        }
        const erros = manutencao.validar();
        if (erros.length > 0) {
            exibirNotificacao(`Erro ao adicionar/agendar: ${erros.join(' ')}`, 'error');
            return false;
        }
        this.historicoManutencao.push(manutencao);
        this.historicoManutencao.sort((a, b) => b.data - a.data);
        const acao = manutencao.data > new Date() ? 'agendada' : 'registrada';
        exibirNotificacao(`Manutenção (${manutencao.tipo}) ${acao} para ${this.modelo}.`, 'success');
        salvarGaragem();
        return true;
    }

     removerManutencaoPorId(manutencaoId) {
        const tamanhoAntes = this.historicoManutencao.length;
        this.historicoManutencao = this.historicoManutencao.filter(m => m.id !== manutencaoId);
        const removido = this.historicoManutencao.length < tamanhoAntes;
        if (removido) {
            salvarGaragem();
        }
        return removido;
    }

    getHistoricoHTML() {
        if (this.historicoManutencao.length === 0) {
            return '<p>Nenhum registro de manutenção.</p>';
        }
        const agora = new Date();
        let html = '';
        const passadas = this.historicoManutencao.filter(m => m.data <= agora);
        const futuras = this.historicoManutencao.filter(m => m.data > agora);

        if (passadas.length > 0) {
            html += '<h4>Histórico Passado</h4>';
            passadas.forEach(m => {
                html += `<div class="maintenance-item" data-id="${m.id}">
                           <span>${m.formatar()}</span>
                           <button class="small-warning" onclick="removerManutencao('${this.id}', '${m.id}')" title="Remover este registro"><i class="fas fa-trash-alt"></i> Remover</button>
                         </div>`;
            });
        }
        if (futuras.length > 0) {
            html += '<h4>Agendamentos Futuros</h4>';
            futuras.forEach(m => {
                 html += `<div class="schedule-item" data-id="${m.id}">
                            <span>${m.formatar()}</span>
                            <button class="small-warning" onclick="removerManutencao('${this.id}', '${m.id}')" title="Cancelar este agendamento"><i class="fas fa-calendar-times"></i> Cancelar</button>
                          </div>`;
            });
        }
         if (!html) { return '<p>Nenhum registro de manutenção válido encontrado.</p>'; }
        return html;
    }

    static fromJSON(json) {
        if (!json || !json.tipoVeiculo) {
            console.error("Tentativa de reidratar veículo a partir de JSON inválido:", json);
            return null;
        }
        let veiculo;
        try {
            switch (json.tipoVeiculo) {
                case 'Carro': veiculo = new Carro(json.modelo, json.cor, json.id); break;
                case 'CarroEsportivo': veiculo = new CarroEsportivo(json.modelo, json.cor, json.turbo, json.id); break;
                case 'Caminhao':
                    veiculo = new Caminhao(json.modelo, json.cor, json.capacidadeCarga, json.cargaAtual, json.id);
                    veiculo.cargaAtual = json.cargaAtual || 0;
                    break;
                default:
                    console.warn(`Tipo de veículo desconhecido: ${json.tipoVeiculo}. Criando como Veiculo base.`);
                    veiculo = new Veiculo(json.modelo, json.cor, json.id, json.tipoVeiculo);
            }
            veiculo.ligado = json.ligado || false;
            veiculo.velocidade = json.velocidade || 0;
            if (json.historicoManutencao && Array.isArray(json.historicoManutencao)) {
                veiculo.historicoManutencao = json.historicoManutencao.map(mJson => {
                    if (!mJson || !mJson.data || !mJson.tipo) {
                        console.warn("Registro de manutenção inválido no JSON:", mJson); return null;
                    }
                    const manutencao = new Manutencao(mJson.data, mJson.tipo, mJson.custo, mJson.descricao);
                     if (mJson.id) { manutencao.id = mJson.id; }
                     if (isNaN(manutencao.data.getTime())) { console.warn(`Manutenção ${manutencao.id || mJson.tipo} carregada com data inválida.`); }
                    return manutencao;
                }).filter(m => m !== null);
                veiculo.historicoManutencao.sort((a, b) => b.data - a.data);
            } else { veiculo.historicoManutencao = []; }
            return veiculo;
        } catch (error) {
            console.error(`Erro ao reidratar veículo ${json.id || '(sem id)'} do tipo ${json.tipoVeiculo}:`, error);
            return null;
        }
    }

    toJSON() {
        return {
            id: this.id, modelo: this.modelo, cor: this.cor, ligado: this.ligado,
            velocidade: this.velocidade,
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON()),
            tipoVeiculo: this.tipoVeiculo
        };
    }
}

class Carro extends Veiculo {
    constructor(modelo, cor, id = null) { super(modelo, cor, id, 'Carro'); }
}

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, turbo = false, id = null) {
        super(modelo, cor, id, 'CarroEsportivo');
        this.turbo = turbo;
    }
    ativarTurbo() {
        if (this.turbo) { exibirNotificacao('Turbo já ativado!', 'warning'); return; }
         if (!this.ligado) { exibirNotificacao('Ligue antes de ativar o turbo!', 'error'); return; }
        this.turbo = true;
        exibirNotificacao('🚀 Turbo ativado!', 'success');
        if (typeof atualizarInfoVeiculoNoModal === 'function') atualizarInfoVeiculoNoModal(this.id);
        salvarGaragem();
    }
    desativarTurbo() {
        if (!this.turbo) { exibirNotificacao('Turbo já desativado!', 'warning'); return; }
        this.turbo = false;
        exibirNotificacao('Turbo desativado.', 'info');
        if (typeof atualizarInfoVeiculoNoModal === 'function') atualizarInfoVeiculoNoModal(this.id);
        salvarGaragem();
    }
    getInfoEspecificaHTML() { return `<p><strong>Turbo:</strong> <span class="status-${this.turbo ? 'on' : 'off'}">${this.turbo ? 'Ativado' : 'Desativado'}</span></p>`; }
    toJSON() { const json = super.toJSON(); json.turbo = this.turbo; return json; }
}

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga, cargaAtual = 0, id = null) {
        super(modelo, cor, id, 'Caminhao');
        this.capacidadeCarga = Math.max(0, parseFloat(capacidadeCarga) || 0);
        this.cargaAtual = Math.max(0, parseFloat(cargaAtual) || 0);
    }
    _validarPeso(peso) {
         const pesoNumerico = parseFloat(peso);
         if (isNaN(pesoNumerico) || pesoNumerico <= 0) {
             exibirNotificacao('Peso inválido. Insira um número positivo.', 'error'); return null;
         } return pesoNumerico;
    }
    carregar(peso) {
        const pesoNumerico = this._validarPeso(peso); if (pesoNumerico === null) return;
        if (this.cargaAtual + pesoNumerico <= this.capacidadeCarga) {
            this.cargaAtual += pesoNumerico;
            exibirNotificacao(`Caminhão carregado com ${pesoNumerico.toLocaleString('pt-BR')} kg. Carga atual: ${this.cargaAtual.toLocaleString('pt-BR')} kg.`, 'success');
            if (typeof atualizarInfoVeiculoNoModal === 'function') atualizarInfoVeiculoNoModal(this.id);
            salvarGaragem();
        } else {
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            exibirNotificacao(`Carga (${pesoNumerico.toLocaleString('pt-BR')}kg) excede capacidade! Livre: ${espacoLivre.toLocaleString('pt-BR')}kg.`, 'error');
        }
    }
    descarregar(peso) {
        const pesoNumerico = this._validarPeso(peso); if (pesoNumerico === null) return;
        if (this.cargaAtual >= pesoNumerico) {
            this.cargaAtual -= pesoNumerico;
            exibirNotificacao(`Caminhão descarregado em ${pesoNumerico.toLocaleString('pt-BR')} kg. Carga atual: ${this.cargaAtual.toLocaleString('pt-BR')} kg.`, 'success');
            if (typeof atualizarInfoVeiculoNoModal === 'function') atualizarInfoVeiculoNoModal(this.id);
            salvarGaragem();
        } else {
            exibirNotificacao(`Não pode descarregar ${pesoNumerico.toLocaleString('pt-BR')}kg. Carga atual: ${this.cargaAtual.toLocaleString('pt-BR')}kg.`, 'error');
        }
    }
    getInfoEspecificaHTML() {
        const percentualCarga = this.capacidadeCarga > 0 ? (this.cargaAtual / this.capacidadeCarga) * 100 : 0;
        return `
            <p><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString('pt-BR')} kg</p>
            <p><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString('pt-BR')} kg (${percentualCarga.toFixed(1)}%)</p>
            <progress value="${this.cargaAtual}" max="${this.capacidadeCarga}" style="width: 100%; height: 15px;"></progress>
        `;
    }
    toJSON() { const json = super.toJSON(); json.capacidadeCarga = this.capacidadeCarga; json.cargaAtual = this.cargaAtual; return json; }
}

// --- Gerenciamento da Garagem e LocalStorage (Sem alterações) ---
let garagem = [];
const STORAGE_KEY = 'minhaGaragemInteligente_v2';

function salvarGaragem() {
    try {
        const garagemJSON = JSON.stringify(garagem.map(v => v.toJSON()));
        localStorage.setItem(STORAGE_KEY, garagemJSON);
    } catch (error) {
        console.error("Erro crítico ao salvar garagem:", error);
        exibirNotificacao("ERRO GRAVE: Não foi possível salvar dados da garagem.", 'error', 0);
    }
}

function carregarGaragem() {
    try {
        const garagemJSON = localStorage.getItem(STORAGE_KEY);
        if (garagemJSON) {
            const garagemGenerica = JSON.parse(garagemJSON);
            garagem = garagemGenerica.map(veiculoJSON => Veiculo.fromJSON(veiculoJSON)).filter(v => v !== null);
             if (garagem.length !== garagemGenerica.length) {
                console.warn("Alguns veículos não puderam ser carregados.");
                exibirNotificacao("Aviso: Alguns dados de veículos podem não ter carregado.", 'warning');
             }
        } else { garagem = []; }
    } catch (error) {
        console.error("Erro ao carregar/parsear garagem:", error);
        exibirNotificacao("Erro ao carregar dados da garagem. Iniciando vazia.", 'error');
        garagem = [];
    }
    renderizarGaragem();
    renderizarAgendamentosFuturos();
    if (typeof verificarAgendamentosProximos === 'function') verificarAgendamentosProximos();
}

// --- Funções de Renderização da UI ---

function renderizarGaragem() {
    const listaVeiculosDiv = document.getElementById('listaVeiculos');
    if (!listaVeiculosDiv) return; 
    listaVeiculosDiv.innerHTML = '';
    if (garagem.length === 0) {
        listaVeiculosDiv.innerHTML = '<p style="text-align: center; color: #777;">Garagem vazia. Adicione um veículo!</p>';
        return;
    }
    garagem.sort((a, b) => a.modelo.localeCompare(b.modelo));
    garagem.forEach(veiculo => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('vehicle-item');
        itemDiv.setAttribute('data-id', veiculo.id);
        itemDiv.innerHTML = `
            <span><strong style="color: #2980b9;">${veiculo.modelo}</strong> (${veiculo.tipoVeiculo}) - Cor: ${veiculo.cor}</span>
            <div class="actions">
                <button onclick="abrirModalDetalhes('${veiculo.id}')" title="Ver detalhes, histórico e agendar manutenção"><i class="fas fa-cog"></i> Detalhes / Manutenção</button>
                <button class="warning" onclick="removerVeiculo('${veiculo.id}')" title="Remover veículo permanentemente"><i class="fas fa-trash-alt"></i> Remover</button>
            </div>
        `;
        listaVeiculosDiv.appendChild(itemDiv);
    });
}

function renderizarHistoricoManutencaoModal(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    const historicoDiv = document.getElementById('modalHistoricoManutencao');
    if (!historicoDiv) return; 
    if (!veiculo) {
        console.error("Veículo não encontrado para renderizar histórico:", veiculoId);
        historicoDiv.innerHTML = '<p>Erro: Veículo não encontrado.</p>'; return;
    }
    historicoDiv.innerHTML = veiculo.getHistoricoHTML();
}

function renderizarAgendamentosFuturos() {
    const listaAgendamentosDiv = document.getElementById('listaAgendamentosFuturos');
    if(!listaAgendamentosDiv) return; 
    listaAgendamentosDiv.innerHTML = '';
    const agora = new Date();
    let agendamentos = [];
    garagem.forEach(veiculo => {
        veiculo.historicoManutencao.forEach(manutencao => {
            if (manutencao.data instanceof Date && !isNaN(manutencao.data.getTime()) && manutencao.data > agora) {
                agendamentos.push({ veiculo: veiculo, manutencao: manutencao });
            }
        });
    });
    agendamentos.sort((a, b) => a.manutencao.data - b.manutencao.data);
    if (agendamentos.length === 0) {
        listaAgendamentosDiv.innerHTML = '<p style="text-align: center; color: #777;">Nenhum agendamento futuro.</p>'; return;
    }
    agendamentos.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('schedule-item');
         itemDiv.setAttribute('data-id', item.manutencao.id);
        itemDiv.innerHTML = `
            <span>${item.manutencao.formatar(true, `${item.veiculo.modelo} (${item.veiculo.cor})`)}</span>
            <button class="small-warning" onclick="removerManutencao('${item.veiculo.id}', '${item.manutencao.id}')" title="Cancelar este agendamento"><i class="fas fa-calendar-times"></i> Cancelar</button>
       `;
        listaAgendamentosDiv.appendChild(itemDiv);
    });
}

// --- Funções do Modal e Ações do Veículo ---

const modal = document.getElementById('modalDetalhesVeiculo');
const modalContent = modal ? modal.querySelector('.modal-content') : null; 

function abrirModalDetalhes(veiculoId) {
    if (!modal || !modalContent) return; 

    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) { exibirNotificacao("Erro: Veículo não encontrado.", "error"); return; }

    document.getElementById('modalTituloVeiculo').textContent = `Detalhes: ${veiculo.modelo} (${veiculo.cor})`;
    document.getElementById('manutencaoVeiculoId').value = veiculoId;

    atualizarInfoVeiculoNoModal(veiculoId);
    renderizarHistoricoManutencaoModal(veiculoId);

    const detalhesApiContentDiv = document.getElementById('detalhes-extras-api-content');
    if (detalhesApiContentDiv) { 
        detalhesApiContentDiv.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes extras...</p>';
        buscarEExibirDetalhesAPI(veiculoId);
    }


    const formManutencaoEl = document.getElementById('formManutencao'); // Renomeado para evitar conflito
    if (formManutencaoEl) formManutencaoEl.reset();
    if (typeof flatpickr === 'function') { 
        flatpickr("#manutencaoData", { enableTime: true, dateFormat: "Y-m-d H:i", locale: "pt" });
    }


    modal.style.display = 'block';
    modalContent.classList.add('animate-in');
}

function fecharModal() {
    if (!modal || !modalContent) return;
    modalContent.classList.add('animate-out');
    setTimeout(() => {
        modal.style.display = 'none';
        modalContent.classList.remove('animate-in', 'animate-out');
    }, 300);
}

if (modal) { 
    window.onclick = function(event) { if (event.target == modal) { fecharModal(); } }
    window.addEventListener('keydown', function(event) { if (event.key === 'Escape' && modal.style.display === 'block') { fecharModal(); } });
}


function atualizarInfoVeiculoNoModal(veiculoId) {
    if (!modal || modal.style.display !== 'block' || !document.getElementById('manutencaoVeiculoId') || document.getElementById('manutencaoVeiculoId').value !== veiculoId) { return; }
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;

    const infoDiv = document.getElementById('modalInfoVeiculo');
    const acoesDiv = document.getElementById('modalAcoesVeiculo');
    if(!infoDiv || !acoesDiv) return; 

    infoDiv.innerHTML = veiculo.exibirInformacoesCompletaHTML();
    acoesDiv.innerHTML = '';

    if (!veiculo.ligado) { acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'ligar')"><i class="fas fa-key"></i> Ligar</button>`; }
    else {
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'desligar')"><i class="fas fa-power-off"></i> Desligar</button>`;
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'acelerar', 10)"><i class="fas fa-tachometer-alt"></i> Acelerar (+10)</button>`;
    }
    acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'buzinar')"><i class="fas fa-bullhorn"></i> Buzinar</button>`;

    if (veiculo instanceof CarroEsportivo) {
        if (!veiculo.turbo) { acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'ativarTurbo')"><i class="fas fa-rocket"></i> Ativar Turbo</button>`; }
        else { acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'desativarTurbo')"><i class="fas fa-times-circle"></i> Desativar Turbo</button>`; }
    } else if (veiculo instanceof Caminhao) {
        const cargaContainer = document.createElement('div');
        cargaContainer.style.display = 'flex'; cargaContainer.style.alignItems = 'center'; cargaContainer.style.marginTop = '10px'; cargaContainer.style.gap = '5px';
        cargaContainer.innerHTML = `
            <input type="number" id="pesoCargaModal_${veiculo.id}" placeholder="Peso (kg)" min="1" style="width: 100px; padding: 8px;" title="Peso para carregar/descarregar">
            <button onclick="executarAcaoVeiculo('${veiculo.id}', 'carregar')" title="Carregar caminhão"><i class="fas fa-arrow-up"></i> Carregar</button>
            <button onclick="executarAcaoVeiculo('${veiculo.id}', 'descarregar')" title="Descarregar caminhão"><i class="fas fa-arrow-down"></i> Descarregar</button>
        `;
         acoesDiv.appendChild(cargaContainer);
    }
}

function executarAcaoVeiculo(veiculoId, acao, param = null) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) { exibirNotificacao("Erro: Veículo não encontrado.", "error"); return; }

    if ((acao === 'carregar' || acao === 'descarregar') && veiculo instanceof Caminhao) {
        const inputPeso = document.getElementById(`pesoCargaModal_${veiculo.id}`);
        if (!inputPeso) { console.error("Input peso não encontrado no modal."); return; }
        param = inputPeso.value;
    }

    if (typeof veiculo[acao] === 'function') {
        try { veiculo[acao](param); }
        catch (error) {
             console.error(`Erro ao executar ${acao} em ${veiculo.id}:`, error);
             exibirNotificacao(`Erro ao executar ${acao}: ${error.message}`, 'error');
        }
    } else {
        console.error(`Ação '${acao}' inválida no veículo ${veiculo.id}`);
        exibirNotificacao(`Erro interno: Ação '${acao}' desconhecida.`, 'error');
    }
}

// --- Manipulação de Formulários e Eventos ---
const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
if (formAdicionarVeiculo) {
    formAdicionarVeiculo.addEventListener('submit', function(event) {
        event.preventDefault();
        const tipo = document.getElementById('tipoVeiculo').value;
        const modelo = document.getElementById('modeloVeiculo').value;
        const cor = document.getElementById('corVeiculo').value;
        if (!tipo || !modelo.trim() || !cor.trim()) { exibirNotificacao("Preencha tipo, modelo e cor.", 'warning'); return; }
        let novoVeiculo;
        try {
            switch (tipo) {
                case 'Carro': novoVeiculo = new Carro(modelo, cor); break;
                case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
                case 'Caminhao':
                    const capInput = document.getElementById('capacidadeCargaVeiculo'); const capacidade = capInput.value;
                    if (!capacidade || isNaN(parseFloat(capacidade)) || parseFloat(capacidade) < 0) {
                        exibirNotificacao("Capacidade de carga inválida.", 'error'); capInput.focus(); return;
                    } novoVeiculo = new Caminhao(modelo, cor, capacidade); break;
                default: exibirNotificacao("Tipo inválido.", 'error'); return;
            }
            garagem.push(novoVeiculo); salvarGaragem(); renderizarGaragem();
            exibirNotificacao(`Veículo ${modelo} adicionado!`, 'success');
            formAdicionarVeiculo.reset();
            const campoCapacidade = document.getElementById('campoCapacidadeCarga');
            if (campoCapacidade) campoCapacidade.style.display = 'none';
        } catch (error) { console.error("Erro ao criar/adicionar veículo:", error); exibirNotificacao(`Erro: ${error.message}`, 'error'); }
    });
}

const tipoVeiculoSelect = document.getElementById('tipoVeiculo');
if (tipoVeiculoSelect) {
    tipoVeiculoSelect.addEventListener('change', function() {
        const campoCapacidadeDiv = document.getElementById('campoCapacidadeCarga');
        const capacidadeInput = document.getElementById('capacidadeCargaVeiculo');
        if (!campoCapacidadeDiv || !capacidadeInput) return;

        const show = (this.value === 'Caminhao');
        campoCapacidadeDiv.style.display = show ? 'block' : 'none';
        capacidadeInput.required = show; if (!show) { capacidadeInput.value = ''; }
    });
}

const formManutencaoElEvt = document.getElementById('formManutencao'); // Renomeado para evitar conflito
if (formManutencaoElEvt) {
    formManutencaoElEvt.addEventListener('submit', function(event) {
        event.preventDefault();
        const veiculoId = document.getElementById('manutencaoVeiculoId').value;
        const dataInput = document.getElementById('manutencaoData'); const tipoInput = document.getElementById('manutencaoTipo');
        const custoInput = document.getElementById('manutencaoCusto'); const descInput = document.getElementById('manutencaoDescricao');
        const veiculo = garagem.find(v => v.id === veiculoId);
        if (!veiculo) { exibirNotificacao("Erro: Veículo não encontrado.", 'error'); return; }
        const data = dataInput.value; const tipo = tipoInput.value; const custo = custoInput.value; const descricao = descInput.value;
         if (!data || !tipo.trim() || custo === '' || parseFloat(custo) < 0) { exibirNotificacao("Preencha Data, Tipo e Custo (não negativo).", 'warning'); return; }
        try {
            const novaManutencao = new Manutencao(data, tipo, custo, descricao);
            const adicionado = veiculo.adicionarManutencao(novaManutencao);
            if (adicionado) {
                renderizarHistoricoManutencaoModal(veiculoId); renderizarAgendamentosFuturos(); formManutencaoElEvt.reset();
                const fpInstance = dataInput._flatpickr; if (fpInstance) fpInstance.close();
                if (typeof verificarAgendamentosProximos === 'function') verificarAgendamentosProximos();
            }
        } catch (error) { console.error("Erro no form manutenção:", error); exibirNotificacao(`Erro: ${error.message}`, 'error'); }
    });
}


function removerVeiculo(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId); if (!veiculo) { exibirNotificacao("Erro: Veículo não encontrado.", "error"); return; }
    if (confirm(`ATENÇÃO!\nDeseja remover PERMANENTEMENTE "${veiculo.modelo} (${veiculo.cor})"?\n\nHistórico será perdido.`)) {
        garagem = garagem.filter(v => v.id !== veiculoId); salvarGaragem(); renderizarGaragem(); renderizarAgendamentosFuturos();
        exibirNotificacao(`Veículo ${veiculo.modelo} removido.`, 'success');
        if (modal && modal.style.display === 'block' && document.getElementById('manutencaoVeiculoId') && document.getElementById('manutencaoVeiculoId').value === veiculoId) { fecharModal(); }
    }
}

function removerManutencao(veiculoId, manutencaoId) {
    const veiculo = garagem.find(v => v.id === veiculoId); if (!veiculo) { exibirNotificacao("Erro: Veículo não encontrado.", "error"); return; }
     const manutencao = veiculo.historicoManutencao.find(m => m.id === manutencaoId); if (!manutencao) { exibirNotificacao("Erro: Registro não encontrado.", "error"); return; }
    if (confirm(`Remover registro:\n"${manutencao.tipo}" em ${manutencao.data.toLocaleDateString()}?`)) {
        const removido = veiculo.removerManutencaoPorId(manutencaoId);
        if (removido) {
            exibirNotificacao('Manutenção/Agendamento removido.', 'success');
             if (modal && modal.style.display === 'block' && document.getElementById('manutencaoVeiculoId') && document.getElementById('manutencaoVeiculoId').value === veiculoId) { renderizarHistoricoManutencaoModal(veiculoId); }
            renderizarAgendamentosFuturos(); 
            if (typeof verificarAgendamentosProximos === 'function') verificarAgendamentosProximos();
        } else { exibirNotificacao('Não foi possível remover.', 'error'); }
    }
}

// --- Notificações e Lembretes ---
let notificationTimeout;
function exibirNotificacao(mensagem, tipo = 'info', duracaoMs = 5000) {
    const notificacaoDiv = document.getElementById('notificacoes'); if (!notificacaoDiv) return;
    notificacaoDiv.textContent = mensagem; notificacaoDiv.className = '';
    notificacaoDiv.classList.add(tipo); notificacaoDiv.classList.add('show');
    clearTimeout(notificationTimeout);
    if (duracaoMs > 0) {
        notificationTimeout = setTimeout(() => { notificacaoDiv.classList.remove('show'); }, duracaoMs);
    }
}

function verificarAgendamentosProximos() {
    const agora = new Date(); const amanha = new Date(agora); amanha.setDate(agora.getDate() + 1);
    const limite = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000); // Próximos 2 dias
    let lembretes = [];
    garagem.forEach(veiculo => {
        veiculo.historicoManutencao.forEach(m => {
            if (m.data instanceof Date && !isNaN(m.data.getTime()) && m.data > agora && m.data < limite) {
                const dataM = m.data; let quando = ''; const hora = dataM.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                 const hojeStr = agora.toDateString(); const amanhaStr = amanha.toDateString(); const dataMStr = dataM.toDateString();
                if (dataMStr === hojeStr) { quando = `HOJE às ${hora}`; }
                else if (dataMStr === amanhaStr) { quando = `AMANHÃ às ${hora}`; }
                else { quando = `em ${dataM.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} às ${hora}`; }
                lembretes.push(`🔔 LEMBRETE: ${m.tipo} (${veiculo.modelo}) ${quando}.`);
            }
        });
    });
    if (lembretes.length > 0) { exibirNotificacao(lembretes.join('\n'), 'warning', 10000); }
}

// ======================================================
// == INÍCIO PARTE 1: API SIMULADA - Detalhes Veículo ==
// ======================================================

/**
 * Busca detalhes extras de um veículo na API simulada (JSON local).
 * @async
 * @param {string} identificadorVeiculo - O ID único do veículo a ser buscado.
 * @returns {Promise<object|null>} Uma promessa que resolve com o objeto de dados do veículo ou null se não encontrado/erro.
 */
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    const url = './dados_veiculos_api.json'; 
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados da API simulada: ${response.status} ${response.statusText}`);
        }
        const dadosVeiculos = await response.json();
        // O arquivo dados.json fornecido não usa "id", mas "id". Ajuste aqui se o nome do arquivo for 'dados.json' e o campo ID for outro
        const detalhes = dadosVeiculos.find(veiculo => veiculo.id === identificadorVeiculo); 
        return detalhes || null;

    } catch (error) {
        console.error("Falha ao buscar ou processar API simulada:", error);
        return null;
    }
}

/**
 * Função auxiliar para formatar e exibir os detalhes da API no modal.
 * @param {string} veiculoId - O ID do veículo cujos detalhes devem ser exibidos.
 */
async function buscarEExibirDetalhesAPI(veiculoId) {
    const detalhesApiContentDiv = document.getElementById('detalhes-extras-api-content');
    if(!detalhesApiContentDiv) return; 

    detalhesApiContentDiv.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes extras...</p>';

    try {
        const detalhes = await buscarDetalhesVeiculoAPI(veiculoId);

        if (detalhes) {
            detalhesApiContentDiv.innerHTML = `
                <h4><i class="fas fa-database"></i> Dados da API Simulada:</h4>
                <p><strong>Valor FIPE (Simulado):</strong> ${detalhes.valorFipe || 'N/A'}</p>
                <p><strong>Recall Pendente:</strong> ${detalhes.recallPendente ? `<span style="color:red; font-weight:bold;">Sim</span>` : 'Não'}</p>
                ${detalhes.recallPendente ? `<p><strong>Informação Recall:</strong> ${detalhes.recallInfo || 'N/A'}</p>` : ''}
                <p><strong>Próxima Revisão (km):</strong> ${detalhes.proximaRevisaoKm ? detalhes.proximaRevisaoKm.toLocaleString('pt-BR') : 'N/A'}</p>
                <p><strong>Dica de Manutenção:</strong> ${detalhes.dicaManutencao || 'N/A'}</p>
            `;
        } else {
            detalhesApiContentDiv.innerHTML = '<p class="error"><i class="fas fa-exclamation-circle"></i> Detalhes extras não encontrados para este veículo.</p>';
        }
    } catch (error) {
        console.error("Erro ao exibir detalhes da API:", error);
        detalhesApiContentDiv.innerHTML = `<p class="error"><i class="fas fa-times-circle"></i> Erro ao carregar detalhes extras: ${error.message}</p>`;
    }
}

// ======================================================
// == FIM PARTE 1 =======================================
// ======================================================


// ======================================================================================
// == INÍCIO ATIVIDADE B2.P1.A5: A Ponte para o Backend ================================
// == Modificações na busca da previsão do tempo para usar o backend como proxy. ========
// ======================================================================================

// A constante OPENWEATHER_API_KEY que estava aqui foi REMOVIDA.
// A chave agora está segura no backend (server.js, carregada do .env).

// Estado da previsão e filtros (sem alteração aqui)
let ultimaPrevisaoCompletaProcessada = null;
let nomeCidadeAtualPrevisao = "";
let filtroDiasAtivo = 5;
const TEMPERATURA_BAIXA_LIMITE = 10;
const TEMPERATURA_ALTA_LIMITE = 30;

let configDestaque = {
    chuva: false,
    tempBaixa: false,
    tempAlta: false
};

/**
 * Faz a chamada ao NOSSO BACKEND para buscar a previsão detalhada.
 * O backend, por sua vez, chamará a API OpenWeatherMap.
 * @async
 * @param {string} cidade - O nome da cidade para buscar a previsão.
 * @returns {Promise<object>} Uma promessa que resolve com o objeto de dados completo da API OpenWeatherMap (repassado pelo nosso backend).
 * @throws {Error} Lança um erro se ocorrer um erro na chamada ao nosso backend ou se o backend retornar um erro.
 */
async function fetchPrevisaoDaAPI(cidade) {
    // A URL agora aponta para o seu servidor backend
    // ATENÇÃO à porta! Deve ser a porta do seu server.js (ex: 3001)
    // const backendUrl = `http://localhost:3001/api/previsao/${encodeURIComponent(cidade)}`; // <-- ANTES (B2.P1.A5)
    //const backendUrl = `https://garagem-backend-aluno.onrender.com/api/previsao/${encodeURIComponent(cidade)}`; // <-- DEPOIS (B2.P1.A6)
    const backendUrl = `http://localhost:3001/api/previsao/${encodeURIComponent(cidade)}`; // <-- DEPOIS (B2.P1.A6)
    
    console.log(`[Frontend] Chamando backend em: ${backendUrl}`);

    try {
        const response = await fetch(backendUrl);
        
        // Tenta pegar a mensagem de erro do JSON, mesmo se !response.ok
        const data = await response.json().catch(() => ({})); 

        if (!response.ok) {
            // data.error é a mensagem que nosso backend envia no JSON de erro
            const erroMsg = data.error || `Erro ${response.status} ao buscar previsão no servidor.`;
            console.error(`[Frontend] Erro do backend: ${response.status} - ${erroMsg}`, data);
            throw new Error(erroMsg);
        }
        
        // Verifica se a estrutura dos dados recebidos do backend é a esperada (igual à da OpenWeatherMap)
        if (false && data.cod !== "200" || !data.list || !Array.isArray(data.list)) {
             console.error("[Frontend] Resposta do backend bem-sucedida, mas dados da OpenWeatherMap parecem inválidos ou incompletos:", data);
             let erroEstrutura = `Resposta do backend recebida, mas os dados da previsão parecem incompletos.`;
             if (data.message) erroEstrutura += ` Mensagem da API (via backend): ${data.message}`;
             else if (data.cod && data.cod !== "200") erroEstrutura += ` A API (via backend) retornou um código de erro: ${data.cod}.`;
             else if (!data.list) erroEstrutura += ` A lista de previsões ('list') não foi encontrada na resposta.`;

             throw new Error(erroEstrutura);
        }
        console.log("[Frontend] Dados da previsão recebidos do backend:", data);
        return data; // Retorna os dados da OpenWeatherMap repassados pelo backend

    } catch (error) {
        // Erros podem ser de rede (fetch falhou) ou o 'throw new Error' de cima.
        console.error("[Frontend] Falha ao buscar previsão via backend:", error.message);
        // Re-lança o erro para ser pego pelo event listener do botão
        throw error; 
    }
}

/**
 * Processa os dados brutos da API de forecast (5 dias / 3 horas) e os agrupa por dia.
 * (Esta função permanece a mesma, pois ela processa os dados *da OpenWeatherMap*,
 * que nosso backend agora está apenas repassando).
 * @param {object} dataApi - O objeto JSON completo retornado pela API OpenWeatherMap Forecast.
 * @returns {Array<object>|null} Um array de objetos com a previsão processada para cada dia.
 */
function processarDadosForecast(dataApi) {
    if (!dataApi || !dataApi.list) {
        console.warn("processarDadosForecast: Chamado com 'dataApi' inválido ou sem 'dataApi.list'.");
        return null;
    }
    if (dataApi.list.length === 0) {
        console.warn("processarDadosForecast: 'dataApi.list' está vazio.", dataApi);
        return [];
    }

    const previsoesAgrupadas = {};
    dataApi.list.forEach((item, index) => {
        if (!item || typeof item.dt_txt !== 'string' || !item.main || typeof item.main.temp !== 'number' || !item.weather || !Array.isArray(item.weather) || item.weather.length === 0 || !item.weather[0] || typeof item.weather[0].description !== 'string' || typeof item.weather[0].icon !== 'string') {
            console.warn(`processarDadosForecast: Item inválido ou com dados faltantes no índice ${index} da lista. Pulando item.`, item);
            return;
        }
        const dataDia = item.dt_txt.split(' ')[0];
        if (!previsoesAgrupadas[dataDia]) {
            previsoesAgrupadas[dataDia] = { dataISO: dataDia, entradas: [], temps: [], descricoesChuva: [] };
        }
        previsoesAgrupadas[dataDia].entradas.push(item);
        previsoesAgrupadas[dataDia].temps.push(item.main.temp);
        const descricaoLowerCase = item.weather[0].description.toLowerCase();
        if (descricaoLowerCase.includes('chuva') || descricaoLowerCase.includes('rain') || descricaoLowerCase.includes('drizzle') || descricaoLowerCase.includes('shower')) {
            previsoesAgrupadas[dataDia].descricoesChuva.push(item.weather[0].description);
        }
    });

    const previsaoDiariaProcessada = [];
    for (const diaISO in previsoesAgrupadas) {
        const diaData = previsoesAgrupadas[diaISO];
        if (!diaData.temps || diaData.temps.length === 0) continue;
        const temp_min = Math.min(...diaData.temps);
        const temp_max = Math.max(...diaData.temps);
        let entradaRepresentativa = (diaData.entradas && diaData.entradas.length > 0) ? (diaData.entradas.find(e => e.dt_txt.includes("12:00:00")) || diaData.entradas.find(e => e.dt_txt.includes("15:00:00")) || diaData.entradas[Math.floor(diaData.entradas.length / 2)]) : null;
        if (!entradaRepresentativa || !entradaRepresentativa.weather || !entradaRepresentativa.weather[0]) continue;
        const [year, month, day] = diaISO.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) continue;
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        previsaoDiariaProcessada.push({
            dataISO: diaISO,
            dataFormatada: dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
            temp_min: parseFloat(temp_min.toFixed(1)),
            temp_max: parseFloat(temp_max.toFixed(1)),
            descricao: entradaRepresentativa.weather[0].description,
            icone: entradaRepresentativa.weather[0].icon,
            temChuva: diaData.descricoesChuva.length > 0
        });
    }
    if (Object.keys(previsoesAgrupadas).length > 0 && previsaoDiariaProcessada.length === 0 && dataApi.list.length > 0) {
        console.warn("processarDadosForecast: Nenhum dia pôde ser completamente processado.", { apiListCount: dataApi.list.length, agrupados: previsoesAgrupadas });
    }
    return previsaoDiariaProcessada.slice(0, 5);
}


/**
 * Exibe a previsão do tempo detalhada na UI.
 * (Esta função permanece a mesma).
 * @param {Array<object>} previsaoDiariaFiltrada - Array de objetos com a previsão já filtrada por dias.
 * @param {string} nomeCidade - O nome da cidade para exibição no título.
 * @param {object} destaquesAtivos - Configuração dos destaques {chuva: boolean, tempBaixa: boolean, tempAlta: boolean}.
 */
function exibirPrevisaoNaTela(previsaoDiariaFiltrada, nomeCidade, destaquesAtivos) { 
    const resultadoClimaDiv = document.getElementById('previsao-tempo-resultado');
    const controlsDiv = document.getElementById('forecast-interaction-controls');
    if (!resultadoClimaDiv || !controlsDiv) {
        console.error("Elementos de UI para previsão não encontrados (previsao-tempo-resultado ou forecast-interaction-controls).");
        return;
    }
    
    resultadoClimaDiv.innerHTML = ''; 

    if (!previsaoDiariaFiltrada || previsaoDiariaFiltrada.length === 0) {
        resultadoClimaDiv.innerHTML = `<p class="feedback-clima error"><i class="fas fa-exclamation-triangle"></i> Não há previsão para exibir com os filtros atuais para ${nomeCidade}.</p>`;
        resultadoClimaDiv.style.display = 'block';
        controlsDiv.style.display = ultimaPrevisaoCompletaProcessada ? 'flex' : 'none';
        return;
    }

    controlsDiv.style.display = 'flex';

    const titulo = document.createElement('h4');
    titulo.innerHTML = `<i class="fas fa-calendar-alt"></i> Previsão para ${nomeCidade}`;
    resultadoClimaDiv.appendChild(titulo);

    const containerDias = document.createElement('div');
    containerDias.classList.add('forecast-container');

    previsaoDiariaFiltrada.forEach(dia => {
        const diaCard = document.createElement('div');
        diaCard.classList.add('forecast-day-card');

        if (destaquesAtivos.chuva && dia.temChuva) diaCard.classList.add('highlight-chuva');
        if (destaquesAtivos.tempBaixa && dia.temp_min < TEMPERATURA_BAIXA_LIMITE) diaCard.classList.add('highlight-temp-baixa');
        if (destaquesAtivos.tempAlta && dia.temp_max > TEMPERATURA_ALTA_LIMITE) diaCard.classList.add('highlight-temp-alta');

        const descricaoFormatada = dia.descricao.charAt(0).toUpperCase() + dia.descricao.slice(1);
        diaCard.innerHTML = `
            <p class="forecast-date"><strong>${dia.dataFormatada}</strong></p>
            <img src="https://openweathermap.org/img/wn/${dia.icone}@2x.png" alt="${descricaoFormatada}" class="weather-icon-forecast">
            <p class="forecast-description">${descricaoFormatada}</p>
            <p class="forecast-temp">
                <i class="fas fa-temperature-low"></i> ${dia.temp_min}°C | 
                <i class="fas fa-temperature-high"></i> ${dia.temp_max}°C
            </p>
        `;
        containerDias.appendChild(diaCard);
    });

    resultadoClimaDiv.appendChild(containerDias);
    resultadoClimaDiv.style.display = 'block';
}

/**
 * Orquestra a re-renderização da previsão com base nos filtros e destaques atuais.
 * (Esta função permanece a mesma).
 */
function renderizarPrevisaoComFiltrosAplicados() {
    const resultadoClimaDiv = document.getElementById('previsao-tempo-resultado');
    const controlsDiv = document.getElementById('forecast-interaction-controls');

    if (!ultimaPrevisaoCompletaProcessada) {
        if (resultadoClimaDiv) {
            resultadoClimaDiv.innerHTML = `<p class="feedback-clima info"><i class="fas fa-info-circle"></i> Busque por uma cidade para ver a previsão.</p>`;
            resultadoClimaDiv.style.display = 'block';
        }
        if (controlsDiv) controlsDiv.style.display = 'none';
        return;
    }

    let previsaoFiltrada = [...ultimaPrevisaoCompletaProcessada]; 

    if (filtroDiasAtivo === 1) previsaoFiltrada = previsaoFiltrada.slice(0, 1);
    else if (filtroDiasAtivo === 3) previsaoFiltrada = previsaoFiltrada.slice(0, 3);
    
    exibirPrevisaoNaTela(previsaoFiltrada, nomeCidadeAtualPrevisao, configDestaque);
}


// Event Listener para o botão de verificar clima
// (A lógica interna do try/catch será a mesma, mas agora `fetchPrevisaoDaAPI` chama o backend)
const btnVerificarClima = document.getElementById('verificar-clima-btn');
const inputDestino = document.getElementById('destino-viagem');
const resultadoClimaDivEl = document.getElementById('previsao-tempo-resultado');
const forecastControlsDiv = document.getElementById('forecast-interaction-controls');

if (btnVerificarClima && inputDestino && resultadoClimaDivEl) {
    btnVerificarClima.addEventListener('click', async () => {
        const cidade = inputDestino.value.trim();
        nomeCidadeAtualPrevisao = ""; 
        ultimaPrevisaoCompletaProcessada = null;
        
        if (forecastControlsDiv) forecastControlsDiv.style.display = 'none';


        if (!cidade) {
            exibirNotificacao("Por favor, digite o nome da cidade de destino.", 'warning');
            resultadoClimaDivEl.style.display = 'block';
            resultadoClimaDivEl.innerHTML = `<p class="feedback-clima error"><i class="fas fa-exclamation-triangle"></i> Digite uma cidade.</p>`;
            inputDestino.focus();
            return;
        }

        resultadoClimaDivEl.style.display = 'block';
        resultadoClimaDivEl.innerHTML = `<p class="feedback-clima loading"><i class="fas fa-spinner fa-spin"></i> Buscando previsão detalhada para ${cidade}...</p>`;

        try {
            // AGORA CHAMA A FUNÇÃO MODIFICADA QUE USA O BACKEND
            const dadosApiCompletos = await fetchPrevisaoDaAPI(cidade); 
            
            nomeCidadeAtualPrevisao = (dadosApiCompletos.city && dadosApiCompletos.city.name) ? dadosApiCompletos.city.name : cidade;
            
            ultimaPrevisaoCompletaProcessada = processarDadosForecast(dadosApiCompletos);
            
            if (ultimaPrevisaoCompletaProcessada && ultimaPrevisaoCompletaProcessada.length > 0) {
                renderizarPrevisaoComFiltrosAplicados(); 
            } else {
                let msgErroProcessamento = `Não foi possível processar os dados da previsão para ${nomeCidadeAtualPrevisao}.`;
                if (dadosApiCompletos && dadosApiCompletos.list && dadosApiCompletos.list.length === 0) {
                    msgErroProcessamento += ` A API (via backend) retornou uma lista de previsões vazia.`;
                } else {
                    msgErroProcessamento += ` Verifique o console para mais detalhes sobre o processamento.`;
                }
                console.log("[Frontend] Dados completos recebidos do backend que podem ter causado falha no processamento:", dadosApiCompletos);
                resultadoClimaDivEl.innerHTML = `<p class="feedback-clima error"><i class="fas fa-info-circle"></i> ${msgErroProcessamento}</p>`;
            }
        } catch (error) {
            // O erro já foi logado em fetchPrevisaoDaAPI, aqui apenas exibimos na UI.
            console.error("[Frontend] Erro final ao buscar/exibir previsão detalhada (via backend):", error);
            resultadoClimaDivEl.innerHTML = `<p class="feedback-clima error"><i class="fas fa-times-circle"></i> Falha: ${error.message}</p>`;
        }
    });
}

// Event Listeners para os controles de filtro e destaque (permanecem os mesmos)
const diasFilterOptions = document.getElementById('dias-filter-options');
if (diasFilterOptions) {
    diasFilterOptions.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            diasFilterOptions.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            filtroDiasAtivo = parseInt(event.target.dataset.dias);
            renderizarPrevisaoComFiltrosAplicados();
        }
    });
}

const highlightFilterOptions = document.getElementById('highlight-filter-options');
if (highlightFilterOptions) {
    highlightFilterOptions.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const tipoDestaque = event.target.dataset.tipo;
            if (tipoDestaque === 'chuva') configDestaque.chuva = event.target.checked;
            else if (tipoDestaque === 'temp_baixa') configDestaque.tempBaixa = event.target.checked;
            else if (tipoDestaque === 'temp_alta') configDestaque.tempAlta = event.target.checked;
            renderizarPrevisaoComFiltrosAplicados();
        }
    });
}
// ======================================================================================
// == FIM ATIVIDADE B2.P1.A5 ===========================================================
// ======================================================================================


// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof flatpickr === 'function' && flatpickr.l10ns && flatpickr.l10ns.pt) {
        flatpickr.localize(flatpickr.l10ns.pt);
    } else { console.warn("Flatpickr ou localização 'pt' não encontrados."); }
    
    carregarGaragem(); 

    const tipoVeiculoSelectInit = document.getElementById('tipoVeiculo');
    if (tipoVeiculoSelectInit && tipoVeiculoSelectInit.value === 'Caminhao') {
        const campoCargaInit = document.getElementById('campoCapacidadeCarga');
        const inputCargaInit = document.getElementById('capacidadeCargaVeiculo');
        if (campoCargaInit) campoCargaInit.style.display = 'block';
        if (inputCargaInit) inputCargaInit.required = true;
    }
    
    const initialForecastControls = document.getElementById('forecast-interaction-controls');
    if(initialForecastControls) initialForecastControls.style.display = 'none';

    console.log("Garagem Inteligente Conectada inicializada. Frontend consumindo backend na nuvem.");
});