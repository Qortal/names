import { atom } from 'jotai';

type TransactionCategory = 'REGISTER_NAME';

type TransactionMap = {
  [signature: string]: any; // replace `any` with your transaction type if known
};

type PendingTxsState = {
  [key in TransactionCategory]?: TransactionMap;
};
export const namesAtom = atom([]);
export const forSaleAtom = atom([]);
export const pendingTxsAtom = atom<PendingTxsState>({});

export const sortedPendingTxsByCategoryAtom = (category: string) =>
  atom((get) => {
    const txsByCategory = get(pendingTxsAtom)[category as TransactionCategory];
    if (!txsByCategory) return [];

    return Object.values(txsByCategory).sort(
      (a, b) => b.timestamp - a.timestamp
    ); // Newest to oldest
  });

export const allSortedPendingTxsAtom = atom((get) => {
  const allTxsByCategory = get(pendingTxsAtom);

  const allTxs = Object.values(allTxsByCategory)
    .flatMap((categoryMap) => Object.values(categoryMap))
    .filter((tx) => typeof tx.timestamp === 'number');

  return allTxs.sort((a, b) => b.timestamp - a.timestamp);
});

export const refreshAtom = atom(0);
export const forceRefreshAtom = atom(null, (get, set) => {
  set(refreshAtom, get(refreshAtom) + 1);
});
