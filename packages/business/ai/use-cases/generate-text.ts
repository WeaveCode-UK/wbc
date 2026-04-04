import type { AIProvider } from '../ports/ai-provider';
import type { AIRepository } from '../ports/ai-repository';

export async function generateCampaignText(tenantId: string, objective: string, aiProvider: AIProvider, aiRepo: AIRepository) {
  await aiRepo.checkLimit(tenantId);
  const prompt = `Você é uma assistente de uma consultora de beleza no Brasil. Crie um texto de campanha de WhatsApp para: ${objective}. O texto deve ser curto (máximo 3 parágrafos), amigável e persuasivo. Use {{nome}} como placeholder para o nome da cliente.`;
  const result = await aiProvider.generate(prompt);
  await aiRepo.recordGeneration(tenantId, 'CAMPAIGN', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { text: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function generateBillingMessage(tenantId: string, clientName: string, amount: number, dueDate: string, aiProvider: AIProvider, aiRepo: AIRepository) {
  await aiRepo.checkLimit(tenantId);
  const prompt = `Crie uma mensagem gentil de cobrança para ${clientName}, valor R$ ${amount.toFixed(2)}, vencimento ${dueDate}. Seja amigável mas clara. Máximo 2 parágrafos.`;
  const result = await aiProvider.generate(prompt);
  await aiRepo.recordGeneration(tenantId, 'BILLING', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { text: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function generateReactivation(tenantId: string, clientName: string, lastPurchaseDate: string, aiProvider: AIProvider, aiRepo: AIRepository) {
  await aiRepo.checkLimit(tenantId);
  const prompt = `Crie uma mensagem de reativação para ${clientName}, última compra em ${lastPurchaseDate}. Seja carinhosa e ofereça um motivo para voltar. Máximo 2 parágrafos.`;
  const result = await aiProvider.generate(prompt);
  await aiRepo.recordGeneration(tenantId, 'REACTIVATION', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { text: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function correctText(tenantId: string, text: string, aiProvider: AIProvider, aiRepo: AIRepository) {
  await aiRepo.checkLimit(tenantId);
  const prompt = `Corrija erros de ortografia e gramática no texto a seguir, mantendo o tom original: "${text}"`;
  const result = await aiProvider.generate(prompt);
  await aiRepo.recordGeneration(tenantId, 'CORRECTION', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { correctedText: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function getAIUsage(tenantId: string, aiRepo: AIRepository) {
  return aiRepo.getUsage(tenantId);
}
