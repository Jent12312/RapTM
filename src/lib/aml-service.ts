// src/lib/aml-service.ts

export interface AmlCheckResult {
  isSafe: boolean;
  riskScore: number; // 0 to 100
  reason?: string;
}

/**
 * Mock AML screening service.
 * In production, this would call an API like Crystal, Elliptic, or Chainalysis.
 */
export async function checkAddressAml(address: string, network: string): Promise<AmlCheckResult> {
  console.log(`[AML Check] Checking address ${address} on ${network}`);
  
  // Simulated logic:
  // Addresses starting with '0x000' or 'T000' are flagged as suspicious in this mock
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
 * Validates a transaction for AML compliance
 */
export async function validateTransactionAml(params: {
  userId: string;
  address: string;
  network: string;
  amount: number;
}) {
  const result = await checkAddressAml(params.address, params.network);
  
  if (!result.isSafe) {
    // Here we could automatically flag the transaction or notify admins
    console.warn(`[AML ALERT] Suspicious transaction for user ${params.userId}: ${params.amount} on ${params.network}. Reason: ${result.reason}`);
  }
  
  return result;
}
