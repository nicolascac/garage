// server.js (VERSÃO CORRETA E FINAL)

import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

app.use(cors());

// --- ROTAS DE DICAS ---
const dicasManutencaoGerais = [ { id: 1, dica: "Verifique o nível do óleo." }, { id: 2, dica: "Calibre os pneus." } ];
const dicasPorTipo = { carro: [{ id: 101, dica: "Faça o rodízio dos pneus." }], moto: [{ id: 201, dica: "Lubrifique a corrente." }] };
app.get('/api/dicas-manutencao', (req, res) => res.json(dicasManutencaoGerais));
app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    const dicas = dicasPorTipo[req.params.tipoVeiculo.toLowerCase()];
    if (dicas) res.json(dicas);
    else res.status(404).json({ error: `Nenhuma dica para ${req.params.tipoVeiculo}` });
});

// --- ROTA DE PREVISÃO DO TEMPO (FUNCIONAL) ---
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
   
    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        console.log(`[Backend] Buscando previsão para ${cidade}...`);
        const response = await axios.get(url);
        res.json(response.data); // Resposta real do OpenWeatherMap
    } catch (error) {
        console.error("[Backend] Erro:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: `Erro ao buscar previsão para '${cidade}'.`,
            detalhes: error.response?.data?.message || 'Erro interno do servidor.'
        });
    }
});

// --- ROTA RAIZ ---
app.get('/', (req, res) => res.send('Servidor Backend da Garagem Inteligente está funcionando!'));

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));