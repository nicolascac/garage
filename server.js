// server.js - VERSÃO COM NOVOS ENDPOINTS CRUD (Create/Read)

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import Veiculo from './models/Veiculo.js'; // Importando o novo modelo

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- CONEXÃO COM O MONGODB ---
const MONGO_URI = process.env.MONGO_URI_CRUD || process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("ERRO FATAL: A variável de ambiente MONGO_URI_CRUD ou MONGO_URI não está definida!");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => {
        console.error("Falha ao conectar ao MongoDB:", err);
        process.exit(1);
    });

// --- NOVAS ROTAS DA API PARA CRUD DE VEÍCULOS ---

// Rota para LER (Read) todos os veículos
app.get('/api/veiculos', async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find(); // .find() sem argumentos busca todos
        
        console.log('[Servidor] Buscando todos os veículos do DB.');
        res.json(todosOsVeiculos);

    } catch (error) {
        console.error("[Servidor] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro interno ao buscar veículos.' });
    }
});

// Rota para CRIAR (Create) um novo veículo
app.post('/api/veiculos', async (req, res) => {
    try {
        const novoVeiculoData = req.body;
        // O Mongoose aplicará as validações do Schema aqui
        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        
        console.log('[Servidor] Veículo criado com sucesso:', veiculoCriado);
        res.status(201).json(veiculoCriado); // Retorna o veículo criado com o _id do DB

    } catch (error) {
        console.error("[Servidor] Erro ao criar veículo:", error);
        // Tratamento de erros de validação e duplicidade do Mongoose
        if (error.code === 11000) { // Erro de placa duplicada (unique)
            return res.status(409).json({ error: 'Veículo com esta placa já existe.' });
        }
        if (error.name === 'ValidationError') { // Erros de campos obrigatórios, min/max, etc.
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') });
        }
        res.status(500).json({ error: 'Erro interno ao criar veículo.' });
    }
});


// --- ROTAS ANTIGAS (Podem ser mantidas para outras funcionalidades) ---
app.get('/', (req, res) => res.send('Servidor Backend da Garagem Inteligente está funcionando e conectado ao MongoDB!'));

const apiKey = process.env.OPENWEATHER_API_KEY; 
app.get('/api/previsao/:cidade', async (req, res) => {
    // ... (o código da rota de previsão do tempo pode permanecer aqui)
});

// Iniciar o servidor
app.listen(port, () => console.log(`Servidor rodando na porta ${port}.`));