// =================== ApiService.js ===================
// Lida com toda a comunicação com o backend.

export class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async _fetchAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${url}`, { ...options, headers });

    // Se a resposta for 401 (Não Autorizado), o token é inválido ou expirou.
    if (response.status === 401) {
        // Dispara um evento global para que o AuthManager possa deslogar o usuário.
        document.dispatchEvent(new CustomEvent('unauthorized'));
        // Rejeita a promessa para interromper a execução.
        throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
    }

    // Se a resposta NÃO for bem-sucedida (ex: 400, 404, 500), trata como erro.
    if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
            // Tenta extrair a mensagem de erro específica do backend.
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            // Se o corpo do erro não for JSON, usa o texto de status padrão.
        }
        // Rejeita a promessa com a mensagem de erro.
        throw new Error(errorMessage);
    }

    // Se tudo deu certo, retorna os dados JSON.
    return response.json();
}
    // --- Auth ---
    register(email, password) {
        return this._fetchAuth('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    login(email, password) {
        return this._fetchAuth('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    // --- Garagem ---
    getVehicles() {
        return this._fetchAuth('/api/garagem/veiculos');
    }

    addVehicle(vehicleData) {
        return this._fetchAuth('/api/garagem/veiculos', {
            method: 'POST',
            body: JSON.stringify(vehicleData),
        });
    }

    updateVehicle(vehicleId, vehicleData) {
        return this._fetchAuth(`/api/garagem/veiculos/${vehicleId}`, {
            method: 'PUT',
            body: JSON.stringify(vehicleData),
        });
    }

    deleteVehicle(vehicleId) {
        return this._fetchAuth(`/api/garagem/veiculos/${vehicleId}`, {
            method: 'DELETE',
        });
    }
    
    // --- Dicas e Serviços ---
    getGeneralTips() {
        return this._fetchAuth('/api/dicas-manutencao');
    }
    
    getSpecificTips(vehicleType) {
        return this._fetchAuth(`/api/dicas-manutencao/${encodeURIComponent(vehicleType)}`);
    }

    // ... (outras chamadas de API como clima, etc.)
}