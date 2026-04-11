import type { LineComparison } from '../types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function isClose(a: string, b: string): boolean {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 3) return a === b;
  const threshold = maxLen <= 6 ? 1 : 2;
  return levenshtein(a, b) <= threshold;
}

export function compareLine(userInput: string, expected: string): LineComparison {
  const userWords = normalize(userInput).split(' ').filter(Boolean);
  const expectedWords = normalize(expected).split(' ').filter(Boolean);

  const correct: string[] = [];
  const missed: string[] = [];
  const extra: string[] = [];

  const usedExpected = new Set<number>();
  const usedUser = new Set<number>();

  for (let i = 0; i < userWords.length; i++) {
    for (let j = 0; j < expectedWords.length; j++) {
      if (!usedExpected.has(j) && !usedUser.has(i) && userWords[i] === expectedWords[j]) {
        correct.push(expectedWords[j]);
        usedUser.add(i);
        usedExpected.add(j);
        break;
      }
    }
  }

  for (let i = 0; i < userWords.length; i++) {
    if (usedUser.has(i)) continue;
    for (let j = 0; j < expectedWords.length; j++) {
      if (!usedExpected.has(j) && isClose(userWords[i], expectedWords[j])) {
        correct.push(expectedWords[j]);
        usedUser.add(i);
        usedExpected.add(j);
        break;
      }
    }
  }

  for (let j = 0; j < expectedWords.length; j++) {
    if (!usedExpected.has(j)) missed.push(expectedWords[j]);
  }
  for (let i = 0; i < userWords.length; i++) {
    if (!usedUser.has(i)) extra.push(userWords[i]);
  }

  const accuracy = expectedWords.length === 0
    ? 100
    : Math.round((correct.length / expectedWords.length) * 100);

  let feedback: string;
  if (accuracy === 100) feedback = 'Perfect!';
  else if (accuracy >= 80) feedback = 'Great! Minor adjustments needed.';
  else if (accuracy >= 60) feedback = 'Good effort. Review the missed words.';
  else feedback = "Let's try again. Focus on the full line.";

  return { accuracy, correct, missed, extra, feedback };
}
