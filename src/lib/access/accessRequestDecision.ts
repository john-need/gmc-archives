export interface AccessRequestSubmission {
  name?: string;
  email?: string;
  reason?: string;
}

export type SubmissionValidation =
  | { valid: true }
  | { valid: false; missingFields: string[] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAccessRequestSubmission(submission: AccessRequestSubmission): SubmissionValidation {
  const missingFields: string[] = [];
  if (!submission.name?.trim()) {
    missingFields.push("name");
  }
  if (!submission.email?.trim() || !EMAIL_PATTERN.test(submission.email.trim())) {
    missingFields.push("email");
  }
  if (!submission.reason?.trim()) {
    missingFields.push("reason");
  }
  return missingFields.length === 0 ? { valid: true } : { valid: false, missingFields };
}
