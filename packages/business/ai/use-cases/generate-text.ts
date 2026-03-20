import type { AIProvider } from '../ports/ai-provider';
import { prisma } from '@wbc/db';

export async function generateCampaignText(tenantId: string, objective: string, aiProvider: AIProvider) {
  await checkAILimit(tenantId);
  const prompt = `Você é uma assistente de uma consultora de beleza no Brasil. Crie um texto de campanha de WhatsApp para: ${objective}. O texto deve ser curto (máximo 3 parágrafos), amigável e persuasivo. Use {{nome}} como placeholder para o nome da cliente.`;
  const result = await aiProvider.generate(prompt);
  await recordGeneration(tenantId, 'CAMPAIGN', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { text: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function generateBillingMessage(tenantId: string, clientName: string, amount: number, dueDate: string, aiProvider: AIProvider) {
  await checkAILimit(tenantId);
  const prompt = `Crie uma mensagem gentil de cobrança para ${clientName}, valor R$ ${amount.toFixed(2)}, vencimento ${dueDate}. Seja amigável mas clara. Máximo 2 parágrafos.`;
  const result = await aiProvider.generate(prompt);
  await recordGeneration(tenantId, 'BILLING', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { text: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function generateReactivation(tenantId: string, clientName: string, lastPurchaseDate: string, aiProvider: AIProvider) {
  await checkAILimit(tenantId);
  const prompt = `Crie uma mensagem de reativação para ${clientName}, última compra em ${lastPurchaseDate}. Seja carinhosa e ofereça um motivo para voltar. Máximo 2 parágrafos.`;
  const result = await aiProvider.generate(prompt);
  await recordGeneration(tenantId, 'REACTIVATION', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { text: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function correctText(tenantId: string, text: string, aiProvider: AIProvider) {
  await checkAILimit(tenantId);
  const prompt = `Corrija erros de ortografia e gramática no texto a seguir, mantendo o tom original: "${text}"`;
  const result = await aiProvider.generate(prompt);
  await recordGeneration(tenantId, 'CORRECTION', result.inputTokens, result.outputTokens, result.model, prompt, result.text);
  return { correctedText: result.text, tokensUsed: result.inputTokens + result.outputTokens };
}

export async function getAIUsage(tenantId: string) {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) return { used: 0, limit: 30, remaining: 30 };
  return { used: sub.aiGenerationsUsed, limit: sub.aiGenerationsLimit, remaining: sub.aiGenerationsLimit - sub.aiGenerationsUsed };
}

async function checkAILimit(tenantId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (sub && sub.aiGenerationsUsed >= sub.aiGenerationsLimit) {
    throw new Error('AI generation limit reached for this month');
  }
}

async function recordGeneration(tenantId: string, type: string, inputTokens: number, outputTokens: number, model: string, prompt: string, result: string): Promise<void> {
  await prisma.aIGeneration.create({
    data: { tenantId, type: type as 'CAMPAIGN' | 'BILLING' | 'REACTIVATION' | 'CORRECTION', inputTokens, outputTokens, model, prompt, result },
  });
  await prisma.subscription.update({
    where: { tenantId },
    data: { aiGenerationsUsed: { increment: 1 } },
  });
}
