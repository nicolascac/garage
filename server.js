// server.js - ATUALIZADO PARA GERENCIAR MANUTENÇÕES COMO SUB-RECURSO

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

// Importar o novo modelo de Manutenção
import Manutencao from './models/Manutencao.js'; // Certifique-se de que o path está correto

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configuração do CORS: Permite requisições do frontend local e do backend deployado.
// Ajuste as origens se necessário para o seu ambiente.
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'https://garage-2dux.onrender.com'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("ERRO FATAL: A variável de ambiente MONGO_URI não está definida!");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => {
        console.error("Falha ao conectar ao MongoDB:", err);
        process.exit(1);
    });

// --- SCHEMAS Mongoose ---

// MODIFICAÇÃO: Remover o campo 'historicoManutencao' do schema do Veiculo.
// A relação será gerenciada pela coleção 'Manutencao'.
const veiculoSchema = new mongoose.Schema({
    modelo: { type: String, required: true, trim: true },
    cor: { type: String, required: true, trim: true },
    tipoVeiculo: { type: String, required: true, enum: ['Carro', 'CarroEsportivo', 'Caminhao'] },
    // Campos de estado que podem ser atualizados
    ligado: { type: Boolean, default: false },
    velocidade: { type: Number, default: 0 },
    // Propriedades específicas por tipo (para serem gerenciadas no frontend ou via rotas específicas)
    turbo: { type: Boolean, default: false }, 
    capacidadeCarga: { type: Number, default: 0 }, 
    cargaAtual: { type: Number, default: 0 }, 
}, { timestamps: true });

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

// --- ROTAS DA API ---

app.get('/', (req, res) => res.send('Servidor Backend da Garagem Inteligente está funcionando e conectado ao MongoDB!'));

// READ: Buscar todos os veículos
app.get('/api/garagem/veiculos', async (req, res) => {
    try {
        const veiculos = await Veiculo.find().sort({ modelo: 1 });
        res.json(veiculos);
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        res.status(500).json({ error: "Erro interno do servidor ao buscar veículos." });
    }
});

// CREATE: Adicionar um novo veículo
app.post('/api/garagem/veiculos', async (req, res) => {
    try {
        const dadosVeiculo = req.body;
        if (!dadosVeiculo.modelo || !dadosVeiculo.cor || !dadosVeiculo.tipoVeiculo) {
            return res.status(400).json({ error: "Modelo, cor e tipo de veículo são obrigatórios." });
        }
        const novoVeiculo = new Veiculo(dadosVeiculo);
        await novoVeiculo.save();
        res.status(201).json(novoVeiculo);
    } catch (error) {
        console.error("Erro ao adicionar veículo:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Erro interno do servidor ao adicionar veículo." });
    }
});

// UPDATE: Atualizar um veículo por ID (essencial para o frontend)
app.put('/api/garagem/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(
            id,
            dadosAtualizados,
            { new: true, runValidators: true } // Retorna o doc atualizado e executa validações
        );

        if (!veiculoAtualizado) {
            return res.status(404).json({ error: "Veículo não encontrado para atualização." });
        }

        res.json(veiculoAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar veículo:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Erro interno do servidor ao atualizar veículo." });
    }
});

// DELETE: Deletar um veículo por ID
app.delete('/api/garagem/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Opcional, mas recomendado: remover manutenções associadas ao veículo deletado
        await Manutencao.deleteMany({ veiculo: id });
        console.log(`Manutenções associadas ao veículo ${id} foram deletadas.`);

        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);

        if (!veiculoDeletado) {
            return res.status(404).json({ error: "Veículo não encontrado." });
        }

        res.json({ message: "Veículo e suas manutenções associadas deletados com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar veículo:", error);
        res.status(500).json({ error: "Erro interno do servidor ao deletar veículo." });
    }
});

// --- NOVAS ROTAS PARA MANUTENÇÕES (SUB-RECURSOS) ---

// CREATE: Adicionar uma nova manutenção para um veículo específico
// POST /api/veiculos/:veiculoId/manutencoes
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const dadosManutencao = req.body; // Dados como descricaoServico, data, custo, quilometragem, descricao

        // 1. Validar se o veículo com o ID fornecido existe
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ error: `Veículo com ID ${veiculoId} não encontrado.` });
        }

        // 2. Criar a nova manutenção, associando-a ao veículo
        const novaManutencao = new Manutencao({
            ...dadosManutencao, // Copia os dados do corpo da requisição
            veiculo: veiculoId  // Associa ao ID do veículo encontrado
        });

        // 3. Salvar a manutenção no banco de dados
        const manutencaoSalva = await novaManutencao.save();

        // 4. Retornar sucesso com os dados da manutenção criada
        res.status(201).json(manutencaoSalva);

    } catch (error) {
        console.error("Erro ao adicionar manutenção:", error);
        // Tratamento de erros de validação do Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        // Tratamento para ID de veículo inválido
        if (error.kind === 'ObjectId' && error.path === 'veiculo') {
             return res.status(400).json({ error: "Formato de ID de veículo inválido." });
        }
        res.status(500).json({ error: "Erro interno do servidor ao adicionar manutenção." });
    }
});

// READ: Listar todas as manutenções de um veículo específico
// GET /api/veiculos/:veiculoId/manutencoes
app.get('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        const { veiculoId } = req.params;

        // Buscar manutenções associadas ao veículo, ordenadas pela data mais recente
        const manutenções = await Manutencao.find({ veiculo: veiculoId })
                                            .sort({ data: -1 }); // -1 para ordem decrescente (mais recente primeiro)

        res.status(200).json(manutenções);

    } catch (error) {
        console.error("Erro ao buscar manutenções:", error);
        if (error.kind === 'ObjectId' && error.path === 'veiculo') {
             return res.status(400).json({ error: "Formato de ID de veículo inválido." });
        }
        res.status(500).json({ error: "Erro interno do servidor ao buscar manutenções." });
    }
});

// DELETE: Remover uma manutenção específica de um veículo
// DELETE /api/veiculos/:veiculoId/manutencoes/:manutencaoId
app.delete('/api/veiculos/:veiculoId/manutencoes/:manutencaoId', async (req, res) => {
    try {
        const { veiculoId, manutencaoId } = req.params;

        // Remove a manutenção se ela existir E pertencer ao veículo especificado
        const manutencaoDeletada = await Manutencao.deleteOne({ _id: manutencaoId, veiculo: veiculoId });
        
        if (manutencaoDeletada.deletedCount === 0) {
            // Se deletedCount for 0, a manutenção não foi encontrada ou não pertence a este veículo
            return res.status(404).json({ error: `Manutenção com ID ${manutencaoId} não encontrada ou não pertence ao veículo ${veiculoId}.` });
        }

        res.json({ message: `Manutenção ${manutencaoId} removida com sucesso.` });

    } catch (error) {
        console.error("Erro ao remover manutenção:", error);
        if (error.kind === 'ObjectId') { // Erro comum se algum dos IDs for inválido
             return res.status(400).json({ error: "Formato de ID inválido fornecido." });
        }
        res.status(500).json({ error: "Erro interno do servidor ao remover manutenção." });
    }
});


// --- Rotas de Dicas (mantidas do seu código original) ---
const dicasManutencaoDB = [
    { id: 1, tipo: 'geral', dica: 'Verifique a pressão dos pneus regularmente.' },
    { id: 2, tipo: 'geral', dica: 'Troque o óleo do motor a cada 5.000 km ou 6 meses.' },
    { id: 3, tipo: 'Carro', dica: 'Limpe os contatos da bateria para evitar problemas de partida.' },
    { id: 4, tipo: 'CarroEsportivo', dica: 'Use combustível de alta octanagem para melhor desempenho.' },
    { id: 5, tipo: 'Caminhao', dica: 'Inspecione freios e suspensão com mais frequência devido ao peso.' },
    { id: 6, tipo: 'geral', dica: 'Filtro de ar limpo melhora a eficiência do combustível.' },
    { id: 7, tipo: 'moto', dica: 'Verifique o nível do fluido de freio.' }, 
];

app.get('/api/dicas-manutencao/:tipo?', (req, res) => {
    const tipo = req.params.tipo;
    let dicasFiltradas = [];

    if (tipo) {
        const tipoLowerCase = tipo.toLowerCase();
        dicasFiltradas = dicasManutencaoDB.filter(d =>
            d.tipo.toLowerCase() === 'geral' || d.tipo.toLowerCase() === tipoLowerCase
        );
    } else {
        dicasFiltradas = dicasManutencaoDB; // Todas as dicas se nenhum tipo for especificado
    }
    
    const dicasUnicas = Array.from(new Map(dicasFiltradas.map(item => [item.id, item])).values());

    if (dicasUnicas.length === 0) {
        return res.status(404).json({ error: `Nenhuma dica encontrada para o tipo '${tipo}'.` });
    }

    res.json(dicasUnicas);
});

// --- Iniciar o servidor ---
app.listen(port, () => console.log(`Servidor rodando na porta ${port}.`));