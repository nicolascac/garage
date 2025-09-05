




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

// --- Classes de Veículos (Sem alterações) ---
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

// --- Gerenciamento da Garagem e LocalStorage ---
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

// --- NOVO CÓDIGO para a função carregarGaragem ---
async function carregarGaragem() {
    const listaVeiculosDiv = document.getElementById('listaVeiculos');
    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos`);
        if (!response.ok) {
            throw new Error('Não foi possível carregar os veículos do servidor.');
        }
        const veiculosDoBackend = await response.json();
        // A variável 'garagem' agora será um cache dos dados do backend
        garagem = veiculosDoBackend; 
        renderizarGaragem();
        // A função de agendamentos futuros precisará ser adaptada depois, se necessário
        // renderizarAgendamentosFuturos(); 
    } catch (error) {
        console.error("Erro ao carregar garagem:", error);
        exibirNotificacao(error.message, 'error');
        if (listaVeiculosDiv) {
            listaVeiculosDiv.innerHTML = `<p class="error">Falha ao carregar veículos. Verifique a conexão com o servidor.</p>`;
        }
    }
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
        itemDiv.setAttribute('data-id', veiculo._id); // Importante: usar _id
itemDiv.innerHTML = `
    <span><strong style="color: #2980b9;">${veiculo.modelo}</strong> (${veiculo.tipoVeiculo}) - Cor: ${veiculo.cor}</span>
    <div class="actions">
        <button onclick="abrirModalEdicao('${veiculo._id}')" title="Editar Veículo"><i class="fas fa-edit"></i> Editar</button>
        <button class="warning" onclick="removerVeiculo('${veiculo._id}')" title="Remover veículo permanentemente"><i class="fas fa-trash-alt"></i> Remover</button>
    </div>
`;``
        listaVeiculosDiv.appendChild(itemDiv);
    });
}

function renderizarHistoricoManutencaoModal(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    const historicoDiv = document.getElementById('modalHistoricoManutencao');
    if (!historicoDiv || !veiculo) return; 
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

// --- ADICIONE ESTAS DUAS NOVAS FUNÇÕES ---

/**
 * Abre o modal preenchido com um formulário para editar o veículo.
 */
function abrirModalEdicao(veiculoId) {
    const veiculo = garagem.find(v => v._id === veiculoId);
    if (!veiculo) {
        exibirNotificacao("Veículo não encontrado para edição.", "error");
        return;
    }

    const modal = document.getElementById('modalDetalhesVeiculo');
    const modalContent = modal.querySelector('.modal-content');
    
    // Limpa conteúdo anterior e cria o formulário de edição dinamicamente
    modalContent.innerHTML = `
        <span class="close-button" onclick="fecharModal()">×</span>
        <h2 id="modalTituloVeiculo">Editar Veículo: ${veiculo.modelo}</h2>
        <div class="form-section">
            <form id="formEditarVeiculo">
                <label for="editModeloVeiculo">Modelo:</label>
                <input type="text" id="editModeloVeiculo" value="${veiculo.modelo}" required>
                
                <label for="editCorVeiculo">Cor:</label>
                <input type="text" id="editCorVeiculo" value="${veiculo.cor}" required>
                
                ${veiculo.tipoVeiculo === 'Caminhao' ? `
                <div id="editCampoCapacidadeCarga">
                    <label for="editCapacidadeCargaVeiculo">Capacidade de Carga (kg):</label>
                    <input type="number" id="editCapacidadeCargaVeiculo" value="${veiculo.capacidadeCarga || 0}" min="0">
                </div>
                ` : ''}

                <button type="submit"><i class="fas fa-save"></i> Salvar Alterações</button>
            </form>
        </div>
    `;

    modal.style.display = 'block';
    
    // Adiciona o event listener para o formulário que acabamos de criar
    document.getElementById('formEditarVeiculo').addEventListener('submit', (e) => handleEditarVeiculo(e, veiculoId));
}

/**
 * Lida com a submissão do formulário de edição de um veículo.
 */
async function handleEditarVeiculo(event, veiculoId) {
    event.preventDefault();
    
    const veiculoOriginal = garagem.find(v => v._id === veiculoId);
    if(!veiculoOriginal) return;

    // Coleta os dados do formulário de edição
    const dadosAtualizados = {
        modelo: document.getElementById('editModeloVeiculo').value,
        cor: document.getElementById('editCorVeiculo').value,
        ...(veiculoOriginal.tipoVeiculo === 'Caminhao' && { 
            capacidadeCarga: parseFloat(document.getElementById('editCapacidadeCargaVeiculo').value) || 0 
        })
    };

    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos/${veiculoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Erro ao atualizar veículo.');
        }

        exibirNotificacao('Veículo atualizado com sucesso!', 'success');
        fecharModal();
        carregarGaragem(); // Recarrega a lista para mostrar os dados atualizados
    } catch (error) {
        exibirNotificacao(error.message, 'error');
    }
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
    formAdicionarVeiculo.addEventListener('submit',async function(event) {
        event.preventDefault();
        const tipo = document.getElementById('tipoVeiculo').value;
        const modelo = document.getElementById('modeloVeiculo').value;
        const cor = document.getElementById('corVeiculo').value;
        if (!tipo || !modelo.trim() || !cor.trim()) { exibirNotificacao("Preencha tipo, modelo e cor.", 'warning'); return; }
        let novoVeiculo;
       try {
    const novoVeiculoData = {
        tipoVeiculo: tipo,
        modelo: modelo,
        cor: cor,
    };
    // Adiciona capacidade de carga apenas se for um caminhão
    if (tipo === 'Caminhao') {
        const capacidade = document.getElementById('capacidadeCargaVeiculo').value;
        if (!capacidade || parseFloat(capacidade) < 0) {
             exibirNotificacao("Capacidade de carga inválida.", 'error');
             return;
        }
        novoVeiculoData.capacidadeCarga = parseFloat(capacidade);
    }

    const response = await fetch(`${backendUrl}/api/garagem/veiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoVeiculoData)
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao adicionar veículo.');
    }

    exibirNotificacao(`Veículo ${modelo} adicionado com sucesso!`, 'success');
    formAdicionarVeiculo.reset();
    document.getElementById('campoCapacidadeCarga').style.display = 'none';
    carregarGaragem(); // Recarrega a lista da garagem para mostrar o novo item
    
} catch (error) {
    console.error("Erro ao adicionar veículo:", error);
    exibirNotificacao(error.message, 'error');
}
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

const formManutencaoElEvt = document.getElementById('formManutencao');
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

// script.js (Cole esta nova versão da função no lugar da antiga)

/**
 * Envia uma requisição DELETE ao servidor para remover um veículo permanentemente.
 * @param {string} veiculoId O ID do veículo a ser removido (vem do MongoDB).
 */
async function removerVeiculo(veiculoId) {
    // Encontra o veículo na lista local para usar o nome na mensagem de confirmação
    const veiculo = garagem.find(v => v._id === veiculoId);
    if (!veiculo) {
        exibirNotificacao("Erro: Veículo não encontrado na lista local.", "error");
        return;
    }

    // Pede confirmação ao usuário antes de uma ação destrutiva
    if (confirm(`ATENÇÃO!\nDeseja remover PERMANENTEMENTE "${veiculo.modelo} (${veiculo.cor})"?\n\nEsta ação não pode ser desfeita.`)) {
        try {
            // Envia a requisição DELETE para o endpoint correto no servidor
            const response = await fetch(`${backendUrl}/api/garagem/veiculos/${veiculoId}`, {
                method: 'DELETE'
            });

            const data = await response.json(); // Pega a resposta do servidor (ex: { message: "..." })

            // Se a resposta do servidor não for "OK" (status 200-299), lança um erro
            if (!response.ok) {
                throw new Error(data.error || 'Erro desconhecido ao deletar o veículo.');
            }

            // Se tudo deu certo:
            exibirNotificacao(data.message || 'Veículo removido com sucesso!', 'success');
            
            // Recarrega a lista da garagem para que a UI reflita a remoção
            carregarGaragem();

        } catch (error) {
            // Captura qualquer erro (de rede ou do servidor) e exibe uma notificação
            console.error("Erro ao remover veículo:", error);
            exibirNotificacao(error.message, 'error');
        }
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
    const limite = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000);
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
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    const url = './dados_veiculos_api.json'; 
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados da API simulada: ${response.status} ${response.statusText}`);
        }
        const dadosVeiculos = await response.json();
        const detalhes = dadosVeiculos.find(veiculo => veiculo.id === identificadorVeiculo); 
        return detalhes || null;
    } catch (error) {
        console.error("Falha ao buscar ou processar API simulada:", error);
        return null;
    }
}

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
// == INÍCIO SEÇÃO DA API - CORRIGIDA ===================================================
// ======================================================================================

// *** PASSO 1: DEFINA A URL BASE DO SEU BACKEND AQUI EM CIMA ***
// Use a URL do Render quando o backend estiver na nuvem.
const backendUrl = "https://garage-2dux.onrender.com";
//const backendUrl = "http://localhost:3001";



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
 */
async function fetchPrevisaoDaAPI(cidade) {
    // *** CONSTRÓI A URL COMPLETA USANDO A CONSTANTE E O CAMINHO CORRETO ***
    const urlCompleta = `${backendUrl}/api/previsao/${encodeURIComponent(cidade)}`;
    
    console.log(`[Frontend] Chamando backend em: ${urlCompleta}`);

    try {
        const response = await fetch(urlCompleta);
        const data = await response.json().catch(() => ({})); 


        console.log (data);

        if (!response.ok) {
            const erroMsg = data.error || `Erro ${response.status} do servidor.`;
            throw new Error(erroMsg);
        }
        
        // Validação robusta da resposta
        if (!data || !data.list || !Array.isArray(data.list)) {
             console.error("[Frontend] Resposta inválida do backend:", data);
             throw new Error("Dados da previsão recebidos estão incompletos.");
        }
        
        return data; // Retorna os dados corretos
    } catch (error) {
        console.error("[Frontend] Falha na comunicação com o backend:", error);
        throw error; 
    }
}

// ... o resto das funções de previsão (processarDadosForecast, exibirPrevisaoNaTela, etc.) permanecem iguais ...

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
    return previsaoDiariaProcessada.slice(0, 5);
}

function exibirPrevisaoNaTela(previsaoDiariaFiltrada, nomeCidade, destaquesAtivos) { 
    const resultadoClimaDiv = document.getElementById('previsao-tempo-resultado');
    const controlsDiv = document.getElementById('forecast-interaction-controls');
    if (!resultadoClimaDiv || !controlsDiv) {
        console.error("Elementos de UI para previsão não encontrados.");
        return;
    }
    resultadoClimaDiv.innerHTML = ''; 
    if (!previsaoDiariaFiltrada || previsaoDiariaFiltrada.length === 0) {
        resultadoClimaDiv.innerHTML = `<p class="feedback-clima error"><i class="fas fa-exclamation-triangle"></i> Não há previsão para exibir para ${nomeCidade}.</p>`;
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

function renderizarPrevisaoComFiltrosAplicados() {
    const resultadoClimaDiv = document.getElementById('previsao-tempo-resultado');
    const controlsDiv = document.getElementById('forecast-interaction-controls');
    if (!ultimaPrevisaoCompletaProcessada) {
        if (resultadoClimaDiv) {
            resultadoClimaDiv.innerHTML = `<p class="feedback-clima info"><i class="fas fa-info-circle"></i> Busque por uma cidade.</p>`;
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

// ======================================================================================
// == INÍCIO ATIVIDADE B2.P1.A8: Backend Turbinado ======================================
// ======================================================================================
async function buscarDicasGerais() {
    const resultadoDiv = document.getElementById('dicas-gerais-resultado');
    resultadoDiv.style.display = 'block';
    resultadoDiv.innerHTML = `<p class="loading"><i class="fas fa-spinner fa-spin"></i> Buscando dicas gerais...</p>`;
    try {
        const response = await fetch(`${backendUrl}/api/dicas-manutencao`);
        if (!response.ok) throw new Error('Erro ao buscar dicas gerais do servidor.');
        const dicas = await response.json();
        exibirDicas(dicas, resultadoDiv, "Dicas de Manutenção Gerais");
    } catch (error) {
        console.error("Erro em buscarDicasGerais:", error);
        resultadoDiv.innerHTML = `<p class="error"><i class="fas fa-times-circle"></i> Falha ao carregar dicas: ${error.message}</p>`;
    }
}

async function buscarDicasEspecificas(tipoVeiculo) {
    const resultadoDiv = document.getElementById('dicas-especificas-resultado');
    resultadoDiv.style.display = 'block';
    resultadoDiv.innerHTML = `<p class="loading"><i class="fas fa-spinner fa-spin"></i> Buscando dicas para ${tipoVeiculo}...</p>`;
    try {
        const response = await fetch(`${backendUrl}/api/dicas-manutencao/${encodeURIComponent(tipoVeiculo)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Erro ${response.status} ao buscar dicas.`);
        exibirDicas(data, resultadoDiv, `Dicas Específicas para ${tipoVeiculo}`);
    } catch (error) {
        console.error("Erro em buscarDicasEspecificas:", error);
        resultadoDiv.innerHTML = `<p class="error"><i class="fas fa-times-circle"></i> Falha: ${error.message}</p>`;
    }
}

function exibirDicas(dicas, container, titulo) {
    if (!dicas || dicas.length === 0) {
        container.innerHTML = `<p class="error">Nenhuma dica encontrada.</p>`;
        return;
    }
    const listaHtml = dicas.map(item => `<li>${item.dica}</li>`).join('');
    container.innerHTML = `<h4>${titulo}</h4><ul>${listaHtml}</ul>`;
}

// ======================================================
// == INICIALIZAÇÃO E EVENT LISTENERS ===================
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof flatpickr === 'function' && flatpickr.l10ns && flatpickr.l10ns.pt) {
        flatpickr.localize(flatpickr.l10ns.pt);
    } else { console.warn("Flatpickr ou localização 'pt' não encontrados."); }
    
    carregarGaragem(); 

    const initialForecastControls = document.getElementById('forecast-interaction-controls');
    if(initialForecastControls) initialForecastControls.style.display = 'none';

    // Event Listeners para Previsão do Tempo
    const btnVerificarClima = document.getElementById('verificar-clima-btn');
    const inputDestino = document.getElementById('destino-viagem');
    const resultadoClimaDivEl = document.getElementById('previsao-tempo-resultado');
    if (btnVerificarClima && inputDestino && resultadoClimaDivEl) {
        btnVerificarClima.addEventListener('click', async () => {
            const cidade = inputDestino.value.trim();
            nomeCidadeAtualPrevisao = ""; 
            ultimaPrevisaoCompletaProcessada = null;
            if (initialForecastControls) initialForecastControls.style.display = 'none';
            if (!cidade) {
                exibirNotificacao("Por favor, digite o nome da cidade.", 'warning');
                resultadoClimaDivEl.style.display = 'block';
                resultadoClimaDivEl.innerHTML = `<p class="feedback-clima error"><i class="fas fa-exclamation-triangle"></i> Digite uma cidade.</p>`;
                return;
            }
            resultadoClimaDivEl.style.display = 'block';
            resultadoClimaDivEl.innerHTML = `<p class="feedback-clima loading"><i class="fas fa-spinner fa-spin"></i> Buscando previsão para ${cidade}...</p>`;
            try {
                const dadosApiCompletos = await fetchPrevisaoDaAPI(cidade); 
                nomeCidadeAtualPrevisao = dadosApiCompletos.city?.name || cidade;
                ultimaPrevisaoCompletaProcessada = processarDadosForecast(dadosApiCompletos);
                if (ultimaPrevisaoCompletaProcessada && ultimaPrevisaoCompletaProcessada.length > 0) {
                    renderizarPrevisaoComFiltrosAplicados(); 
                } else {
                    resultadoClimaDivEl.innerHTML = `<p class="feedback-clima error"><i class="fas fa-info-circle"></i> Não foi possível processar os dados da previsão para ${nomeCidadeAtualPrevisao}.</p>`;
                }
            } catch (error) {
                console.error("[Frontend] Erro final ao buscar/exibir previsão:", error);
                resultadoClimaDivEl.innerHTML = `<p class="feedback-clima error"><i class="fas fa-times-circle"></i> Falha: ${error.message}</p>`;
            }
        });
    }

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

    // Event Listeners para Dicas de Manutenção
    const btnBuscarDicasGerais = document.getElementById('buscar-dicas-gerais-btn');
    if (btnBuscarDicasGerais) {
        btnBuscarDicasGerais.addEventListener('click', buscarDicasGerais);
    }

    const btnBuscarDicasEspecificas = document.getElementById('buscar-dicas-especificas-btn');
    const inputTipoVeiculoDica = document.getElementById('tipo-veiculo-dica-input');
    if (btnBuscarDicasEspecificas && inputTipoVeiculoDica) {
        btnBuscarDicasEspecificas.addEventListener('click', () => {
            const tipo = inputTipoVeiculoDica.value.trim();
            if (tipo) {
                buscarDicasEspecificas(tipo);
            } else {
                exibirNotificacao("Por favor, digite um tipo de veículo (ex: carro, moto).", 'warning');
            }
        });
    }

    console.log("Garagem Inteligente Conectada inicializada.");

  // ... (todo o código das classes Veiculo, Manutencao, etc. permanece igual aqui no topo) ...

// ... (cole aqui todo o conteúdo do seu script.js até a parte das APIs) ...


// ======================================================================================
// == INÍCIO SEÇÃO DA API - VERSÃO FINAL REVISADA =======================================
// ======================================================================================

const backendUrl = "https://garage-2dux.onrender.com"; // VERIFIQUE ESTA URL!

/**
 * Função auxiliar para tratar erros de fetch, fornecendo mais detalhes no console.
 */
async function handleFetchError(response) {
    const errorBodyText = await response.text().catch(() => "Não foi possível ler o corpo do erro.");
    console.error(`====== ERRO DE FETCH ======`);
    console.error(`URL: ${response.url}`);
    console.error(`Status: ${response.status} (${response.statusText})`);
    console.error(`Corpo da Resposta: ${errorBodyText}`);
    console.error(`===========================`);

    // Tenta extrair uma mensagem de erro JSON do nosso backend
    try {
        const errorJson = JSON.parse(errorBodyText);
        if (errorJson.error) {
            return `Erro do Servidor: ${errorJson.error}`;
        }
    } catch (e) {
        // Se não for JSON, retorna a mensagem de status genérica
        return `Falha na comunicação com o servidor (Status: ${response.status}). Verifique o console para detalhes.`;
    }
    return `Falha na comunicação com o servidor (Status: ${response.status}).`;
}


// --- Funções de busca (usando a função de erro) ---
async function buscarDicasGerais() {
    const resultadoDiv = document.getElementById('dicas-gerais-resultado');
    resultadoDiv.style.display = 'block';
    resultadoDiv.innerHTML = `<p class="loading"><i class="fas fa-spinner fa-spin"></i> Buscando dicas gerais...</p>`;
    try {
        const response = await fetch(`${backendUrl}/api/dicas-manutencao`);
        if (!response.ok) throw new Error(await handleFetchError(response));
        const dicas = await response.json();
        exibirDicas(dicas, resultadoDiv, "Dicas de Manutenção Gerais");
    } catch (error) {
        resultadoDiv.innerHTML = `<p class="error"><i class="fas fa-times-circle"></i> ${error.message}</p>`;
    }
}

async function buscarDicasEspecificas(tipoVeiculo) {
    const resultadoDiv = document.getElementById('dicas-especificas-resultado');
    resultadoDiv.style.display = 'block';
    resultadoDiv.innerHTML = `<p class="loading"><i class="fas fa-spinner fa-spin"></i> Buscando dicas para ${tipoVeiculo}...</p>`;
    try {
        const response = await fetch(`${backendUrl}/api/dicas-manutencao/${encodeURIComponent(tipoVeiculo)}`);
        if (!response.ok) throw new Error(await handleFetchError(response));
        const data = await response.json();
        exibirDicas(data, resultadoDiv, `Dicas Específicas para ${tipoVeiculo}`);
    } catch (error) {
        resultadoDiv.innerHTML = `<p class="error"><i class="fas fa-times-circle"></i> ${error.message}</p>`;
    }
}

async function carregarVeiculosDestaque() {
    const container = document.getElementById('cards-veiculos-destaque');
    if (!container) return;
    container.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando destaques...</p>';
    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos-destaque`);
        if (!response.ok) throw new Error(await handleFetchError(response));
        const veiculos = await response.json();
        // (O resto da lógica de exibição permanece a mesma)
        container.innerHTML = '';
        if (!veiculos || veiculos.length === 0) { container.innerHTML = '<p>Nenhum veículo em destaque no momento.</p>'; return; }
        veiculos.forEach(veiculo => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            card.innerHTML = `
                <img src="${veiculo.imagemUrl}" alt="Imagem do ${veiculo.modelo}" class="veiculo-card-img">
                <div class="veiculo-card-body"><h4>${veiculo.modelo} (${veiculo.ano})</h4><p>${veiculo.destaque}</p></div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = `<p class="error"><i class="fas fa-times-circle"></i> ${error.message}</p>`;
    }
}

async function carregarServicosGaragem() {
    const lista = document.getElementById('lista-servicos-oferecidos');
    if (!lista) return;
    lista.innerHTML = '<li><p class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando serviços...</p></li>';
    try {
        const response = await fetch(`${backendUrl}/api/garagem/servicos-oferecidos`);
        if (!response.ok) throw new Error(await handleFetchError(response));
        const servicos = await response.json();
        // (O resto da lógica de exibição permanece a mesma)
        lista.innerHTML = '';
        if (!servicos || servicos.length === 0) { lista.innerHTML = '<li>Nenhum serviço disponível no momento.</li>'; return; }
        servicos.forEach(servico => {
            const item = document.createElement('li');
            item.className = 'servico-item';
            item.innerHTML = `<strong>${servico.nome}</strong><span>${servico.descricao}</span><em>Preço Estimado: ${servico.precoEstimado}</em>`;
            lista.appendChild(item);
        });
    } catch (error) {
        lista.innerHTML = `<li><p class="error"><i class="fas fa-times-circle"></i> ${error.message}</p></li>`;
    }
}

// ... Cole o resto do seu código de `script.js` (funções de previsão do tempo, listeners, etc.) aqui

// No final do seu listener 'DOMContentLoaded'
document.addEventListener('DOMContentLoaded', () => {
    // ... todo o seu código de inicialização ...
    
    // Chamadas para carregar os dados do backend assim que a página carrega
    carregarVeiculosDestaque();
    carregarServicosGaragem();

});
})

