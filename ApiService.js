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

        if (response.status === 401) {
            // Delega o evento de deslogar, em vez de manipular a UI diretamente
            document.dispatchEvent(new CustomEvent('unauthorized'));
            throw new Error('Não autorizado');
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erro ${response.status}`);
        }
        return data;
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