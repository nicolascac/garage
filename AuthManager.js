// =================== AuthManager.js ===================
// Gerencia o estado e a lógica de autenticação.

export class AuthManager {
    constructor(apiService, uiManager) {
        this.api = apiService;
        this.ui = uiManager;
        this.garageManager = null; // Será injetado depois
    }
    
    // Injeta o garageManager para poder chamá-lo após o login
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
            this.ui.showLoginView();
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleLogin(email, password) {
        try {
            const data = await this.api.login(email, password);
            localStorage.setItem('token', data.token);
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
        this.ui.showNotification('Sua sessão expirou. Faça login novamente.', 'warning');
    }
}