// src/lib/aml-service.ts

export interface AmlCheckResult {
  isSafe: boolean;
  riskScore: number; // от 0 до 100
  reason?: string;
}

/**
 * Заглушка сервиса AML-проверки.
 * В рабочей среде здесь будет вызов API, например Crystal, Elliptic или Chainalysis.
 */
export async function checkAddressAml(address: string, network: string): Promise<AmlCheckResult> {
  console.log(`[AML Check] Checking address ${address} on ${network}`);
  
  // Симуляция логики:
  // Адреса, начинающиеся с '0x000' или 'T000', в этой заглушке помечаются как подозрительные
  const isSuspicious = address.startsWith('0x000') || address.startsWith('T000') || address.includes('bad');
  
  if (isSuspicious) {
    return {
      isSafe: false,
      riskScore: 85,
      reason: 'Address associated with high-risk activity (Mock Flag)',
    };
  }

  return {
    isSafe: true,
    riskScore: 5,
  };
}

/**
 * Проверяет транзакцию на соответствие требованиям AML
 */
export async function validateTransactionAml(params: {
  userId: string;
  address: string;
  network: string;
  amount: number;
}) {
  const result = await checkAddressAml(params.address, params.network);
  
  if (!result.isSafe) {
    // Здесь мы можем автоматически пометить транзакцию или уведомить администраторов
    console.warn(`[AML ALERT] Suspicious transaction for user ${params.userId}: ${params.amount} on ${params.network}. Reason: ${result.reason}`);
  }
  
  return result;
}
