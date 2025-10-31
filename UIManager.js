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
        this.weatherResultDiv = document.getElementById('previsao-tempo-resultado');
        // ... adicione outros elementos importantes aqui
        this.notificationTimeout = null;
        
        this.generalTipsDiv = document.getElementById('dicas-gerais-resultado');
        this.specificTipsDiv = document.getElementById('dicas-especificas-resultado');
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
            this.listaVeiculosDiv.innerHTML = '<p class="empty-garage">Garagem vazia. Adicione um veículo!</p>';
            return;
        }
        
        // Crie uma imagem padrão na sua pasta de imagens, por exemplo 'img/placeholder.png'
        const placeholderImg = './img/placeholder.png';

        garagem.sort((a, b) => a.modelo.localeCompare(b.modelo));
        garagem.forEach(veiculo => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'vehicle-item';
            itemDiv.dataset.id = veiculo._id; 
            
            const imageUrl = veiculo.imagemUrl || placeholderImg;

            itemDiv.innerHTML = `
                <img src="${imageUrl}" alt="Imagem de ${veiculo.modelo}" class="vehicle-list-image" onerror="this.src='${placeholderImg}'">
                <div class="vehicle-info">
                    <strong>${veiculo.modelo}</strong>
                    <span>(${veiculo.tipoVeiculo} - ${veiculo.cor})</span>
                </div>
                <div class="actions">
                    <button class="details-btn" data-id="${veiculo._id}"><i class="fas fa-eye"></i> Detalhes</button>
                    <button class="remove-btn warning" data-id="${veiculo._id}"><i class="fas fa-trash-alt"></i> Remover</button>
                </div>
            `;
            this.listaVeiculosDiv.appendChild(itemDiv);
        });
    }
    
    // =================== UIManager.js (Método showNotification CORRIGIDO) ===================
showNotification(message, type = 'info', duration = 5000) {
    // Limpa classes antigas para evitar acúmulo
    this.notificationDiv.className = '';
    this.notificationDiv.textContent = message;

    // Adiciona as classes necessárias
    this.notificationDiv.classList.add('notificacao-popup', type, 'show');

    clearTimeout(this.notificationTimeout);
    if (duration > 0) {
        this.notificationTimeout = setTimeout(() => {
            this.notificationDiv.classList.remove('show');
        }, duration);
    }
}



// Adicione estes métodos no final da classe UIManager
    renderWeatherLoading(city) {
        if (!this.weatherResultDiv) return;
        this.weatherResultDiv.style.display = 'block';
        this.weatherResultDiv.innerHTML = `<p class="loading"><i class="fas fa-spinner fa-spin"></i> Buscando previsão para ${city}...</p>`;
    }

    renderWeatherSuccess(data) {
        if (!this.weatherResultDiv) return;

        const cityName = data.city?.name || 'a cidade';
        
        // Agrupa as previsões por dia, pegando a primeira de cada dia para simplificar
        const dailyForecasts = Object.values(data.list.reduce((acc, item) => {
            const date = item.dt_txt.split(' ')[0];
            if (!acc[date]) acc[date] = item;
            return acc;
        }, {})).slice(0, 5); // Limita a 5 dias

        let html = `<h4>Previsão para ${cityName}</h4><div class="forecast-container">`;
        dailyForecasts.forEach(day => {
            const dateObj = new Date(day.dt_txt);
            const description = day.weather[0].description;
            html += `
                <div class="forecast-day-card">
                    <p class="forecast-date"><strong>${dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</strong></p>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${description}" class="weather-icon-forecast">
                    <p class="forecast-description">${description.charAt(0).toUpperCase() + description.slice(1)}</p>
                    <p class="forecast-temp"><i class="fas fa-temperature-high"></i> ${Math.round(day.main.temp_max)}°C</p>
                </div>
            `;
        });
        html += `</div>`;
        this.weatherResultDiv.innerHTML = html;
    }

    renderWeatherError(message) {
        if (!this.weatherResultDiv) return;
        this.weatherResultDiv.style.display = 'block';
        this.weatherResultDiv.innerHTML = `<p class="error"><i class="fas fa-exclamation-circle"></i>UImanager.js 122 Erro: ${message}</p>`;
    }



    








      renderTipsLoading(containerDiv) {
        if (!containerDiv) return;
        containerDiv.style.display = 'block';
        containerDiv.innerHTML = `<p class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando dicas...</p>`;
    }

    renderTipsSuccess(tips, containerDiv, title) {
        if (!containerDiv) return;
        containerDiv.style.display = 'block';
        
        let tipsHtml = `<h4>${title}</h4><ul>`;
        if (tips && tips.length > 0) {
            tips.forEach(item => {
                tipsHtml += `<li>${item.dica}</li>`;
            });
        } else {
            tipsHtml += `<li>Nenhuma dica encontrada.</li>`;
        }
        tipsHtml += `</ul>`;
        containerDiv.innerHTML = tipsHtml;
    }

    renderTipsError(message, containerDiv) {
        if (!containerDiv) return;
        containerDiv.style.display = 'block';
        containerDiv.innerHTML = `<p class="error"><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
    }
}