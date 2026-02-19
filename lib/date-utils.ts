// Define a minimal interface for Firestore Timestamp
interface FirestoreTimestamp {
  toDate(): Date;
}

export function getDateFromFirestore(date: unknown): Date {
  if (!date) return new Date();

  // If it's a Firestore timestamp (has toDate method)
  if (
    typeof date === 'object' &&
    date !== null &&
    'toDate' in date &&
    typeof (date as FirestoreTimestamp).toDate === 'function'
  ) {
    return (date as FirestoreTimestamp).toDate();
  }

  // If it's already a Date object
  if (date instanceof Date) {
    return date;
  }

  // If it's a number (timestamp) or string
  return new Date(date as string | number);
}
