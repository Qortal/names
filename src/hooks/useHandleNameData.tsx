import { useSetAtom } from 'jotai';
import { forSaleAtom, namesAtom } from '../state/global/names';
import { useCallback, useEffect } from 'react';
import { useGlobal } from 'qapp-core';
import { usePendingTxs } from './useHandlePendingTxs';

export const useHandleNameData = () => {
  const setNamesForSale = useSetAtom(forSaleAtom);
  const setNames = useSetAtom(namesAtom);
  const address = useGlobal().auth.address;
  const { clearPendingTxs } = usePendingTxs();

  const getNamesForSale = useCallback(async () => {
    try {
      const res = await fetch('/names/forsale?limit=0&reverse=true');
      const data = await res.json();
      setNamesForSale(data);
    } catch (error) {
      console.error(error);
    }
  }, [setNamesForSale]);

  const getMyNames = useCallback(async () => {
    if (!address) return;
    try {
      const res = await qortalRequest({
        action: 'GET_ACCOUNT_NAMES',
        address,
        limit: 0,
        offset: 0,
        reverse: false,
      });
      clearPendingTxs(
        'REGISTER_NAMES',
        'name',
        res?.map((item) => item.name)
      );
      setNames(res);
    } catch (error) {
      console.error(error);
    }
  }, [address, setNames]);

  // Initial fetch + interval
  useEffect(() => {
    getNamesForSale();
    const interval = setInterval(getNamesForSale, 120_000); // every 2 minutes
    return () => clearInterval(interval);
  }, [getNamesForSale]);

  useEffect(() => {
    getMyNames();
    // const interval = setInterval(getMyNames, 120_000); // every 2 minutes
    // return () => clearInterval(interval);
  }, [getMyNames]);

  return null;
};
