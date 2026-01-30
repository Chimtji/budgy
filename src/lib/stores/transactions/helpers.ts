// Ignores random sets of numbers
export const cleanDescription = (text: string) =>
  text.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();

export const isTransactionsFromSamePlace = (descriptionA: string, descriptionB: string) => {
  if (cleanDescription(descriptionA) === cleanDescription(descriptionB)) {
    return true;
  } else {
    return false;
  }
};
