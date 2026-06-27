import * as Updates from 'expo-updates';

export type OtaCheckResult =
  | { status: 'disabled' }
  | { status: 'up_to_date' }
  | { status: 'available' }
  | { status: 'error'; message: string };

export type OtaApplyResult =
  | { status: 'downloaded' }
  | { status: 'already_latest' }
  | { status: 'disabled' }
  | { status: 'error'; message: string };

/** Check Expo servers for a newer JS bundle. Does not restart the app. */
export async function checkForOtaUpdate(): Promise<OtaCheckResult> {
  if (!Updates.isEnabled) {
    return { status: 'disabled' };
  }

  try {
    const result = await Updates.checkForUpdateAsync();
    return result.isAvailable ? { status: 'available' } : { status: 'up_to_date' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update check failed.';
    return { status: 'error', message };
  }
}

/** Download update if needed, then reload once. Call only from user action (Profile button). */
export async function downloadAndApplyOtaUpdate(): Promise<OtaApplyResult> {
  if (!Updates.isEnabled) {
    return { status: 'disabled' };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      return { status: 'already_latest' };
    }

    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) {
      return { status: 'already_latest' };
    }

    // Reload immediately after a successful download — no second fetch, no delayed race.
    await Updates.reloadAsync();
    return { status: 'downloaded' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed.';
    return { status: 'error', message };
  }
}
