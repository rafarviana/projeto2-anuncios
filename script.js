document.addEventListener('DOMContentLoaded', () => {
    // Rola a página para o topo imediatamente após o DOM ser carregado
    // Garante que a página sempre comece do topo
    window.scrollTo(0, 0);

    // REMOVIDOS OS ARRAYS allBairros e allServicos daqui, pois serão populados dinamicamente

    // Referência ao elemento da mensagem
    const filterMessageElement = document.getElementById('filter-message');
    const adsSection = document.getElementById('ads-section'); // Referência à seção de anúncios
    const mainHeader = document.getElementById('main-header'); // Referência ao cabeçalho principal

    // Flag para controlar se a rolagem já ocorreu na carga inicial
    let hasScrolledOnLoad = false; // Esta variável não é mais usada neste contexto, mas mantida caso outras partes do código a usem.

    // Função para ajustar o 'top' dos títulos de seção dinamicamente
    function adjustSectionTitlePosition() {
        const sectionTitles = document.querySelectorAll('h2'); 
        
        if (mainHeader && sectionTitles.length > 0) {
            const headerHeight = mainHeader.offsetHeight; 
            sectionTitles.forEach(h2 => {
                h2.style.top = `${headerHeight}px`; 
            });
            // Define a variável CSS customizada para scroll-padding-top
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
        }
    }

    adjustSectionTitlePosition();
    window.addEventListener('resize', adjustSectionTitlePosition);

    // --- Shuffle Array Function (Para randomizar o carrossel de destaques) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // ES6 swap
        }
    }

    function setupCarousel(carouselId) {
        const carouselTrack = document.getElementById(`${carouselId}-track`);
        if (!carouselTrack) return; // Adicionado null check
        // Armazena os itens originais APENAS na primeira vez que a função é chamada
        if (!carouselTrack._originalItems) { 
            carouselTrack._originalItems = Array.from(carouselTrack.children);
        }
        let carouselItemsOriginal = carouselTrack._originalItems;
        let currentIndex = 0;
        let intervalId;
        const scrollSpeed = 3000;
        const itemGap = 10; 

        // --- Touch/Swipe Variables ---
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        const swipeThreshold = 50; // Pixels para acionar um swipe

        function initializeCarouselItems() {
            carouselTrack.innerHTML = ''; // Limpa o track antes de adicionar os itens
            
            if (carouselItemsOriginal.length > 0) {
                // Adiciona os itens originais primeiro
                carouselItemsOriginal.forEach(item => carouselTrack.appendChild(item.cloneNode(true)));
                
                // Adiciona clones para loop infinito
                const numItemsToClone = carouselItemsOriginal.length * 3; 
                for (let i = 0; i < numItemsToClone; i++) {
                    const clone = carouselItemsOriginal[i % carouselItemsOriginal.length].cloneNode(true);
                    carouselTrack.appendChild(clone);
                }
            }
        }

        if (carouselId === 'destaques') { // Apenas embaralha o carrossel 'destaques'
            // Embaralha os itens originais antes de cloná-los para a inicialização
            shuffleArray(carouselTrack._originalItems);
        }
        initializeCarouselItems();
        let allCarouselItems = Array.from(carouselTrack.children);

        function updateCarousel(smooth = true) {
            let itemsPerView;
            const carouselContainer = carouselTrack.parentElement;
            const containerWidth = carouselContainer.clientWidth;
            
            // Determine itemsPerView based on current window width
            if (window.innerWidth >= 2560) {
                itemsPerView = 5;
            } else if (window.innerWidth >= 1440) {
                itemsPerView = 4;
            } else if (window.innerWidth >= 1024) {
                itemsPerView = 3;
            } else if (window.innerWidth >= 768) {
                itemsPerView = 2;
            } else { // For smaller screens including 320px to 424px
                itemsPerView = 1;
            }

            // NOVO CÁLCULO PARA itemWidthCalc
            let itemWidthCalc;
            if (itemsPerView === 1) {
                // Para 1 item por vez, o item deve ter a largura total do container
                // O padding interno do item já é tratado pelo box-sizing: border-box;
                itemWidthCalc = `100%`;
            } else {
                // Calcula a largura para múltiplos itens, considerando os gaps
                const totalGapWidthForItems = itemGap * (itemsPerView - 1);
                const availableWidthForItems = containerWidth - totalGapWidthForItems;
                const individualItemWidth = availableWidthForItems / itemsPerView;
                // Não subtrai o padding aqui, pois o box-sizing: border-box; já o inclui
                itemWidthCalc = `${individualItemWidth}px`; 
            }
            
            allCarouselItems.forEach(item => {
                item.style.minWidth = itemWidthCalc;
                item.style.maxWidth = itemWidthCalc; // Adicionado para garantir que não exceda
                item.style.flexBasis = itemWidthCalc; // Adicionado para melhor controle em flexbox
            });

            // Recalculate slideFullWidthToTranslate to ensure accuracy
            // Usar offsetWidth do primeiro item (que já terá a largura ajustada pelo CSS via JS)
            const slideFullWidthToTranslate = (allCarouselItems.length > 0) ? (allCarouselItems[0].offsetWidth + itemGap) : 0;
            
            carouselTrack.style.transition = smooth ? `transform 0.5s ease-in-out` : `none`;
            carouselTrack.style.transform = `translateX(-${currentIndex * slideFullWidthToTranslate}px)`;

            const totalOriginalItems = carouselTrack._originalItems.length; // Usa os itens originais armazenados
            // Reset do carrossel para o início sem transição quando atinge o final dos itens originais
            if (currentIndex >= totalOriginalItems) {
                setTimeout(() => {
                    carouselTrack.style.transition = 'none';
                    currentIndex = 0; 
                    carouselTrack.style.transform = `translateX(0px)`;
                    carouselTrack.offsetWidth; // Força o reflow para aplicar a transição 'none'
                    carouselTrack.style.transition = `transform 0.5s ease-in-out`; // Retorna a transição
                }, smooth ? 500 : 0); 
            } else if (currentIndex < 0) { // Lida com o retrocesso além do início
                setTimeout(() => {
                    carouselTrack.style.transition = 'none';
                    currentIndex = totalOriginalItems - 1; // Vai para a posição do último item original
                    carouselTrack.style.transform = `translateX(-${currentIndex * slideFullWidthToTranslate}px)`;
                    carouselTrack.offsetWidth; // Força o reflow
                    carouselTrack.style.transition = 'transform 0.5s ease-in-out';
                }, smooth ? 500 : 0);
            }
        }

        function nextSlide() {
            currentIndex++; 
            updateCarousel(); 
        }

        function prevSlide() { // Nova função para retroceder
            currentIndex--;
            updateCarousel();
        }

        function startAutoScroll() {
            clearInterval(intervalId);
            // Só inicia o auto-scroll se houver mais de um item original
            if (carouselItemsOriginal.length > 1) {
                intervalId = setInterval(nextSlide, scrollSpeed);
            }
        }

        carouselTrack.parentElement.addEventListener('mouseenter', () => clearInterval(intervalId));
        carouselTrack.parentElement.addEventListener('mouseleave', startAutoScroll);

        // --- Touch Event Listeners ---
        carouselTrack.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            carouselTrack.style.transition = 'none'; // Desabilita a transição durante o arrasto
            clearInterval(intervalId); // Para o auto-scroll
        });

        carouselTrack.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            const slideFullWidthToTranslate = (allCarouselItems.length > 0) ? (allCarouselItems[0].offsetWidth + itemGap) : 0;
            // Aplica o arrasto visual imediato
            carouselTrack.style.transform = `translateX(${diff - (currentIndex * slideFullWidthToTranslate)}px)`;
        });

        carouselTrack.addEventListener('touchend', () => {
            isDragging = false;
            const diff = currentX - startX;
            if (Math.abs(diff) > swipeThreshold) {
                if (diff < 0) { // Deslizou para a esquerda
                    nextSlide();
                } else { // Deslizou para a direita
                    prevSlide();
                }
            } else {
                // Se não for um deslizamento significativo, volta para o item atual
                updateCarousel(); // Reaplica a transformação correta com transição suave
            }
            startAutoScroll(); // Retoma o auto-scroll
        });

        window.addEventListener('resize', () => {
            clearInterval(intervalId); 
            initializeCarouselItems(); // Recreate DOM elements
            allCarouselItems = Array.from(carouselTrack.children); // Update allCarouselItems
            currentIndex = 0; // Reset index
            updateCarousel(false); // Update position without animation
            startAutoScroll();
        });

        // Inicialização do carrossel
        currentIndex = 0; 
        carouselTrack.style.transform = `translateX(0px)`; 
        updateCarousel(false); // Chama com smooth=false para evitar transição na carga inicial
        startAutoScroll();
    }

    setupCarousel('destaques');
    setupCarousel('pontos-turisticos');

    // --- Lógica para Mini-Carrosséis dentro dos Anúncios com Rolagem Automática em Loop Infinito ---
    document.querySelectorAll('.ad-item').forEach(adItem => {
        const miniCarouselTrack = adItem.querySelector('.mini-carousel-track');
        if (!miniCarouselTrack) return; 

        let miniCarouselSlidesOriginal = Array.from(miniCarouselTrack.children);
        let currentMiniIndex = 0;
        let miniIntervalId;
        const miniScrollSpeed = 2500;
        const miniItemGap = 3;

        // --- Touch/Swipe Variables for Mini-Carousels ---
        let miniStartX = 0;
        let miniCurrentX = 0;
        let miniIsDragging = false;
        const miniSwipeThreshold = 30; // Limiar menor para carrosséis menores

        function initializeMiniCarouselSlides() {
            miniCarouselTrack.innerHTML = ''; 
            // Só adiciona clones se houver mais de uma imagem
            if (miniCarouselSlidesOriginal.length > 1) {
                miniCarouselSlidesOriginal.forEach(item => miniCarouselTrack.appendChild(item.cloneNode(true)));
                const numClonesMini = miniCarouselSlidesOriginal.length * 3;
                for (let i = 0; i < numClonesMini; i++) {
                    const clone = miniCarouselSlidesOriginal[i % miniCarouselSlidesOriginal.length].cloneNode(true);
                    miniCarouselTrack.appendChild(clone);
                }
            } else {
                // Se for apenas 1 imagem, adiciona apenas o original
                miniCarouselSlidesOriginal.forEach(item => miniCarouselTrack.appendChild(item.cloneNode(true)));
            }
        }

        initializeMiniCarouselSlides(); 

        let allMiniCarouselSlides = Array.from(miniCarouselTrack.children);

        function updateMiniCarousel(smooth = true) {
            // Se houver apenas uma imagem, não faz transição e mantém no lugar
            if (miniCarouselSlidesOriginal.length <= 1) {
                miniCarouselTrack.style.transition = 'none';
                miniCarouselTrack.style.transform = `translateX(0px)`;
                return; // Sai da função
            }

            const slideFullWidthToTranslate = (allMiniCarouselSlides.length > 0) ? (allMiniCarouselSlides[0].offsetWidth + miniItemGap) : 0;
            
            miniCarouselTrack.style.transition = smooth ? `transform 0.5s ease-in-out` : `none`;
            miniCarouselTrack.style.transform = `translateX(-${currentMiniIndex * slideFullWidthToTranslate}px)`;

            const totalOriginalMiniSlides = miniCarouselSlidesOriginal.length;
            if (currentMiniIndex >= totalOriginalMiniSlides) {
                setTimeout(() => {
                    miniCarouselTrack.style.transition = 'none';
                    currentMiniIndex = 0;
                    miniCarouselTrack.style.transform = `translateX(0px)`;
                    miniCarouselTrack.offsetWidth; 
                    miniCarouselTrack.style.transition = 'transform 0.5s ease-in-out';
                }, smooth ? 500 : 0);
            } else if (currentMiniIndex < 0) { // Lida com o retrocesso além do início
                setTimeout(() => {
                    miniCarouselTrack.style.transition = 'none';
                    currentMiniIndex = totalOriginalMiniSlides - 1;
                    miniCarouselTrack.style.transform = `translateX(-${currentMiniIndex * slideFullWidthToTranslate}px)`;
                    miniCarouselTrack.offsetWidth;
                    miniCarouselTrack.style.transition = 'transform 0.5s ease-in-out';
                }, smooth ? 500 : 0);
            }
        }

        function nextMiniSlide() {
            currentMiniIndex++;
            updateMiniCarousel();
        }

        function prevMiniSlide() { // Nova função para mini-carrosséis
            currentMiniIndex--;
            updateMiniCarousel();
        }

        function startMiniAutoScroll() {
            clearInterval(miniIntervalId);
            // Só inicia o auto-scroll se houver mais de uma imagem original
            if (miniCarouselSlidesOriginal.length > 1) {
                miniIntervalId = setInterval(nextMiniSlide, miniScrollSpeed);
            }
        }

        // --- Touch Event Listeners for Mini-Carousels ---
        miniCarouselTrack.addEventListener('touchstart', (e) => {
            // Só permite arrastar se houver mais de uma imagem
            if (miniCarouselSlidesOriginal.length <= 1) return;
            miniIsDragging = true;
            miniStartX = e.touches[0].clientX;
            miniCarouselTrack.style.transition = 'none';
            clearInterval(miniIntervalId);
        });

        miniCarouselTrack.addEventListener('touchmove', (e) => {
            if (!miniIsDragging || miniCarouselSlidesOriginal.length <= 1) return;
            miniCurrentX = e.touches[0].clientX;
            const diff = miniCurrentX - miniStartX;
            const slideFullWidthToTranslate = (allMiniCarouselSlides.length > 0) ? (allMiniCarouselSlides[0].offsetWidth + miniItemGap) : 0;
            miniCarouselTrack.style.transform = `translateX(${diff - (currentMiniIndex * slideFullWidthToTranslate)}px)`;
        });

        miniCarouselTrack.addEventListener('touchend', () => {
            if (miniCarouselSlidesOriginal.length <= 1) return; // Sai se for apenas 1 imagem
            miniIsDragging = false;
            const diff = miniCurrentX - miniStartX;
            if (Math.abs(diff) > miniSwipeThreshold) {
                if (diff < 0) { // Deslizou para a esquerda
                    nextMiniSlide();
                } else { // Deslizou para a direita
                    prevMiniSlide();
                }
            } else {
                updateMiniCarousel();
            }
            startMiniAutoScroll();
        });


        currentMiniIndex = 0; 
        miniCarouselTrack.style.transform = `translateX(0px)`; 
        updateMiniCarousel(false); 
        startMiniAutoScroll();
    });

    // --- Lógica dos Filtros (Popula e aplica) ---
    const bairroFilter = document.getElementById('bairro-filter');
    const servicoFilter = document.getElementById('servico-filter');
    const clearFilterBtn = document.getElementById('clear-filter-btn'); 
    const adItems = document.querySelectorAll('.ad-item');

    // Mapeamento de chaves para nomes amigáveis (pode ser expandido conforme necessário)
    // Se um 'data-bairro' ou 'data-servico' não estiver aqui, ele será exibido como está no HTML.
    const friendlyNames = {
        "campo redondo": "Campo Redondo",
        "vila-niteroi": "Vila Niterói",
        "centro": "Centro",
        "comerciarios": "Comerciários",
        "restaurante": "Restaurante",
        "hospedagem": "Hospedagem",
        "loja": "Loja",
        "lazer": "Lazer",
        "pousadas": "Pousadas" // Exemplo de como adicionar um nome amigável para "Pousadas"
    };

    function getFriendlyName(key) {
        // Retorna o nome amigável se existir, senão formata a chave
        if (friendlyNames[key]) {
            return friendlyNames[key];
        }
        // Converte kebab-case ou snake_case para Title Case e substitui hífens/underscores por espaços
        return key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function populateFilters() {
        const availableBairros = new Set();
        const availableServicos = new Set();

        adItems.forEach(item => {
            if (item.dataset.bairro) {
                // Normaliza para lowercase antes de adicionar ao Set
                availableBairros.add(item.dataset.bairro.toLowerCase()); 
            }
            if (item.dataset.servico) {
                // Normaliza para lowercase antes de adicionar ao Set
                availableServicos.add(item.dataset.servico.toLowerCase()); 
            }
        });

        // Limpa e popula o filtro de bairros
        bairroFilter.innerHTML = ''; 
        const optionAllBairro = document.createElement('option');
        optionAllBairro.value = "todos";
        optionAllBairro.textContent = "Todos os Bairros";
        bairroFilter.appendChild(optionAllBairro); 
        // Converte o Set para Array, ordena alfabeticamente e adiciona as opções
        Array.from(availableBairros).sort().forEach(bairroKey => {
            const option = document.createElement('option');
            option.value = bairroKey;
            option.textContent = getFriendlyName(bairroKey); 
            bairroFilter.appendChild(option);
        });
        
        // Limpa e popula o filtro de serviços
        servicoFilter.innerHTML = ''; 
        const optionAllServico = document.createElement('option');
        optionAllServico.value = "todos";
        optionAllServico.textContent = "Todos os Serviços";
        servicoFilter.appendChild(optionAllServico); 
        // Converte o Set para Array, ordena alfabeticamente e adiciona as opções
        Array.from(availableServicos).sort().forEach(servicoKey => {
            const option = document.createElement('option');
            option.value = servicoKey;
            option.textContent = getFriendlyName(servicoKey); 
            servicoFilter.appendChild(option);
        });
    }


    function applyFilters(event, isInitialLoad = false) { 
        const selectedBairro = bairroFilter.value;
        const selectedServico = servicoFilter.value;
        let visibleCount = 0;

        adItems.forEach(item => {
            // Normaliza os valores do dataset para minúsculas para comparação
            const itemBairro = item.dataset.bairro ? item.dataset.bairro.toLowerCase() : '';
            const itemServico = item.dataset.servico ? item.dataset.servico.toLowerCase() : '';

            const matchesBairro = (selectedBairro === 'todos' || selectedBairro === itemBairro);
            const matchesServico = (selectedServico === 'todos' || selectedServico === itemServico);

            if (matchesBairro && matchesServico) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Atualiza a mensagem do filtro
        updateFilterMessage(selectedBairro, selectedServico, visibleCount); 

        // Rolagem suave para a seção de anúncios SE NÃO for a carga inicial
        // e SE houver resultados ou algum filtro estiver ativo.
        if (!isInitialLoad && (visibleCount > 0 || selectedBairro !== 'todos' || selectedServico !== 'todos')) {
            const adsSectionRect = adsSection.getBoundingClientRect();
            const isAdsSectionVisible = (
                adsSectionRect.top >= 0 &&
                adsSectionRect.left >= 0 &&
                adsSectionRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                adsSectionRect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );

            // Rola para a seção de anúncios apenas se ela não estiver visível na tela
            if (!isAdsSectionVisible) {
                 adsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    function updateFilterMessage(selectedBairro, selectedServico, count) {
        let message = "";

        // Só mostra a mensagem se pelo menos um filtro estiver ativo ou se não houver resultados
        if (selectedBairro !== 'todos' || selectedServico !== 'todos' || count === 0) { // Modificação aqui: Adicionado 'count === 0'
            // Usar getFriendlyName para exibir nomes bonitos na mensagem
            let bairroText = (selectedBairro !== 'todos') ? getFriendlyName(selectedBairro) : "";
            let servicoText = (selectedServico !== 'todos') ? getFriendlyName(selectedServico) : "";

            if (count === 0) {
                message = "Não encontramos nenhum parceiro com os filtros selecionados.";
            } else if (selectedBairro !== 'todos' && selectedServico === 'todos') {
                message = `Aqui estão nossos parceiros no **${bairroText}**: **${count}** encontrado(s).`; // Modificado
            } else if (selectedBairro === 'todos' && selectedServico !== 'todos') {
                message = `Aqui estão nossos parceiros para **${servicoText}**: **${count}** encontrado(s).`; // Modificado
            } else { // Ambos os filtros estão ativos e há resultados
                message = `Aqui estão nossos parceiros para **${servicoText}** no **${bairroText}**: **${count}** encontrado(s).`; // Modificado
            }
        }
        
        filterMessageElement.innerHTML = message; 
    }

    // Função para limpar os filtros
    function clearFilters() {
        bairroFilter.value = 'todos';
        servicoFilter.value = 'todos';
        applyFilters(); 
    }

    // Inicializa os filtros e aplica-os
    if (bairroFilter && servicoFilter) {
        populateFilters(); 
        bairroFilter.addEventListener('change', applyFilters);
        servicoFilter.addEventListener('change', applyFilters);
        clearFilterBtn.addEventListener('click', clearFilters); 
        
        // Chama applyFilters na carga inicial, passando 'true' para isInitialLoad
        applyFilters(null, true); 
    }
});