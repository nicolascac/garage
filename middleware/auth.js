import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// A constante é declarada aqui também para ser usada na verificação
const JWT_SECRET = process.env.JWT_SECRET || 'SEU_SEGREDO_SUPER_SECRETO';

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
  }

  const token = authHeader.substring(7);

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token malformado.' });
  }

  try {
    // >>> AQUI A CONSTANTE JWT_SECRET É USADA PARA VERIFICAR O TOKEN <<<
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

export default authMiddleware;