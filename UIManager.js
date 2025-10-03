// =================== UIManager.js ===================
// Responsável por toda a manipulação do DOM.

export class UIManager {
    constructor() {
        // Mapeia todos os elementos do DOM aqui para fácil acesso
        this.authContainer = document.getElementById('auth-container');
        this.garageContainer = document.getElementById('garage-container');
        this.loginView = document.getElementById('login-view');
        this.registerView = document.getElementById('register-view');
        this.listaVeiculosDiv = document.getElementById('listaVeiculos');
        this.notificationDiv = document.getElementById('notificacoes');
        // ... adicione outros elementos importantes aqui
        this.notificationTimeout = null;
    }
    
    // --- Controle de Visibilidade ---
    showAuthView() {
        this.authContainer.style.display = 'block';
        this.garageContainer.style.display = 'none';
    }

    showGarageView() {
        this.authContainer.style.display = 'none';
        this.garageContainer.style.display = 'block';
    }
    
    showLoginView() {
        this.registerView.style.display = 'none';
        this.loginView.style.display = 'block';
    }

    showRegisterView() {
        this.loginView.style.display = 'none';
        this.registerView.style.display = 'block';
    }

    // --- Renderização ---
    renderGarage(garagem) {
        this.listaVeiculosDiv.innerHTML = '';
        if (garagem.length === 0) {
            this.listaVeiculosDiv.innerHTML = '<p>Garagem vazia. Adicione um veículo!</p>';
            return;
        }
        
        garagem.sort((a, b) => a.modelo.localeCompare(b.modelo));
        garagem.forEach(veiculo => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'vehicle-item';
            // Usamos data attributes para passar IDs para os event listeners
            itemDiv.dataset.id = veiculo._id; 
            itemDiv.innerHTML = `
                <span><strong>${veiculo.modelo}</strong> (${veiculo.tipoVeiculo}) - Cor: ${veiculo.cor}</span>
                <div class="actions">
                    <button class="edit-btn" data-id="${veiculo._id}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="remove-btn warning" data-id="${veiculo._id}"><i class="fas fa-trash-alt"></i> Remover</button>
                </div>
            `;
            this.listaVeiculosDiv.appendChild(itemDiv);
        });
    }
    
    // --- Notificações ---
    showNotification(message, type = 'info', duration = 5000) {
        this.notificationDiv.textContent = message;
        this.notificationDiv.className = `notificacao ${type} show`;
        
        clearTimeout(this.notificationTimeout);
        if (duration > 0) {
            this.notificationTimeout = setTimeout(() => {
                this.notificationDiv.classList.remove('show');
            }, duration);
        }
    }

    // ... (Crie métodos para abrir/fechar modais, renderizar o clima, etc.)
}