class SaidaSystem {
    constructor() {
        this.veiculos = [];
        this.veiculoAtual = null;
        this.tarifas = {

             // Aqui é onde você configura todas as tarifas
            avulso: {
                primeiros20min: 5.00,
                primeiraHora: 20.00,
                horaAdicional: 10.00,
                nome: "Avulso",
                tipoCobranca: "hora"
            },
            mensalista: {
                valorFixo: 380.00,
                nome: "Mensalista",
                tipoCobranca: "fixo"
            },
            simone_scorsi: {
                primeiros20min: 5.00,
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
                valorFixo: 50.00,
                nome: "Diaria",
                tipoCobranca: "fixo"

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
                valorFixo: 90.00, // valor fixo
                nome: "Lavagem 80,00",
                tipoCobranca: "fixo" // indica que é valor fixo
            },
            lavagem_100: {
                valorFixo: 100.00, // valor fixo
                nome: "Lavagem 80,00",
                tipoCobranca: "fixo" // indica que é valor fixo
            },
        };
        this.init();
    }

    init() {
        this.carregarDados();
        
        const urlParams = new URLSearchParams(window.location.search);
        const placa = urlParams.get('placa');
        
        if (placa) {
            this.buscarVeiculo(placa);
        }

        const inputBusca = document.getElementById('placaBusca');
        if (inputBusca) {
            inputBusca.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.buscarVeiculo(e.target.value);
                }
            });
        }

        this.atualizarHora();
        setInterval(() => this.atualizarHora(), 1000);
    }

    carregarDados() {
        const dados = localStorage.getItem('estacionamentoData');
        if (dados) {
            const dadosParsed = JSON.parse(dados);
            this.veiculos = dadosParsed.veiculos || [];
        }
    }

    buscarVeiculo(placaOriginal) {
        if (!placaOriginal) {
            this.mostrarMensagem('Digite uma placa para buscar');
            return;
        }

        const placaNormalizada = placaOriginal.toUpperCase();
        const veiculo = this.veiculos.find(v => 
            v.placa === placaNormalizada && 
            v.status === 'saida'
        );

        if (veiculo) {
            this.veiculoAtual = veiculo;
            this.mostrarDetalhesVeiculo(veiculo);
        } else {
            this.mostrarMensagem('Veículo não encontrado');
        }
    }

    mostrarDetalhesVeiculo(veiculo) {
        const tarifa = this.tarifas[veiculo.tipo];
        const agora = new Date();
        const tempoEstacionado = this.calcularTempoEstacionado(
            new Date(veiculo.horaEntrada), 
            agora
        );
        const valor = this.calcularValor(tempoEstacionado.minutosTotais, veiculo.tipo);
    
        const detalhesHTML = `
            <div class="detalhes-veiculo">
                <h3>Detalhes do Veículo</h3>
                <p><strong>Placa:</strong> ${veiculo.placa}</p>
                <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
                <p><strong>Tipo:</strong> <span id="tipoAtual">${tarifa.nome}</span></p>
                <p><strong>Setor:</strong> ${veiculo.setor}</p>
                <p><strong>Vaga:</strong> ${veiculo.vaga}</p>
                <p><strong>Entrada:</strong> ${new Date(veiculo.horaEntrada).toLocaleTimeString('pt-BR')}</p>
                <p><strong>Tempo:</strong> ${tempoEstacionado.texto}</p>
                <p><strong>Valor:</strong> <span id="valorAtual">R$ ${valor.toFixed(2)}</span></p>
                ${tarifa.tipoCobranca === 'fixo' ? '<p><em>(Valor Fixo)</em></p>' : ''}
            </div>
            <div class="form-group">
                <label for="novoTipo">Alterar Tipo:</label>
                <select id="novoTipo">
                    <option value="">Manter Atual</option>
                    <option value="avulso">Avulso</option>
                    <option value="bar_do_alemao">Bar do Alemão</option>
                    <option value="diaria">Diaria</option>
                    <option value="lbs_adicionais">LBS Adicionais</option>
                    <option value="simone_scorsi">Simone Scorsi</option>
                    <option value="excedente_bdi">Excedente BDI</option>
                    <option value="condominio">Condominio</option>
                    <option value="lavagem_70">Lavagem 70,00</option>
                    <option value="lavagem_80">Lavagem 80,00</option>
                    <option value="lavagem_90">Lavagem 90,00</option>
                    <option value="lavagem_100">Lavagem 100,00</option>
                </select>
            </div>
            <div class="form-group">
                <label for="formaPagamento">Forma de Pagamento:</label>
                <select id="formaPagamento" required>
                    <option value="">Selecione</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="pix">PIX</option>
                </select>
            </div>
            <div class="form-group">
                <label for="observacoes">Observações:</label>
                <textarea id="observacoes"></textarea>
            </div>
            <button onclick="saidaSystem.confirmarSaida()" class="confirm-btn">Confirmar Saída</button>
        `;
    
        const detalhesContainer = document.querySelector('.detalhes-container');
        if (detalhesContainer) {
            detalhesContainer.innerHTML = detalhesHTML;
        }
    
        // Atualiza o tipo selecionado no select e recalcula o valor
        const novoTipoSelect = document.getElementById('novoTipo');
        if (novoTipoSelect) {
            novoTipoSelect.addEventListener('change', () => {
                const novoTipo = novoTipoSelect.value;
                if (novoTipo) {
                    const novoTarifa = this.tarifas[novoTipo];
                    const novoValor = this.calcularValor(tempoEstacionado.minutosTotais, novoTipo);
                    
                    // Atualiza o tipo exibido
                    const tipoAtualElement = document.getElementById('tipoAtual');
                    if (tipoAtualElement) {
                        tipoAtualElement.textContent = novoTarifa.nome;
                    }
                    
                    // Atualiza o valor exibido
                    const valorAtualElement = document.getElementById('valorAtual');
                    if (valorAtualElement) {
                        valorAtualElement.textContent = `R$ ${novoValor.toFixed(2)}`;
                    }
                    
                    // Atualiza o tipo do veículo atual
                    this.veiculoAtual.tipo = novoTipo;
                }
            });
        }
    }

    calcularTempoEstacionado(entrada, saida) {
        const diff = saida - entrada;
        const minutosTotais = Math.floor(diff / (1000 * 60));
        const horas = Math.floor(minutosTotais / 60);
        const minutos = minutosTotais % 60;
        
        return {
            horas,
            minutos,
            minutosTotais,
            texto: `${horas}h ${minutos}min`
        };
    }

    calcularValor(minutosTotais, tipoCliente) {
        const tarifa = this.tarifas[tipoCliente];
        
        // Se for tarifa fixa, retorna o valor fixo
        if (tarifa.tipoCobranca === 'fixo') {
            return tarifa.valorFixo;
        }
    
        // Para tarifas por hora
        let valor = 0;
        // Aqui você pode modificar os intervalos de tempo
        // Se for criar novas faixas de tempo, lembre-se de adicionar as respectivas tarifas no objeto tarifas:
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

    confirmarSaida() {
        if (!this.veiculoAtual) {
            this.mostrarMensagem('Nenhum veículo selecionado');
            return;
        }

        const formaPagamento = document.getElementById('formaPagamento').value;
        if (!formaPagamento) {
            this.mostrarMensagem('Selecione uma forma de pagamento');
            return;
        }

        try {
            const dadosAtuais = JSON.parse(localStorage.getItem('estacionamentoData')) || {};
            const veiculos = dadosAtuais.veiculos || [];
            const veiculoIndex = veiculos.findIndex(v => 
                v.placa === this.veiculoAtual.placa && 
                v.status === 'saida'
            );

            if (veiculoIndex !== -1) {
                const tempoEstacionado = this.calcularTempoEstacionado(
                    new Date(this.veiculoAtual.horaEntrada), 
                    new Date()
                );
                const valorTotal = this.calcularValor(
                    tempoEstacionado.minutosTotais, 
                    this.veiculoAtual.tipo
                );

                veiculos[veiculoIndex] = {
                    ...veiculos[veiculoIndex],
                    status: 'finalizado',
                    horaSaida: new Date().toISOString(),
                    formaPagamento: formaPagamento,
                    valorPago: valorTotal,
                    observacoes: document.getElementById('observacoes').value
                };

                dadosAtuais.veiculos = veiculos;
                localStorage.setItem('estacionamentoData', JSON.stringify(dadosAtuais));
                this.mostrarMensagem('Saída registrada com sucesso!', 'sucesso');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Erro ao registrar saída:', error);
            this.mostrarMensagem('Erro ao registrar saída. Tente novamente.');
        }
    }

    atualizarHora() {
        const agora = new Date();
        const elementoHora = document.getElementById('currentTime');
        if (elementoHora) {
            elementoHora.textContent = agora.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    mostrarMensagem(texto, tipo = 'erro') {
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `mensagem ${tipo}`;
        mensagemDiv.textContent = texto;
        document.body.appendChild(mensagemDiv);
        
        setTimeout(() => {
            mensagemDiv.remove();
        }, 3000);
    }
}

// Inicializa o sistema
const saidaSystem = new SaidaSystem();