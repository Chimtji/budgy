export type TRule = {
  pattern: string;
  category_key: string;
  segment_key: string;
  match_count: number;
  company_id: string | null;
};

/**
 * Parses a pattern string into OR groups of AND terms.
 * Format: "a,b|c,d" = (a AND b) OR (c AND d)
 */
export const parsePatternGroups = (pattern: string): string[][] =>
  pattern
    .split('|')
    .map((group) =>
      group
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    )
    .filter((g) => g.length > 0);

/**
 * Returns true if the haystack matches the pattern.
 * At least one OR group must fully match (all AND terms present).
 */
export const matchesPattern = (pattern: string, haystack: string): boolean => {
  const lower = haystack.toLowerCase();
  return parsePatternGroups(pattern).some((group) =>
    group.every((term) => lower.includes(term.toLowerCase()))
  );
};

export const categorize = (
  description: string,
  recipient: string,
  rules: TRule[]
): { category_key: string; segment_key: string; company_id: string | null } => {
  const haystack = `${description} ${recipient}`;
  const matches = rules.filter((rule) => matchesPattern(rule.pattern, haystack));

  if (matches.length === 0) {
    return { category_key: 'uncategorized', segment_key: 'uncategorized', company_id: null };
  }

  const best = matches.reduce((prev, curr) => (curr.match_count > prev.match_count ? curr : prev));

  return {
    category_key: best.category_key,
    segment_key: best.segment_key,
    company_id: best.company_id ?? null,
  };
};
