/// server.js - VERSÃO FINAL COM CRUD COMPLETO

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
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

const manutencaoSchema = new mongoose.Schema({
    data: { type: Date, required: true },
    tipo: { type: String, required: true, trim: true },
    custo: { type: Number, required: true, min: 0 },
    descricao: { type: String, trim: true }
});

const veiculoSchema = new mongoose.Schema({
    modelo: { type: String, required: true, trim: true },
    cor: { type: String, required: true, trim: true },
    tipoVeiculo: { type: String, required: true, enum: ['Carro', 'CarroEsportivo', 'Caminhao'] },
    // Adicione outros campos que podem ser atualizados
    ligado: { type: Boolean, default: false },
    velocidade: { type: Number, default: 0 },
    turbo: { type: Boolean, default: false },
    capacidadeCarga: { type: Number, default: 0 },
    cargaAtual: { type: Number, default: 0 },
    historicoManutencao: [manutencaoSchema]
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
        res.status(500).json({ error: "Erro interno do servidor ao adicionar veículo." });
    }
});

// **NOVO** UPDATE: Atualizar um veículo por ID
app.put('/api/garagem/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(
            id, 
            dadosAtualizados, 
            { new: true, runValidators: true } // Opções: retorna o doc atualizado e roda as validações
        );

        if (!veiculoAtualizado) {
            return res.status(404).json({ error: "Veículo não encontrado para atualização." });
        }

        res.json(veiculoAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar veículo:", error);
        res.status(500).json({ error: "Erro interno do servidor ao atualizar veículo." });
    }
});


// DELETE: Deletar um veículo por ID
app.delete('/api/garagem/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);

        if (!veiculoDeletado) {
            return res.status(404).json({ error: "Veículo não encontrado." });
        }

        res.json({ message: "Veículo deletado com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar veículo:", error);
        res.status(500).json({ error: "Erro interno do servidor ao deletar veículo." });
    }
});

// ... (outras rotas de API como previsão do tempo e dicas podem ser mantidas aqui)

app.listen(port, () => console.log(`Servidor rodando na porta ${port}.`));