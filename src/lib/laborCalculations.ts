// Labor calculation constants for MEI
export const LABOR_RATES = {
  INSS_EMPREGADOR: 0.03, // 3%
  FGTS: 0.08, // 8%
  FGTS_ADICIONAL: 0.032, // 3.2%
  INSS_EMPREGADO: 0.08, // 8%
};

export interface PayrollCalculation {
  salarioBruto: number;
  inssEmpregador: number;
  fgts: number;
  fgtsAdicional: number;
  inssEmpregado: number;
  salarioLiquido: number;
  custoTotal: number;
}

export interface TerminationCalculation {
  saldoSalario: number;
  avisoPrevio: number;
  feriasVencidas: number;
  feriasProporcionais: number;
  tercoFerias: number;
  decimoTerceiro: number;
  multaFgts: number;
  totalRescisao: number;
}

export interface ProvisionCalculation {
  provisaoFerias: number;
  provisaoDecimoTerceiro: number;
  provisaoFgts: number;
  totalProvisao: number;
}

// Calculate monthly payroll
export function calculatePayroll(salarioBruto: number): PayrollCalculation {
  const inssEmpregador = salarioBruto * LABOR_RATES.INSS_EMPREGADOR;
  const fgts = salarioBruto * LABOR_RATES.FGTS;
  const fgtsAdicional = salarioBruto * LABOR_RATES.FGTS_ADICIONAL;
  const inssEmpregado = salarioBruto * LABOR_RATES.INSS_EMPREGADO;
  const salarioLiquido = salarioBruto - inssEmpregado;
  const custoTotal = salarioBruto + inssEmpregador + fgts + fgtsAdicional;

  return {
    salarioBruto,
    inssEmpregador,
    fgts,
    fgtsAdicional,
    inssEmpregado,
    salarioLiquido,
    custoTotal,
  };
}

// Calculate termination values
export function calculateTermination(
  salarioBruto: number,
  dataAdmissao: Date,
  dataDesligamento: Date,
  tipoRescisao: 'sem_justa_causa' | 'pedido_demissao',
  saldoFgts: number = 0
): TerminationCalculation {
  const diasTrabalhados = dataDesligamento.getDate();
  const saldoSalario = (salarioBruto / 30) * diasTrabalhados;

  // Calculate months worked
  const mesesTrabalhados = Math.floor(
    (dataDesligamento.getTime() - dataAdmissao.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const anosCompletos = Math.floor(mesesTrabalhados / 12);
  const mesesAposUltimoAno = mesesTrabalhados % 12;

  // Férias vencidas (anos completos)
  const feriasVencidas = anosCompletos > 0 ? salarioBruto : 0;

  // Férias proporcionais (meses após último período aquisitivo)
  const mesesParaFerias = mesesAposUltimoAno > 0 ? mesesAposUltimoAno : 0;
  const feriasProporcionais = (salarioBruto / 12) * mesesParaFerias;

  // 1/3 de férias
  const tercoFerias = (feriasVencidas + feriasProporcionais) / 3;

  // 13º proporcional
  const mesAtual = dataDesligamento.getMonth() + 1;
  const decimoTerceiro = (salarioBruto / 12) * mesAtual;

  // Aviso prévio (30 dias + 3 dias por ano trabalhado, máximo 90 dias)
  let avisoPrevio = 0;
  if (tipoRescisao === 'sem_justa_causa') {
    const diasAviso = Math.min(30 + anosCompletos * 3, 90);
    avisoPrevio = (salarioBruto / 30) * diasAviso;
  }

  // Multa FGTS 40% (apenas sem justa causa)
  const totalFgtsAcumulado = saldoFgts || salarioBruto * LABOR_RATES.FGTS * mesesTrabalhados;
  const multaFgts = tipoRescisao === 'sem_justa_causa' ? totalFgtsAcumulado * 0.4 : 0;

  const totalRescisao =
    saldoSalario +
    avisoPrevio +
    feriasVencidas +
    feriasProporcionais +
    tercoFerias +
    decimoTerceiro +
    multaFgts;

  return {
    saldoSalario,
    avisoPrevio,
    feriasVencidas,
    feriasProporcionais,
    tercoFerias,
    decimoTerceiro,
    multaFgts,
    totalRescisao,
  };
}

// Calculate monthly provisions
export function calculateProvisions(salarioBruto: number): ProvisionCalculation {
  // Provisão de férias: 1/12 do salário + 1/3
  const provisaoFerias = (salarioBruto / 12) * (1 + 1 / 3);

  // Provisão de 13º: 1/12 do salário
  const provisaoDecimoTerceiro = salarioBruto / 12;

  // Provisão FGTS sobre férias e 13º
  const provisaoFgts = (provisaoFerias + provisaoDecimoTerceiro) * LABOR_RATES.FGTS;

  const totalProvisao = provisaoFerias + provisaoDecimoTerceiro + provisaoFgts;

  return {
    provisaoFerias,
    provisaoDecimoTerceiro,
    provisaoFgts,
    totalProvisao,
  };
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Calculate annual cost
export function calculateAnnualCost(salarioBruto: number): number {
  const payroll = calculatePayroll(salarioBruto);
  const provisions = calculateProvisions(salarioBruto);
  return (payroll.custoTotal + provisions.totalProvisao) * 12;
}
