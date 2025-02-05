class EstacionamentoSystem {
    constructor() {
        this.veiculos = [];
        this.contadores = {
            reserva: 0,
            estacionado: 0,
            saida: 0,
            entregue: 0
        };
        // Configuração das tarifas por tipo de cliente
    this.tarifas = {
        avulso: {
            primeiros20min: 5.00,
            primeiraHora: 20.00,
            horaAdicional: 10.00,
            nome: "Avulso",
            tipoCobranca: "hora" // indica que cobra por hora
        },
        mensalista: {
            valorFixo: 380.00, // valor fixo mensal
            nome: "Mensalista",
            tipoCobranca: "fixo" // indica que é valor fixo
        },
        simone_scorsi: {
            primeiros20min: 4.00,
            primeiraHora: 25.00,
            horaAdicional: 8.00,
            nome: "Simone Scorsi",
            tipoCobranca: "hora"
        },
        bar_do_alemao: {
            primeiros20min: 10.00,
            primeiraHora: 10.00,
            horaAdicional: 10.00,
            nome: "Bar do Alemão",
            tipoCobranca: "hora"
        },
         lbs_adicionais: {
            primeiros20min: 5.00,
            primeiraHora: 20.00,
            horaAdicional: 10.00,
            nome: "LBS Adicionais",
            tipoCobranca: "hora"
        },
        excedente_bdi: {
            primeiros20min: 5.00,
            primeiraHora: 20.00,
            horaAdicional: 10.00,
            nome: "Excedente BDI",
            tipoCobranca: "hora"
        },
        condominio: {
            valorFixo: 0.00, // cortesia do condominio
            nome: "Condominio",
            tipoCobranca: "fixo" // indica que é valor fixo
        },
        diaria: {
            valorFixo: 50.00, // valor fixo
            nome: "Diaria",
            tipoCobranca: "fixo" // indica que é valor fixo
        },
        lavagem_70: {
            valorFixo: 70.00, // valor fixo
            nome: "Lavagem 70,00",
            tipoCobranca: "fixo" // indica que é valor fixo
        },
        lavagem_80: {
            valorFixo: 80.00, // valor fixo
            nome: "Lavagem 80,00",
            tipoCobranca: "fixo" // indica que é valor fixo
        },
        lavagem_90: {
            valorFixo:  80.00, // valor fixo
            nome: "Lavagem 90,00",
            tipoCobranca: "fixo" // indica que é valor fixo
        },
        lavagem_100: {
            valorFixo: 100.00, // valor fixo 
            nome: "Lavagem 100,00",
            tipoCobranca: "fixo" // indica que é valor fixo
        },

        };
        this.abaAtual = 'estacionado'; // Adicionar este controle
        this.init();
    }

    calcularValor(minutosTotais, tipoCliente) {
        const tarifa = this.tarifas[tipoCliente];
        
        // Se for tarifa fixa, retorna o valor fixo
        if (tarifa.tipoCobranca === 'fixo') {
            return tarifa.valorFixo;
        }
    
        // Para tarifas por hora
        let valor = 0;
        
        // Aqui você coloca a mesma lógica que usou no saida.js
        if (minutosTotais <= 20) {           // Primeiros 20 minutos
            valor = tarifa.primeiros20min;
        } else if (minutosTotais <= 60) {    // Até 1 hora
            valor = tarifa.primeiraHora;
        } else {                             // Após 1 hora
            const horasAdicionais = Math.ceil((minutosTotais - 60) / 60);
            valor = tarifa.primeiraHora + (horasAdicionais * tarifa.horaAdicional);
        }
        
        return valor;
    }

    // Se você quiser usar a versão com mais faixas de tempo, use este modelo:
    /*
    calcularValor(minutosTotais, tipoCliente) {
        const tarifa = this.tarifas[tipoCliente];
        
        if (tarifa.tipoCobranca === 'fixo') {
            return tarifa.valorFixo;
        }
    
        let valor = 0;
        
        if (minutosTotais <= 20) {           // Até 20 minutos
            valor = tarifa.primeiros20min;
        } else if (minutosTotais <= 30) {    // De 21 a 30 minutos
            valor = tarifa.ate30min;
        } else if (minutosTotais <= 60) {    // De 31 a 60 minutos
            valor = tarifa.primeiraHora;
        } else if (minutosTotais <= 120) {   // De 1 a 2 horas
            valor = tarifa.primeiraHora + tarifa.horaAdicional;
        } else {                             // Mais de 2 horas
            const horasAdicionais = Math.ceil((minutosTotais - 120) / 60);
            valor = tarifa.primeiraHora + tarifa.horaAdicional + 
                   (horasAdicionais * tarifa.demaisHoras);
        }
        
        return valor;
    }
    */

    init() {
        // Adiciona listeners apenas se os elementos existirem
        const parkBtn = document.querySelector('.park-btn');
        if (parkBtn) {
            parkBtn.addEventListener('click', () => this.mostrarFormularioEstacionamento());
        }
    
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.togglePesquisa());
        }
        
        // Adiciona botão de limpeza
        const limparBtn = document.createElement('button');
        limparBtn.textContent = 'Limpar Dados';
        limparBtn.style.position = 'fixed';
        limparBtn.style.top = '10px';
        limparBtn.style.right = '10px';
        limparBtn.style.zIndex = '9999';
        limparBtn.style.padding = '10px';
        limparBtn.style.backgroundColor = '#ff4444';
        limparBtn.style.color = 'white';
        limparBtn.style.border = 'none';
        limparBtn.style.borderRadius = '4px';
        limparBtn.style.cursor = 'pointer';
        limparBtn.addEventListener('click', () => this.limparDados());
        document.body.appendChild(limparBtn);
        
        this.carregarDadosSalvos();
        this.atualizarInterface();
    
        // Adicionar listeners para as abas
        for (const item of document.querySelectorAll('.status-item')) {
            item.addEventListener('click', (e) => {
                const label = e.currentTarget.querySelector('.label');
                if (label) {

                    const tipo = label.textContent.toLowerCase();
                    this.trocarAba(tipo);
                }
            });
        };
    }
    
    // Adicionar função togglePesquisa
    togglePesquisa() {
        // Implementação básica da pesquisa
        const searchOverlay = document.createElement('div');
        searchOverlay.className = 'search-overlay';
        searchOverlay.innerHTML = `
            <div class="search-container">
                <h3>Pesquisar Veículo</h3>
                <input type="text" id="searchInput" placeholder="Digite a placa">
                <div class="form-buttons">
                    <button class="cancel-btn" onclick="this.closest('.search-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(searchOverlay);
    
        const searchInput = searchOverlay.querySelector('#searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    const placa = searchInput.value.toUpperCase();
                    const veiculo = this.veiculos.find(v => v.placa === placa);
                    if (veiculo) {
                        // Se encontrar o veículo, mostra os detalhes
                        this.mostrarMensagem(`Veículo encontrado: ${veiculo.modelo}`, 'sucesso');
                        if (veiculo.status === 'estacionado') {
                            this.trocarAba('estacionado');
                        } else if (veiculo.status === 'finalizado') {
                            this.trocarAba('entregue');
                        }
                    } else {
                        this.mostrarMensagem('Veículo não encontrado');
                    }
                    searchOverlay.remove();
                }
            });
        }
    }
    
    trocarAba(tipo) {
        const tiposValidos = ['reserva', 'estacionado', 'saida', 'entregue'];
        if (!tiposValidos.includes(tipo)) {
            console.error('Tipo de aba inválido:', tipo);
            return;
        }
    
        this.abaAtual = tipo;
        
        // Atualiza as classes das abas
        const statusItems = document.querySelectorAll('.status-item');
        for (const item of statusItems) {
            const label = item.querySelector('.label');
            if (label) {
                const itemTipo = label.textContent.toLowerCase();
                if (itemTipo === tipo) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        }
        
        this.atualizarInterface();
    }


    limparDados() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            localStorage.clear();
            this.veiculos = [];
            this.contadores = {
                reserva: 0,
                estacionado: 0,
                saida: 0,
                entregue: 0
            };
            this.atualizarInterface();
            this.mostrarMensagem('Sistema reiniciado com sucesso!', 'sucesso');
        }
    }

    mostrarFormularioEstacionamento() {
        const html = `
             <div class="form-overlay" id="formOverlay">
            <div class="form-container">
                <h2>Registrar Veículo</h2>
                <input type="text" id="placa" placeholder="Placa" oninput="this.value = this.value.toUpperCase()" maxlength="7" required>
                <input type="text" id="modelo" placeholder="Modelo" required>
                <select id="tipo" required>
                    <option value="">Selecione o tipo</option>
                    <option value="avulso">Avulso</option>
                    <option value="mensalista">Mensalista</option>
                    <option value="diaria">Diaria</option>
                    <option value="bar_do_alemao">Bar do Alemão</option>
                    <option value="lavagem_70">Lavagem 70,00</option>
                    <option value="lavagem_80">Lavagem 80,00</option>
                    <option value="lavagem_90">Lavagem 90,00</option>
                    <option value="lavagem_100">Lavagem 100,00</option>
                </select>
                <select id="setor" required>
                    <option value="">Selecione o setor</option>
                    <option value="TER">TER</option>
                    <option value="SUB">SUB</option>
                    <option value="BAR">BAR</option>
                </select>
                <div class="form-buttons">
                    <button class="cancel-btn" id="cancelarBtn">Cancelar</button>
                    <button class="confirm-btn" id="confirmarBtn">Confirmar</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('cancelarBtn').addEventListener('click', () => {
            this.fecharFormulario();
        });

        document.getElementById('confirmarBtn').addEventListener('click', () => {
            this.registrarEntrada();
        });
    }

    fecharFormulario() {
        const overlay = document.getElementById('formOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    registrarEntrada() {
        const placa = document.getElementById('placa').value;
        const modelo = document.getElementById('modelo').value;
        const tipo = document.getElementById('tipo').value;
        const setor = document.getElementById('setor').value;
    
        if (!placa || !modelo || !tipo || !setor) {
            this.mostrarMensagem('Preencha todos os campos');
            return;
        }
    
        const veiculoExistente = this.veiculos.find(v => 
            v.placa === placa && v.status === 'estacionado'
        );
    
        if (veiculoExistente) {
            this.mostrarMensagem('Já existe um veículo com esta placa estacionado');
            return;
        }
    
        const numeroVaga = this.veiculos.length + 1;
    
        const novoVeiculo = {
            placa,
            modelo,
            tipo,
            setor,
            vaga: numeroVaga,
            status: 'estacionado',
            horaEntrada: new Date().toISOString(),
            id: Date.now()
        };
    
        this.veiculos.push(novoVeiculo);
        this.atualizarContadores(); // Adiciona esta linha para atualizar os contadores
        this.salvarDados();
        this.fecharFormulario();
        this.atualizarInterface();
        this.mostrarMensagem('Veículo registrado com sucesso!', 'sucesso');
    }

    carregarDadosSalvos() {
        const dados = localStorage.getItem('estacionamentoData');
        if (dados) {
            const dadosParsed = JSON.parse(dados);
            this.veiculos = dadosParsed.veiculos || [];
            this.atualizarContadores();
        }
    }

    atualizarContadores() {
        // Atualiza os contadores baseado no status atual dos veículos
        this.contadores = {
            reserva: this.veiculos.filter(v => v.status === 'reserva').length,
            estacionado: this.veiculos.filter(v => v.status === 'estacionado').length,
            saida: this.veiculos.filter(v => v.status === 'saida').length,
            entregue: this.veiculos.filter(v => v.status === 'finalizado').length
        };
    
        // Atualiza os números na interface
        const contadoresElements = document.querySelectorAll('.status-item .number');
        if (contadoresElements.length >= 4) {
            contadoresElements[0].textContent = this.contadores.reserva;
            contadoresElements[1].textContent = this.contadores.estacionado;
            contadoresElements[2].textContent = this.contadores.saida;
            contadoresElements[3].textContent = this.contadores.entregue;
        }
    }

    calcularTempoEstacionado(horaEntrada) {
        const entrada = new Date(horaEntrada);
        const agora = new Date();
        const diff = agora - entrada;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;
        return `${horas}h ${minutosRestantes}min`;
    }

    registrarSaida(placa) {
        const veiculo = this.veiculos.find(v => 
            v.placa === placa && 
            v.status === 'estacionado'
        );
    
        if (veiculo) {
            // Atualiza o status para 'saida'
            veiculo.status = 'saida';
            
            // Salva as alterações no localStorage
            this.salvarDados();
            
            // Atualiza os contadores e a interface
            this.atualizarContadores();
            this.atualizarInterface();
            
            // Redireciona para a página de saída
            window.location.href = `saida.html?placa=${placa}&id=${veiculo.id}`;
        }
    }
    salvarDados() {
        const dados = {
            veiculos: this.veiculos,
            contadores: this.contadores
        };
        localStorage.setItem('estacionamentoData', JSON.stringify(dados));
    }

    atualizarInterface() {
        // Atualiza os contadores
        const contadoresElements = document.querySelectorAll('.status-item .number');
        if (contadoresElements.length >= 4) {
            contadoresElements[0].textContent = this.contadores.reserva;
            contadoresElements[1].textContent = this.contadores.estacionado;
            contadoresElements[2].textContent = this.contadores.saida;
            contadoresElements[3].textContent = this.contadores.entregue;
        }
    
        // Atualiza a lista de veículos
        const listaElement = document.querySelector('.vehicle-list');
        if (!listaElement) return;
    
        // Mostra a lista apropriada baseada na aba atual
        if (this.abaAtual === 'estacionado') {
            this.mostrarVeiculosEstacionados(listaElement);
        } else if (this.abaAtual === 'saida') {
            this.mostrarVeiculosSaida(listaElement);
        } else if (this.abaAtual === 'entregue') {
            this.mostrarVeiculosEntregues(listaElement);
        }
    }

    mostrarVeiculosEstacionados(listaElement) { 
        const veiculosEstacionados = this.veiculos.filter(v => v.status === 'estacionado');
        
        if (veiculosEstacionados.length === 0) {
            listaElement.innerHTML = '<div class="vehicle-item"><p>Nenhum veículo estacionado</p></div>';
            return;
        }

        listaElement.innerHTML = veiculosEstacionados.map(veiculo => `
            <div class="vehicle-item">
                <div class="plate">${veiculo.placa}</div>
                <div class="details">
                    <span class="sector">Setor: ${veiculo.setor}</span>
                    <span class="spot">Vaga: ${veiculo.vaga}</span>
                </div>
                <div class="info">
                    <span class="model">Modelo: ${veiculo.modelo}</span>
                    <span class="type">Tipo: ${this.tarifas[veiculo.tipo].nome}</span>
                    <span class="time">Entrada: ${new Date(veiculo.horaEntrada).toLocaleTimeString('pt-BR')}</span>
                    <span class="duration">Tempo: ${this.calcularTempoEstacionado(veiculo.horaEntrada)}</span>
                </div>
                <button class="exit-btn" onclick="estacionamento.registrarSaida('${veiculo.placa}')">
                    Registrar Saída
                </button>
            </div>
        `).join('');
    }

    // Adicionar nova função para mostrar veículos em processo de saída
    mostrarVeiculosSaida(listaElement) { 
        // Filtra apenas os veículos com status 'saida'
        const veiculosSaida = this.veiculos.filter(v => v.status === 'saida');
        
        if (veiculosSaida.length === 0) {
            listaElement.innerHTML = '<div class="vehicle-item"><p>Nenhum veículo em processo de saída</p></div>';
            return;
        }
    
        // Atualiza o HTML com os veículos em saída
        listaElement.innerHTML = veiculosSaida.map(veiculo => `
            <div class="vehicle-item">
                <div class="plate">${veiculo.placa}</div>
                <div class="details">
                    <span class="sector">Setor: ${veiculo.setor}</span>
                    <span class="spot">Vaga: ${veiculo.vaga}</span>
                </div>
                <div class="info">
                    <span class="model">Modelo: ${veiculo.modelo}</span>
                    <span class="type">Tipo: ${this.tarifas[veiculo.tipo].nome}</span>
                    <span class="time">Entrada: ${new Date(veiculo.horaEntrada).toLocaleTimeString('pt-BR')}</span>
                    <span class="duration">Tempo: ${this.calcularTempoEstacionado(veiculo.horaEntrada)}</span>
                </div>
                <div class="actions">
                    <button class="confirm-exit-btn" onclick="window.location.href='saida.html?placa=${veiculo.placa}'">
                        Finalizar Saída
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Adicionar função para confirmar saída de veículo
    confirmarSaidaVeiculo(placa) {
        const veiculo = this.veiculos.find(v => v.placa === placa);
        if (veiculo) {
            window.location.href = `saida.html?placa=${placa}`;
        }
    }


    mostrarVeiculosEntregues(listaElement) {
        const veiculosEntregues = this.veiculos.filter(v => v.status === 'finalizado');
        
        if (veiculosEntregues.length === 0) {
            listaElement.innerHTML = '<div class="vehicle-item"><p>Nenhum veículo entregue</p></div>';
            return;
        }

        listaElement.innerHTML = veiculosEntregues.map(veiculo => `
            <div class="vehicle-item">
                <div class="plate">${veiculo.placa}</div>
                <div class="details">
                    <span class="sector">Setor: ${veiculo.setor}</span>
                    <span class="spot">Vaga: ${veiculo.vaga}</span>
                </div>
                <div class="info">
                    <span class="model">Modelo: ${veiculo.modelo}</span>
                    <span class="type">Tipo: ${this.tarifas[veiculo.tipo].nome}</span>
                    <span class="time">Entrada: ${new Date(veiculo.horaEntrada).toLocaleTimeString('pt-BR')}</span>
                    <span class="time">Saída: ${new Date(veiculo.horaSaida).toLocaleTimeString('pt-BR')}</span>
                    <span class="payment">Valor Pago: R$ ${veiculo.valorPago.toFixed(2)}</span>
                    <span class="payment-method">Forma de Pagamento: ${this.formatarFormaPagamento(veiculo.formaPagamento)}</span>
                    ${veiculo.observacoes ? `<span class="obs">Obs: ${veiculo.observacoes}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    formatarFormaPagamento(forma) {
        const formatos = {
            'dinheiro': 'Dinheiro',
            'cartao': 'Cartão',
            'pix': 'PIX'
        };
        return formatos[forma] || forma;
    }


    mostrarMensagem(texto, tipo = 'erro') {
        const div = document.createElement('div');
        div.className = `mensagem ${tipo}`;
        div.textContent = texto;
        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, 3000);
    }
}

// Inicializa o sistema
const estacionamento = new EstacionamentoSystem();
