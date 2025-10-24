// =================== server.js (CORRIGIDO) ===================

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Importe o bcrypt
import jwt from 'jsonwebtoken';
import User from './models/User.js'; // Verifique se o caminho para o model User está correto
import Veiculo from './models/Veiculo.js'; // Verifique se o caminho para o model Veiculo está correto
import authMiddleware from './middleware/auth.js'; // Verifique se o caminho para o middleware está correto

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'SEU_SEGREDO_SUPER_SECRETO';
const MONGO_URI = process.env.MONGO_URI;

// --- Middlewares Essenciais ---
app.use(cors());
app.use(express.json());

// --- Conexão com o MongoDB ---
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

// ===================================
// == ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
// ===================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Este e-mail já está em uso.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Use 401 para falha de autenticação
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Use 401
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: 'Erro interno ao fazer login.' });
    }
});

// ===========================================
// == ROTAS DA GARAGEM (PROTEGIDAS)
// ===========================================

// READ: Buscar todos os veículos do usuário logado
app.get('/api/garagem/veiculos', authMiddleware, async (req, res) => {
    try {
        // MODIFICADO: Adicionado .populate() para buscar os emails dos usuários compartilhados
        const veiculos = await Veiculo.find({ owner: req.userId })
            .populate('sharedWith', 'email _id') // Popula o campo 'sharedWith' buscando apenas 'email' e '_id' da coleção de usuários
            .sort({ modelo: 1 });
        res.json(veiculos);
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar veículos." });
    }
});

// CREATE: Adicionar um novo veículo
app.post('/api/garagem/veiculos', authMiddleware, async (req, res) => {
    try {
        const dadosVeiculo = { ...req.body, owner: req.userId };
        if (!dadosVeiculo.modelo || !dadosVeiculo.cor || !dadosVeiculo.tipoVeiculo) {
            return res.status(400).json({ message: "Modelo, cor e tipo de veículo são obrigatórios." });
        }
        const novoVeiculo = new Veiculo(dadosVeiculo);
        await novoVeiculo.save();
        res.status(201).json(novoVeiculo);
    } catch (error) {
        console.error("Erro ao adicionar veículo:", error);
        res.status(500).json({ message: "Erro interno do servidor ao adicionar veículo." });
    }
});

// DELETE: Deletar um veículo por ID
app.delete('/api/garagem/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const veiculo = await Veiculo.findOneAndDelete({ _id: id, owner: req.userId });

        if (!veiculo) {
            return res.status(404).json({ message: "Veículo não encontrado ou você não tem permissão para removê-lo." });
        }
        res.json({ message: `Veículo "${veiculo.modelo}" removido com sucesso!` });
    } catch (error) {
        console.error("Erro ao deletar veículo:", error);
        res.status(500).json({ message: "Erro interno do servidor ao deletar veículo." });
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

app.put('/api/garagem/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        // Encontra o veículo e garante que o usuário logado é o proprietário
        const veiculo = await Veiculo.findOneAndUpdate(
            { _id: id, owner: req.userId },
            dadosAtualizados,
            { new: true, runValidators: true } // Opções: retorna o documento atualizado e roda as validações do Schema
        );

        if (!veiculo) {
            return res.status(404).json({ error: "Veículo não encontrado ou você não tem permissão para editá-lo." });
        }

        res.json({ message: "Veículo atualizado com sucesso!", veiculo });
    } catch (error) {
        console.error("Erro ao atualizar veículo:", error);
        res.status(500).json({ error: "Erro interno do servidor ao atualizar veículo." });
    }
});










// Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Este e-mail já está em uso.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        // >>> AQUI A CONSTANTE JWT_SECRET É USADA <<<
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});


// --- ROTAS DE VEÍCULOS (PROTEGIDAS) ---
// Note o `authMiddleware` antes de cada controlador de rota
app.get('/api/garagem/veiculos', authMiddleware, async (req, res) => {
    const veiculos = await Veiculo.find({ owner: req.userId });
    res.json(veiculos);
});

app.post('/api/garagem/veiculos', authMiddleware, async (req, res) => {
    const dadosVeiculo = { ...req.body, owner: req.userId };
    const novoVeiculo = new Veiculo(dadosVeiculo);
    await novoVeiculo.save();
    res.status(201).json(novoVeiculo);
});

// ... (rotas PUT e DELETE também usam authMiddleware) ...
app.delete('/api/garagem/veiculos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const veiculo = await Veiculo.findOne({ _id: id, owner: req.userId });
    if (!veiculo) {
        return res.status(404).json({ error: "Veículo não encontrado ou não pertence a você." });
    }
    await Veiculo.findByIdAndDelete(id);
    res.json({ message: "Veículo deletado com sucesso!" });
});



// Rota para COMPARTILHAR um veículo com outro usuário
app.post('/api/veiculos/:veiculoId/share', authMiddleware, async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const { email } = req.body; // Recebe o email do usuário a ser adicionado

        if (!email) {
            return res.status(400).json({ message: 'O e-mail do usuário é obrigatório.' });
        }

        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ message: 'Veículo não encontrado.' });
        }

        // Verifica se quem está compartilhando é o dono do veículo
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Ação não permitida. Apenas o proprietário pode compartilhar.' });
        }
        
        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) {
            return res.status(404).json({ message: `Usuário com e-mail "${email}" não encontrado.` });
        }

        // Não permite compartilhar com o próprio dono
        if(userToShareWith._id.toString() === req.userId) {
            return res.status(400).json({ message: 'Você não pode compartilhar um veículo com você mesmo.' });
        }

        // Usa $addToSet para evitar IDs duplicados no array
        await Veiculo.updateOne(
            { _id: veiculoId },
            { $addToSet: { sharedWith: userToShareWith._id } }
        );

        res.json({ message: `Veículo compartilhado com ${email} com sucesso!` });
    } catch (error) {
        console.error("Erro ao compartilhar veículo:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});


// Rota para REMOVER O COMPARTILHAMENTO de um veículo
app.post('/api/veiculos/:veiculoId/unshare', authMiddleware, async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const { userIdToRemove } = req.body; // Recebe o ID do usuário a ser removido

        if (!userIdToRemove) {
            return res.status(400).json({ message: 'O ID do usuário a ser removido é obrigatório.' });
        }

        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ message: 'Veículo não encontrado.' });
        }

        // Verifica se quem está removendo o acesso é o dono do veículo
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Ação não permitida. Apenas o proprietário pode remover acessos.' });
        }

        // Ação Principal: Usa o operador $pull do Mongoose para remover o userIdToRemove do array sharedWith
        await Veiculo.updateOne(
            { _id: veiculoId },
            { $pull: { sharedWith: userIdToRemove } }
        );

        res.json({ message: 'Acesso removido com sucesso!' });
    } catch (error) {
        console.error("Erro ao remover compartilhamento:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});




// **A LINHA ABAIXO FOI A CORRIGIDA**
app.listen(port, () => console.log(`Servidor rodando na porta ${port}.`));