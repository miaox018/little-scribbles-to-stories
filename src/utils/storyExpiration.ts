import { differenceInDays, differenceInHours, parseISO } from 'date-fns';

export interface ExpirationInfo {
  isExpiring: boolean;
  isExpired: boolean;
  daysLeft: number;
  hoursLeft: number;
  expiresAt: Date | null;
  warningMessage: string;
}

export const getStoryExpirationInfo = (expiresAt?: string): ExpirationInfo => {
  if (!expiresAt) {
    return {
      isExpiring: false,
      isExpired: false,
      daysLeft: 0,
      hoursLeft: 0,
      expiresAt: null,
      warningMessage: ''
    };
  }

  const expiration = parseISO(expiresAt);
  const now = new Date();
  const daysLeft = differenceInDays(expiration, now);
  const hoursLeft = differenceInHours(expiration, now);

  const isExpired = expiration < now;
  const isExpiring = !isExpired && daysLeft <= 2; // Show warning when 2 days or less

  let warningMessage = '';
  if (isExpired) {
    warningMessage = 'This story has expired and will be deleted soon.';
  } else if (daysLeft === 0) {
    warningMessage = `Expires in ${hoursLeft} hours! Save to library to keep it.`;
  } else if (daysLeft === 1) {
    warningMessage = 'Expires tomorrow! Save to library to keep it.';
  } else if (daysLeft <= 2) {
    warningMessage = `Expires in ${daysLeft} days. Save to library to keep it.`;
  }

  return {
    isExpiring,
    isExpired,
    daysLeft,
    hoursLeft,
    expiresAt: expiration,
    warningMessage
  };
};