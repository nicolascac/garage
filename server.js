// server.js (VERSÃO FINAL E REVISADA)

import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
// A linha mais importante: Lê a chave do ambiente (do Render ou do arquivo .env)
const apiKey = process.env.OPENWEATHER_API_KEY; 

app.use(cors());

// Rota de verificação
app.get('/', (req, res) => res.send('Servidor Backend da Garagem Inteligente está funcionando!'));

// Outras rotas (veículos, serviços, dicas...)
// ... (código das outras rotas que já estão funcionando) ...
const veiculosDestaque = [ { id: 10, modelo: "Maverick Híbrido", ano: 2024, destaque: "Economia com potência e estilo.", imagemUrl: "https://placehold.co/300x200/2c3e50/ffffff?text=Maverick" } ];
const servicosGaragem = [ { id: "svc001", nome: "Diagnóstico Eletrônico Completo", descricao: "Verificação de todos os sistemas eletrônicos do veículo.", precoEstimado: "R$ 250,00" } ];
const dicasManutencaoGerais = [ { id: 1, dica: "Verifique o nível do óleo." }, { id: 2, dica: "Calibre os pneus." } ];
const dicasPorTipo = { carro: [{ id: 101, dica: "Faça o rodízio dos pneus." }], moto: [{ id: 201, dica: "Lubrifique a corrente." }] };

app.get('/api/garagem/veiculos-destaque', (req, res) => res.json(veiculosDestaque));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosGaragem));
app.get('/api/dicas-manutencao', (req, res) => res.json(dicasManutencaoGerais));
app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    const dicas = dicasPorTipo[req.params.tipoVeiculo.toLowerCase()];
    if (dicas) res.json(dicas); else res.status(404).json({ error: `Nenhuma dica para ${req.params.tipoVeiculo}` });
});


// ROTA DE PREVISÃO DO TEMPO (PROXY) - A mais importante para este problema
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    console.log(`[Servidor] Recebida requisição de previsão para a cidade: '${cidade}'`);

    // Verificação de segurança: a chave existe?
    if (!apiKey) {
        console.error("[Servidor] ERRO FATAL: A variável de ambiente OPENWEATHER_API_KEY não está definida!");
        return res.status(500).json({ error: 'Chave da API de clima não está configurada no servidor.' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Fazendo chamada para a API OpenWeatherMap...`);
        const response = await axios.get(url);
        console.log(`[Servidor] Sucesso! Enviando previsão para o frontend.`);
        res.json(response.data);
    } catch (error) {
        // Captura o erro da API externa e o repassa de forma controlada
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao contatar a API de clima.';
        console.error(`[Servidor] Falha na chamada para OpenWeatherMap. Status: ${status}, Mensagem: ${message}`);
        res.status(status).json({
            error: `Não foi possível obter a previsão para '${cidade}'.`,
            detalhes: message
        });
    }
});


app.listen(port, () => console.log(`Servidor rodando na porta ${port}. Aguardando requisições...`));