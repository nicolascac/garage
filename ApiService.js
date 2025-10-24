//--- START OF FILE ApiService.js ---
// =================== ApiService.js (MODIFICADO) ===================
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

        if (response.status === 401) {
            document.dispatchEvent(new CustomEvent('unauthorized'));
            throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
        }

        if (!response.ok) {
            let errorMessage = `Erro ${response.status}: ${response.statusText}`;
            try {
                // MODIFICADO: Lógica aprimorada para extrair a mensagem de erro do backend.
                // Primeiro tenta "message", depois "error", depois o statusText.
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Se o corpo do erro não for JSON, usa o texto de status padrão.
            }
            throw new Error(errorMessage);
        }

        // Para métodos como DELETE que podem não retornar corpo, mas dão status 204 (No Content)
        if (response.status === 204) {
            return;
        }

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

    deleteVehicle(vehicleId) {
        return this._fetchAuth(`/api/garagem/veiculos/${vehicleId}`, {
            method: 'DELETE',
        });
    }

    // --- NOVO (DESAFIO) ---
    // Métodos para compartilhar e remover compartilhamento

    shareVehicle(vehicleId, email) {
        return this._fetchAuth(`/api/veiculos/${vehicleId}/share`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    unshareVehicle(vehicleId, userIdToRemove) {
        return this._fetchAuth(`/api/veiculos/${vehicleId}/unshare`, {
            method: 'POST',
            body: JSON.stringify({ userIdToRemove }),
        });
    }



  async getWeatherForecast(city) {
        // Esta rota é pública e não precisa de autenticação
        const response = await fetch(`${this.baseUrl}/api/previsao/${encodeURIComponent(city)}`);

        if (!response.ok) {
            // Tenta ler o corpo da resposta para pegar a mensagem de erro específica do backend
            const errorBody = await response.json().catch(() => {
                return { message: `Erro ${response.status}: Falha ao buscar dados do servidor.` };
            });

            // Lança um novo erro com a mensagem, que será capturado no main.js
            throw new Error(errorBody.message || 'Cidade não encontrada ou erro no servidor.');
        }

        // Se a resposta for OK, retorna o JSON com os dados da previsão
        return response.json();
    }




}
//--- END OF FILE ApiService.js ---
//--- START OF FILE AuthManager.js ---
// =================== AuthManager.js (MODIFICADO) ===================
// Gerencia o estado e a lógica de autenticação.

export class AuthManager {
    constructor(apiService, uiManager) {
        this.api = apiService;
        this.ui = uiManager;
        this.garageManager = null; // Será injetado depois
    }

    setGarageManager(garageManager) {
        this.garageManager = garageManager;
    }

    checkAuthState() {
        const token = localStorage.getItem('token');
        if (token) {
            this.ui.showGarageView();
            if (this.garageManager) {
                this.garageManager.loadGarage();
            }
        } else {
            this.ui.showAuthView();
        }
    }

    async handleRegister(email, password) {
        try {
            const data = await this.api.register(email, password);
            this.ui.showNotification(data.message, 'success');
            // Muda automaticamente para a tela de login após registro bem-sucedido
            this.ui.showLoginView();
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleLogin(email, password) {
        try {
            const data = await this.api.login(email, password);
            localStorage.setItem('token', data.token);

            // MODIFICADO: Adiciona a mensagem de boas-vindas e carrega a garagem
            this.ui.showNotification('Login realizado com sucesso! Bem-vindo(a)!', 'success');
            this.ui.showGarageView();
            if (this.garageManager) {
                this.garageManager.loadGarage();
            }
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        this.ui.showAuthView();
        this.ui.showNotification('Você saiu da sua conta.', 'info');
    }

    handleUnauthorized() {
        localStorage.removeItem('token');
        this.ui.showAuthView();
        // Não mostramos notificação aqui pois o ApiService já lança um erro que é exibido
    }
  
}

// SUBSTITUA o método getWeatherForecast por este trecho corrigido:

//--- END OF FILE AuthManager.js ---