import { User } from './types';

/**
 * Resolves all paired/linked account emails connected through sbazar_email, bazos_email, or direct email match.
 * Matches the pairing logic used in "Moje nabídka" (OffersList).
 */
export function resolveLinkedEmails(target: User | string | null | undefined, allUsers: User[]): string[] {
  if (!target) return [];

  const emailsSet = new Set<string>();

  const targetEmail =
    typeof target === 'string'
      ? target.toLowerCase().trim()
      : target.email?.toLowerCase().trim();
  const targetSbazar =
    typeof target === 'string' ? null : target.sbazar_email?.toLowerCase().trim();
  const targetBazos =
    typeof target === 'string' ? null : target.bazos_email?.toLowerCase().trim();

  if (targetEmail) emailsSet.add(targetEmail);
  if (targetSbazar) emailsSet.add(targetSbazar);
  if (targetBazos) emailsSet.add(targetBazos);

  // 1. Identify any shared sbazar_email among allUsers
  let activeSbazarEmail = targetSbazar;
  if (!activeSbazarEmail && targetEmail) {
    const matched = allUsers.find(
      (u) =>
        u.email?.toLowerCase().trim() === targetEmail ||
        u.sbazar_email?.toLowerCase().trim() === targetEmail ||
        u.bazos_email?.toLowerCase().trim() === targetEmail
    );
    if (matched?.sbazar_email) {
      activeSbazarEmail = matched.sbazar_email.toLowerCase().trim();
      emailsSet.add(activeSbazarEmail);
    }
  }

  // 2. Gather all accounts connected through activeSbazarEmail or direct email match
  for (const u of allUsers) {
    const uSbazar = u.sbazar_email?.toLowerCase().trim();
    const uEmail = u.email?.toLowerCase().trim();
    const uBazos = u.bazos_email?.toLowerCase().trim();
    const uFb = u.facebook_email?.toLowerCase().trim();

    const isLinked =
      (activeSbazarEmail && (uSbazar === activeSbazarEmail || uEmail === activeSbazarEmail)) ||
      (targetEmail && (uEmail === targetEmail || uSbazar === targetEmail || uBazos === targetEmail));

    if (isLinked) {
      if (uEmail) emailsSet.add(uEmail);
      if (uSbazar) emailsSet.add(uSbazar);
      if (uBazos) emailsSet.add(uBazos);
      if (uFb) emailsSet.add(uFb);
    }
  }

  return Array.from(emailsSet).filter(Boolean);
}

/**
 * Resolves full User objects for all paired/linked accounts of the target seller.
 * These are the accounts that share the same sbazar_email or credentials, exactly as in "Moje nabídka".
 */
export function resolvePairedUserAccounts(target: User | string | null | undefined, allUsers: User[]): User[] {
  if (!target || !allUsers || allUsers.length === 0) return [];

  const targetEmail =
    typeof target === 'string'
      ? target.toLowerCase().trim()
      : target.email?.toLowerCase().trim();
  const targetSbazar =
    typeof target === 'string' ? null : target.sbazar_email?.toLowerCase().trim();

  // 1. Identify any shared sbazar_email among allUsers
  let activeSbazarEmail = targetSbazar;
  if (!activeSbazarEmail && targetEmail) {
    const matched = allUsers.find(
      (u) =>
        u.email?.toLowerCase().trim() === targetEmail ||
        u.sbazar_email?.toLowerCase().trim() === targetEmail ||
        u.bazos_email?.toLowerCase().trim() === targetEmail
    );
    if (matched?.sbazar_email) {
      activeSbazarEmail = matched.sbazar_email.toLowerCase().trim();
    }
  }

  const matchedUsers: User[] = [];
  const seenEmails = new Set<string>();

  for (const u of allUsers) {
    const uSbazar = u.sbazar_email?.toLowerCase().trim();
    const uEmail = u.email?.toLowerCase().trim();
    const uBazos = u.bazos_email?.toLowerCase().trim();

    const isLinked =
      (activeSbazarEmail && (uSbazar === activeSbazarEmail || uEmail === activeSbazarEmail)) ||
      (targetEmail && (uEmail === targetEmail || uSbazar === targetEmail || uBazos === targetEmail));

    if (isLinked && uEmail && !seenEmails.has(uEmail)) {
      seenEmails.add(uEmail);
      matchedUsers.push(u);
    }
  }

  // Fallback to target if it is a User and wasn't found in list
  if (matchedUsers.length === 0 && typeof target !== 'string' && target.email) {
    return [target];
  }

  // Sort: main target email first, then alphabetically by bazos_name || email
  matchedUsers.sort((a, b) => {
    if (targetEmail) {
      if (a.email.toLowerCase() === targetEmail) return -1;
      if (b.email.toLowerCase() === targetEmail) return 1;
    }
    const nameA = a.bazos_name || a.email;
    const nameB = b.bazos_name || b.email;
    return nameA.localeCompare(nameB, 'cs');
  });

  return matchedUsers;
}

/**
 * Returns a comma-separated list of distinct emails representing ONLY this specific subaccount
 * (its primary email and bazos_email, without any shared/linked sbazar_email).
 */
export function getSubaccountFilterEmails(account: User | null | undefined): string {
  if (!account) return '';
  const set = new Set<string>();
  if (account.email) set.add(account.email.toLowerCase().trim());
  if (account.bazos_email) set.add(account.bazos_email.toLowerCase().trim());
  return Array.from(set).filter(Boolean).join(',');
}
