// =================== main.js ===================
// Ponto de entrada da aplicação. Inicializa os módulos e configura os eventos.

import { ApiService } from './ApiService.js';
import { UIManager } from './UIManager.js';
import { AuthManager } from './AuthManager.js';
import { GarageManager } from './GarageManager.js';

// Função principal que executa quando o DOM está pronto.
function main() {
    const backendUrl = "https://garage-2dux.onrender.com";

    // 1. Inicializar os módulos
    const api = new ApiService(backendUrl);
    const ui = new UIManager();
    const authManager = new AuthManager(api, ui);
    const garageManager = new GarageManager(api, ui);
    
    // Injeção de dependência cruzada
    authManager.setGarageManager(garageManager);

    // 2. Configurar os Event Listeners Globais
    // Remove os `onclick` do HTML e centraliza a lógica aqui.
    
    // --- Eventos de Autenticação ---
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        ui.showRegisterView();
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        ui.showLoginView();
    });
    
    document.getElementById('formRegister').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        authManager.handleRegister(email, password);
    });

    document.getElementById('formLogin').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        authManager.handleLogin(email, password);
    });

    document.getElementById('logoutButton').addEventListener('click', () => {
        authManager.handleLogout();
    });
    
    // Evento customizado para quando a API retornar 401
    document.addEventListener('unauthorized', () => {
        authManager.handleUnauthorized();
    });

    // --- Eventos da Garagem ---
    document.getElementById('formAdicionarVeiculo').addEventListener('submit', (e) => {
        e.preventDefault();
        const vehicleData = {
            tipoVeiculo: document.getElementById('tipoVeiculo').value,
            modelo: document.getElementById('modeloVeiculo').value,
            cor: document.getElementById('corVeiculo').value,
        };
        // Lógica adicional para caminhão, etc.
        garageManager.addVehicle(vehicleData);
    });

    // Usando delegação de eventos para os botões de remover/editar
    ui.listaVeiculosDiv.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const vehicleId = target.dataset.id;
        if (target.classList.contains('remove-btn')) {
            garageManager.removeVehicle(vehicleId);
        }
        if (target.classList.contains('edit-btn')) {
            // Chamar um método em UIManager ou GarageManager para abrir o modal de edição
            console.log(`Editar veículo: ${vehicleId}`); 
        }
    });

    // 3. Iniciar a aplicação
    authManager.checkAuthState();
}

// Garante que o script só vai rodar depois que a página HTML inteira for carregada.
document.addEventListener('DOMContentLoaded', main);