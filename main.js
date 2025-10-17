import { ApiService } from './ApiService.js';
import { UIManager } from './UIManager.js';
import { AuthManager } from './AuthManager.js';
import { GarageManager } from './GarageManager.js';

// A função principal é envolvida em um listener para garantir que o HTML
// esteja totalmente carregado antes de o script ser executado.
document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------
    // 1. CONFIGURAÇÃO E INSTANCIAÇÃO DOS MÓDULOS
    // -------------------------------------------
    //const backendUrl = "https://garage-2dux.onrender.com"; // Sua URL do backend
    const backendUrl = "http://localhost:3001"; // Sua URL do backend


    const api = new ApiService(backendUrl);
    const ui = new UIManager();
    const authManager = new AuthManager(api, ui);
    const garageManager = new GarageManager(api, ui);

    // -------------------------------------------
    // 2. INJEÇÃO DE DEPENDÊNCIA
    // -------------------------------------------
    // Conecta o AuthManager ao GarageManager para que o login possa carregar a garagem.
    authManager.setGarageManager(garageManager);

    // -------------------------------------------
    // 3. CONFIGURAÇÃO DOS EVENT LISTENERS
    // -------------------------------------------

    // --- Listeners de Autenticação ---
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const logoutButton = document.getElementById('logoutButton');

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            ui.showRegisterView();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            ui.showLoginView();
        });
    }

    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            authManager.handleRegister(email, password);
        });
    }

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            authManager.handleLogin(email, password);
        });
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            authManager.handleLogout();
        });
    }

    // Listener para o evento customizado de 'não autorizado' (token expirado/inválido)
    document.addEventListener('unauthorized', () => {
        authManager.handleUnauthorized();
    });


    // --- Listeners da Garagem ---
    const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
    const tipoVeiculoSelect = document.getElementById('tipoVeiculo');

    if (formAdicionarVeiculo) {
        formAdicionarVeiculo.addEventListener('submit', (e) => {
            e.preventDefault();
            const tipo = tipoVeiculoSelect.value;
            const modelo = document.getElementById('modeloVeiculo').value;
            const cor = document.getElementById('corVeiculo').value;

            const vehicleData = {
                tipoVeiculo: tipo,
                modelo: modelo,
                cor: cor,
            };

            // Adiciona a capacidade de carga ao objeto de dados apenas se for um caminhão
            if (tipo === 'Caminhao') {
                const capacidade = document.getElementById('capacidadeCargaVeiculo').value;
                vehicleData.capacidadeCarga = parseFloat(capacidade) || 0;
            }

            garageManager.addVehicle(vehicleData);
            formAdicionarVeiculo.reset(); // Limpa o formulário após o envio
            document.getElementById('campoCapacidadeCarga').style.display = 'none'; // Esconde o campo de carga
        });
    }

    // Listener para mostrar/ocultar o campo de capacidade de carga
    if (tipoVeiculoSelect) {
        tipoVeiculoSelect.addEventListener('change', () => {
            const campoCapacidade = document.getElementById('campoCapacidadeCarga');
            if (tipoVeiculoSelect.value === 'Caminhao') {
                campoCapacidade.style.display = 'block';
            } else {
                campoCapacidade.style.display = 'none';
            }
        });
    }
    
    // Listener para a lista de veículos (usando delegação de eventos)
    // Isso permite que os botões de editar/remover funcionem mesmo para
    // veículos adicionados dinamicamente.
    if (ui.listaVeiculosDiv) {
        ui.listaVeiculosDiv.addEventListener('click', (e) => {
            const button = e.target.closest('button'); // Encontra o botão mais próximo que foi clicado
            if (!button) return;

            const vehicleId = button.dataset.id;
            if (!vehicleId) return;

            if (button.classList.contains('remove-btn')) {
                garageManager.removeVehicle(vehicleId);
            }
            if (button.classList.contains('edit-btn')) {
                // TODO: Implementar a lógica para abrir o modal de edição
                // garageManager.startEditVehicle(vehicleId);
                ui.showNotification(`Funcionalidade "Editar" para o veículo ${vehicleId} ainda a ser implementada.`, 'info');
                console.log(`Clicou em Editar para o veículo: ${vehicleId}`);
            }
        });
    }

    // -------------------------------------------
    // 4. PONTO DE PARTIDA DA APLICAÇÃO
    // -------------------------------------------
    // Verifica se o usuário já tem um token de login no localStorage ao carregar a página.
    authManager.checkAuthState();

    console.log("Aplicação Garagem Inteligente inicializada.");
});