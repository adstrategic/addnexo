interface EmailResults {
  permanentFailed?: { email: string; error: string }[];
  sent?: string[];
}

export function normalizeDispatchRecipientEmails(
  emails: (null | string | undefined)[],
): string[] {
  return [
    ...new Set(
      emails.filter((email): email is string => !!email && email !== "N/A"),
    ),
  ];
}

export function filterPendingEmails(
  emails: string[],
  existingResults: EmailResults,
): string[] {
  let pending = [...emails];

  if (existingResults.permanentFailed) {
    const permanentFailedEmails = new Set(
      existingResults.permanentFailed.map((f) => f.email),
    );
    pending = pending.filter((email) => !permanentFailedEmails.has(email));
  }

  if (existingResults.sent) {
    const sentEmails = new Set(existingResults.sent);
    pending = pending.filter((email) => !sentEmails.has(email));
  }

  return pending;
}
