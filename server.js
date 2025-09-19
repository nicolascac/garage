/// server.js - VERSÃO FINAL (CORRIGIDA)

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // A porta correta é definida aqui
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
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

// UPDATE: Atualizar um veículo por ID
app.put('/api/garagem/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(
            id,
            dadosAtualizados,
            { new: true, runValidators: true }
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

// Rota Proxy para API de Previsão do Tempo
app.get('/api/previsao/:cidade', async (req, res) => {
    try {
        const { cidade } = req.params;
        const apiKey = process.env.OPENWEATHER_API_KEY;

        const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

        const response = await axios.get(weatherAPIUrl);
        res.json(response.data);

    } catch (error) {
        console.error("Erro ao buscar previsão:", error.response?.data || error.message);
        res.status(500).json({ error: 'Falha ao buscar a previsão do tempo.' });
    }
});

// --- ROTAS PARA DICAS DE MANUTENÇÃO ---

const dicasManutencao = [
    { id: 1, tipo: "geral", dica: "Verifique o nível do óleo do motor regularmente, a cada 500 km." },
    { id: 2, tipo: "geral", dica: "Mantenha os pneus calibrados com a pressão recomendada pelo fabricante." },
    { id: 3, tipo: "geral", dica: "Verifique o fluido de arrefecimento (radiador) e complete se necessário." },
    { id: 4, tipo: "geral", dica: "Teste os freios e fique atento a qualquer ruído ou vibração estranha." },
    { id: 5, tipo: "geral", dica: "Limpe os terminais da bateria para evitar corrosão." },
    { id: 6, tipo: "Carro", dica: "Faça o alinhamento e balanceamento das rodas a cada 10.000 km." },
    { id: 7, tipo: "Carro", dica: "Troque o filtro de ar do motor para melhorar o consumo de combustível." },
    { id: 8, tipo: "CarroEsportivo", dica: "Use sempre óleo sintético de alta performance em carros esportivos." },
    { id: 9, tipo: "CarroEsportivo", dica: "Verifique o desgaste dos pneus com mais frequência devido à maior potência." },
    { id: 10, tipo: "Caminhao", dica: "Verifique o sistema de freios a ar com frequência, especialmente as mangueiras." },
    { id: 11, tipo: "Caminhao", dica: "Inspecione o estado dos pneus do reboque antes de cada viagem longa." },
    { id: 12, tipo: "moto", dica: "Lubrifique e ajuste a tensão da corrente da moto regularmente." }
];

app.get('/api/dicas-manutencao', (req, res) => {
    try {
        const dicasGerais = dicasManutencao.filter(d => d.tipo === 'geral');
        res.json(dicasGerais);
    } catch (error) {
        console.error("Erro ao buscar dicas gerais:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/dicas-manutencao/:tipo', (req, res) => {
    try {
        const tipoVeiculo = req.params.tipo.toLowerCase();
        const dicasEspecificas = dicasManutencao.filter(d => d.tipo.toLowerCase() === tipoVeiculo);

        if (dicasEspecificas.length > 0) {
            res.json(dicasEspecificas);
        } else {
            res.json([{
                id: 99,
                tipo: req.params.tipo,
                dica: `Nenhuma dica específica encontrada. Lembre-se da dica geral: sempre consulte o manual do seu ${req.params.tipo}.`
            }]);
        }
    } catch (error) {
        console.error(`Erro ao buscar dicas para o tipo ${req.params.tipo}:`, error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// **A LINHA ABAIXO FOI A CORRIGIDA**
app.listen(port, () => console.log(`Servidor rodando na porta ${port}.`));