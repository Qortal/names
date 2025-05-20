// PendingTxsProvider.tsx
import { ReactNode, useCallback, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { primaryNameAtom } from '../global/names';
import { FetchNamesContext } from '../../hooks/useFetchNames';

export const FetchNamesProvider = ({ children }: { children: ReactNode }) => {
  const setPrimaryName = useSetAtom(primaryNameAtom);
  const fetchPrimaryName = useCallback(
    async (address: string) => {
      if (!address) return;
      try {
        const res = await qortalRequest({
          action: 'GET_ACCOUNT_NAMES',
          address,
          limit: 0,
          offset: 0,
          reverse: false,
        });
        if (res?.length > 0) {
          setPrimaryName(res[0]?.name);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [setPrimaryName]
  );

  const value = useMemo(
    () => ({
      fetchPrimaryName,
    }),
    [fetchPrimaryName]
  );

  return (
    <FetchNamesContext.Provider value={value}>
      {children}
    </FetchNamesContext.Provider>
  );
};
