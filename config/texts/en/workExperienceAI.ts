/**
 * Work Experience Section AI Prompts
 * Repo default: Vietnamese only. This file re-exports Vietnamese prompts
 * so all code paths use Vietnamese (no English prompts).
 */

import type { AIPromptTemplate, PromptContext } from '../vi/aiPrompts';
import { viWorkExperienceAIPrompts } from '../vi/workExperienceAI';
import { formatViWorkExperiencePrompt } from '../vi/workExperienceAI';

export const enWorkExperienceAIPrompts = viWorkExperienceAIPrompts;

export type EnWorkExperienceAIPromptKey = keyof typeof enWorkExperienceAIPrompts;

/**
 * Format work experience prompt (always Vietnamese)
 */
export function formatEnWorkExperiencePrompt(
  template: AIPromptTemplate,
  context: PromptContext
): { system: string; user: string } {
  return formatViWorkExperiencePrompt(template, context);
}
