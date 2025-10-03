// =================== models.js ===================
// Contém as classes de dados da aplicação: Veiculo, Manutencao e suas subclasses.

export class Manutencao {
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
        if (!(this.data instanceof Date) || isNaN(this.data.getTime())) erros.push("Data inválida.");
        if (!this.tipo) erros.push("Tipo de serviço é obrigatório.");
        if (this.custo < 0) erros.push("Custo não pode ser negativo.");
        return erros;
    }

    formatar(incluirVeiculo = false, nomeVeiculo = '') {
        let dataFormatada = this.data instanceof Date && !isNaN(this.data.getTime())
            ? this.data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : "Data inválida";
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        let str = `<strong>${this.tipo}</strong> em ${dataFormatada} - ${custoFormatado}`;
        if (this.descricao) str += ` <em>(${this.descricao})</em>`;
        if (incluirVeiculo && nomeVeiculo) str += ` - [Veículo: ${nomeVeiculo}]`;
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

export class Veiculo {
    constructor(modelo, cor, id = null, tipoVeiculo = 'Veiculo') {
        this.id = id || `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.ligado = false;
        this.velocidade = 0;
        this.historicoManutencao = [];
        this.tipoVeiculo = tipoVeiculo;
    }

    // ... (Todos os outros métodos de Veiculo: ligar, desligar, acelerar, etc. vêm aqui)
    // NOTA: Remova as chamadas diretas como `exibirNotificacao` ou `salvarGaragem`.
    // A lógica de UI e persistência será tratada externamente.
    // Exemplo de alteração:
    ligar() {
        if (this.ligado) return { success: false, message: `${this.modelo} já está ligado.` };
        this.ligado = true;
        return { success: true, message: `${this.modelo} ligado.` };
    }

    desligar() {
        if (!this.ligado) return { success: false, message: `${this.modelo} já está desligado.` };
        this.ligado = false;
        this.velocidade = 0;
        return { success: true, message: `${this.modelo} desligado.` };
    }

    // ... continue adaptando os outros métodos para retornarem um resultado
    // em vez de chamarem funções de UI diretamente.

    static fromJSON(json) {
        // ... (Método fromJSON permanece o mesmo)
    }

    toJSON() {
        // ... (Método toJSON permanece o mesmo)
    }
}

export class Carro extends Veiculo {
    constructor(modelo, cor, id = null) { super(modelo, cor, id, 'Carro'); }
}

export class CarroEsportivo extends Veiculo {
    // ... (Código da classe CarroEsportivo)
}

export class Caminhao extends Veiculo {
    // ... (Código da classe Caminhao)
}