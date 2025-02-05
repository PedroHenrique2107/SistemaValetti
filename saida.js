class SaidaSystem {
    constructor() {
        this.veiculos = [];
        this.veiculoAtual = null;
        // Configuração das tarifas por tipo de cliente
        this.tarifas = {
            avulso: {
                primeiros20min: 5.00,
                primeiraHora: 30.00,
                horaAdicional: 10.00,
                nome: "Avulso"
            },
            mensalista: {
                primeiros20min: 3.00,
                primeiraHora: 20.00,
                horaAdicional: 5.00,
                nome: "Mensalista"
            },
            convenio: {
                primeiros20min: 4.00,
                primeiraHora: 25.00,
                horaAdicional: 8.00,
                nome: "Convênio"
            }
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
            (v.status === 'estacionado' || v.status === 'saida')
        );
    
        if (veiculo) {
            this.veiculoAtual = veiculo;
            this.mostrarDetalhesVeiculo(veiculo);
        } else {
            this.mostrarMensagem('Veículo não encontrado ou já finalizado');
        }
    }

    calcularValor(minutosTotais, tipoCliente) {
        const tarifa = this.tarifas[tipoCliente];
        
        // Até 20 minutos
        if (minutosTotais <= 20) {
            return tarifa.primeiros20min;
        }
        
        // Primeira hora
        if (minutosTotais <= 60) {
            return tarifa.primeiraHora;
        }
        
        // Horas adicionais
        const horasAdicionais = Math.ceil((minutosTotais - 60) / 60);
        return tarifa.primeiraHora + (horasAdicionais * tarifa.horaAdicional);
    }

    mostrarDetalhesVeiculo(veiculo) {
        const horaEntrada = new Date(veiculo.horaEntrada);
        const horaSaida = new Date();
        const tempoEstacionado = this.calcularTempoEstacionado(horaEntrada, horaSaida);
        const valor = this.calcularValor(tempoEstacionado.minutosTotais, veiculo.tipo);

        document.getElementById('vehicleDetails').innerHTML = `
            <div class="vehicle-card">
                <h2>Placa: ${veiculo.placa}</h2>
                <p>Modelo: ${veiculo.modelo}</p>
                <p>Setor: ${veiculo.setor}</p>
                <p>Vaga: ${veiculo.vaga}</p>
                <p>Tipo: ${this.tarifas[veiculo.tipo].nome}</p>
            </div>
        `;

        document.getElementById('horaEntrada').textContent = 
            horaEntrada.toLocaleTimeString('pt-BR');
        document.getElementById('horaSaida').textContent = 
            horaSaida.toLocaleTimeString('pt-BR');
        document.getElementById('tempoTotal').textContent = 
            `${tempoEstacionado.horas}h ${tempoEstacionado.minutos}min`;
        document.getElementById('valorTotal').textContent = 
            valor.toFixed(2);

        document.getElementById('paymentSection').style.display = 'block';
    }

    calcularTempoEstacionado(entrada, saida) {
        const diff = saida - entrada;
        const minutosTotais = Math.floor(diff / (1000 * 60));
        const horas = Math.floor(minutosTotais / 60);
        const minutos = minutosTotais % 60;
        
        return {
            horas,
            minutos,
            minutosTotais
        };
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
            const veiculoIndex = veiculos.findIndex(v => v.placa === this.veiculoAtual.placa);
    
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
    
                const dadosAtualizados = {
                    veiculos: veiculos,
                    contadores: {
                        reserva: 0,
                        estacionado: veiculos.filter(v => v.status === 'estacionado').length,
                        saida: veiculos.filter(v => v.status === 'saida').length,
                        entregue: veiculos.filter(v => v.status === 'finalizado').length
                    }
                };
    
                localStorage.setItem('estacionamentoData', JSON.stringify(dadosAtualizados));
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

    mostrarMensagem(texto, tipo = 'erro') {
        const div = document.createElement('div');
        div.className = `mensagem ${tipo}`;
        div.textContent = texto;
        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, 3000);
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
}

const saidaSystem = new SaidaSystem();
window.saidaSystem = saidaSystem;