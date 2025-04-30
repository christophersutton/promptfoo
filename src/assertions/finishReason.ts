import type { AssertionParams, GradingResult } from '../types';
import invariant from '../util/invariant';

// Map provider-specific stop reasons to normalized values
const FINISH_REASON_MAP: Record<string, string> = {
  stop: 'stop',
  length: 'length',
  content_filter: 'content_filter',
  tool_calls: 'tool_calls',
  function_call: 'tool_calls',
  end_turn: 'stop',
  stop_sequence: 'stop',
  max_tokens: 'length',
  tool_use: 'tool_calls',
};

// Normalize a stop reason to standard values
function normalizeFinishReason(reason: string | null | undefined): string | undefined {
  if (!reason) {
    return undefined;
  }
  const key = reason.toLowerCase();
  return FINISH_REASON_MAP[key] ?? key;
}

export function handleFinishReason({
  assertion,
  renderedValue,
  providerResponse,
}: AssertionParams): GradingResult {
  const value = renderedValue ?? assertion.value;
  invariant(
    typeof value === 'string' || Array.isArray(value),
    '"finish-reason" assertion type must have a string or array value',
  );

  // Normalize expected value(s)
  const expectedList = Array.isArray(value)
    ? (value as string[]).map((v) => normalizeFinishReason(v)!).filter((v): v is string => !!v)
    : [normalizeFinishReason(value as string)!];

  // Normalize actual stop reason
  const actual = normalizeFinishReason(providerResponse.finishReason);
  if (!actual) {
    return {
      pass: false,
      score: 0,
      reason: 'Provider did not supply stop/finish reason',
      assertion,
    };
  }

  const pass = expectedList.includes(actual);
  return {
    pass,
    score: pass ? 1 : 0,
    reason: `Model returned "${actual}"`,
    assertion,
  };
}
