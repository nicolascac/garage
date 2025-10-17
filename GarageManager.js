// =================== GarageManager.js ===================
// Gerencia o estado e as operações da garagem.

export class GarageManager {
    constructor(apiService, uiManager) {
        this.api = apiService;
        this.ui = uiManager;
        this.garagem = []; // O estado da garagem agora vive aqui
    }

    async loadGarage() {
        try {
            const veiculosDoBackend = await this.api.getVehicles();
            // Aqui você pode reidratar para suas classes `Veiculo` se precisar
            // dos métodos do frontend (ligar, etc.) ou apenas usar o JSON puro.
            this.garagem = veiculosDoBackend;
            this.ui.renderGarage(this.garagem);
        } catch (error) {
            if (error.message !== 'Não autorizado') {
                this.ui.showNotification('Falha ao carregar veículos.', 'error');
            }
        }
    }

    async addVehicle(vehicleData) {
        try {
            await this.api.addVehicle(vehicleData);
            this.ui.showNotification('Veículo adicionado com sucesso!', 'success');
            await this.loadGarage(); // Recarrega a garagem para exibir o novo veículo
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    async removeVehicle(vehicleId) {
        // Encontra o nome do veículo para a mensagem de confirmação
        const vehicle = this.garagem.find(v => v._id === vehicleId);
        if (vehicle && confirm(`Deseja remover permanentemente "${vehicle.modelo}"?`)) {
            try {
                const result = await this.api.deleteVehicle(vehicleId);
                this.ui.showNotification(result.message, 'success');
                await this.loadGarage(); // Recarrega para remover da UI
            } catch (error) {
                this.ui.showNotification(error.message, 'error');
            }
        }
    }

    // ... (crie métodos para editar veículo, adicionar manutenção, etc.)
}