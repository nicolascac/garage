// server.js - VERSÃO FINAL COM MONGODB

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose'; // Importar mongoose

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors()); // Habilita CORS para todas as requisições
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// --- CONEXÃO COM O MONGODB ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("ERRO FATAL: A variável de ambiente MONGO_URI não está definida!");
    process.exit(1); // Encerra a aplicação se a URI do DB não for encontrada
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => {
        console.error("Falha ao conectar ao MongoDB:", err);
        process.exit(1);
    });

// --- DEFINIÇÃO DE SCHEMAS E MODELS (Planta dos nossos dados) ---

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

// Rota de verificação
app.get('/', (req, res) => res.send('Servidor Backend da Garagem Inteligente está funcionando e conectado ao MongoDB!'));

// Rota para BUSCAR todos os veículos da garagem
app.get('/api/garagem/veiculos', async (req, res) => {
    try {
        const veiculos = await Veiculo.find(); // Busca todos os documentos na coleção 'veiculos'
        res.json(veiculos);
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        res.status(500).json({ error: "Erro interno do servidor ao buscar veículos." });
    }
});

// Rota para ADICIONAR um novo veículo
app.post('/api/garagem/veiculos', async (req, res) => {
    try {
        const dadosVeiculo = req.body; // Pega os dados enviados pelo frontend
        
        // Validação básica (pode ser mais robusta)
        if (!dadosVeiculo.modelo || !dadosVeiculo.cor || !dadosVeiculo.tipoVeiculo) {
            return res.status(400).json({ error: "Modelo, cor e tipo de veículo são obrigatórios." });
        }

        const novoVeiculo = new Veiculo(dadosVeiculo); // Cria uma nova instância do modelo
        await novoVeiculo.save(); // Salva no banco de dados

        res.status(201).json(novoVeiculo); // Retorna o veículo criado com sucesso
    } catch (error) {
        console.error("Erro ao adicionar veículo:", error);
        res.status(500).json({ error: "Erro interno do servidor ao adicionar veículo." });
    }
});

// Rota para DELETAR um veículo por ID
app.delete('/api/garagem/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);

        if (!veiculoDeletado) {
            return res.status(404).json({ error: "Veículo não encontrado." });
        }

        res.json({ message: "Veículo deletado com sucesso!", veiculo: veiculoDeletado });
    } catch (error) {
        console.error("Erro ao deletar veículo:", error);
        res.status(500).json({ error: "Erro interno do servidor ao deletar veículo." });
    }
});


// As outras rotas (previsão do tempo, dicas, etc.) podem permanecer as mesmas,
// pois não dependem do banco de dados da garagem.
// A rota de previsão do tempo continua sendo um proxy importante.

const apiKey = process.env.OPENWEATHER_API_KEY; 

app.get('/api/previsao/:cidade', async (req, res) => {
    // ... (código da rota de previsão do tempo permanece igual)
});


// Iniciar o servidor
app.listen(port, () => console.log(`Servidor rodando na porta ${port}.`));