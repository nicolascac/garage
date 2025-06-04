// server.js

import express from 'express';
// dotenv e axios não são necessários para este teste simples
// import dotenv from 'dotenv';
// import axios from 'axios';

// dotenv.config(); // Não necessário para este teste

const app = express();
const port = process.env.PORT || 3001;
// const apiKey = process.env.OPENWEATHER_API_KEY; // Não necessário para este teste

// Middleware CORS (Mantenha este!)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ROTA DE TESTE SIMPLIFICADA
app.get('/api/previsao/:cidade', (req, res) => {
    const { cidade } = req.params;
    console.log(`[Servidor Render Teste] Rota /api/previsao/:cidade acessada para: ${cidade}`);
    res.status(200).json({
        message: `Backend no Render respondeu para cidade: ${cidade}`,
        sucesso: true
    });
});

// Rota raiz para verificar se o servidor está no ar
app.get('/', (req, res) => {
    res.send('Servidor Backend da Garagem Inteligente (VERSÃO DE TESTE SIMPLES) está funcionando!');
});

app.listen(port, () => {
    console.log(`Servidor backend (VERSÃO DE TESTE SIMPLES) rodando em http://localhost:${port}`);
});