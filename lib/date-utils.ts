export function getDateFromFirestore(date: any): Date {
  if (!date) return new Date();

  // If it's a Firestore timestamp (has toDate method)
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }

  // If it's already a Date object
  if (date instanceof Date) {
    return date;
  }

  // If it's a number (timestamp) or string
  return new Date(date);
}
