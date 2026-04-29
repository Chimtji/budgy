'use server';

import crypto from 'crypto';
import { sqlClient } from '@/service/database/auth/server';

export interface CategorizationResult {
  categoryId: string | null;
  segmentId: string | null;
  confidence: number;
  ruleId?: string;
}

/**
 * Pattern matching for merchant name categorization
 */
function matchPattern(merchant: string, pattern: string): boolean {
  const normalizedMerchant = merchant.toUpperCase();
  const normalizedPattern = pattern.toUpperCase();

  // Exact match
  if (normalizedPattern === normalizedMerchant) return true;

  // Prefix match (pattern ends with *)
  if (normalizedPattern.endsWith('*')) {
    const prefix = normalizedPattern.slice(0, -1);
    if (normalizedMerchant.startsWith(prefix)) return true;
  }

  // Contains match (pattern starts and ends with *)
  if (normalizedPattern.startsWith('*') && normalizedPattern.endsWith('*')) {
    const substring = normalizedPattern.slice(1, -1);
    if (normalizedMerchant.includes(substring)) return true;
  }

  // Regex support
  try {
    const regex = new RegExp(normalizedPattern, 'i');
    if (regex.test(normalizedMerchant)) return true;
  } catch {
    // If regex is invalid, skip
  }

  return false;
}

/**
 * Categorize a transaction merchant using user-specific and shared rules
 */
export async function categorizeTransaction(
  userId: string,
  merchant: string
): Promise<CategorizationResult> {
  try {
    // First, try user-specific rules
    const userRules = await sqlClient`
      SELECT id, category_id, segment_id, pattern
      FROM categorization_rules
      WHERE user_id = ${userId}
      ORDER BY priority DESC
    `;

    for (const rule of userRules) {
      if (matchPattern(merchant, rule.pattern)) {
        return {
          categoryId: rule.category_id,
          segmentId: rule.segment_id,
          confidence: 100,
          ruleId: rule.id,
        };
      }
    }

    // Then, try shared/default rules
    const sharedRules = await sqlClient`
      SELECT id, category_id, segment_id, pattern
      FROM categorization_rules
      WHERE user_id IS NULL AND is_default = true
      ORDER BY priority DESC
    `;

    for (const rule of sharedRules) {
      if (matchPattern(merchant, rule.pattern)) {
        return {
          categoryId: rule.category_id,
          segmentId: rule.segment_id,
          confidence: 100,
          ruleId: rule.id,
        };
      }
    }

    // No match found
    return {
      categoryId: null,
      segmentId: null,
      confidence: 0,
    };
  } catch (error) {
    console.error('Failed to categorize transaction:', error);
    return {
      categoryId: null,
      segmentId: null,
      confidence: 0,
    };
  }
}

/**
 * Create a categorization rule for a user
 */
export async function createRule(
  userId: string,
  pattern: string,
  categoryId: string,
  segmentId: string,
  priority: number = 0
): Promise<boolean> {
  try {
    await sqlClient`
      INSERT INTO categorization_rules (
        id, user_id, pattern, category_id, segment_id, priority, is_default
      )
      VALUES (
        ${crypto.randomUUID()}, ${userId}, ${pattern}, ${categoryId}, ${segmentId}, ${priority}, false
      )
      ON CONFLICT (user_id, pattern)
      DO UPDATE SET
        category_id = ${categoryId},
        segment_id = ${segmentId},
        priority = ${priority},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    console.error('Failed to create categorization rule:', error);
    return false;
  }
}

/**
 * Get all rules for a user (user-specific + shared)
 */
export async function getUserRules(userId: string) {
  try {
    const rules = await sqlClient`
      SELECT id, pattern, category_id, segment_id, priority, user_id IS NULL as is_shared
      FROM categorization_rules
      WHERE user_id = ${userId} OR (user_id IS NULL AND is_default = true)
      ORDER BY user_id DESC NULLS LAST, priority DESC
    `;

    return rules;
  } catch (error) {
    console.error('Failed to get user rules:', error);
    return [];
  }
}
