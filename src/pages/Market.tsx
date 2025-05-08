import { Box, TextField } from '@mui/material';
import { ForSaleTable } from '../components/Tables/ForSaleTable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { forSaleAtom } from '../state/global/names';
import { useAtom } from 'jotai';

export const Market = () => {
  const [namesForSale] = useAtom(forSaleAtom);
  const [sortBy, setSortBy] = useState<'name' | 'salePrice'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterValue, setFilterValue] = useState('');
  const [value, setValue] = useState('');
  const namesForSaleFiltered = useMemo(() => {
    const lowerFilter = filterValue.trim().toLowerCase();

    const filtered = !lowerFilter
      ? namesForSale
      : namesForSale.filter((item) =>
          item.name.toLowerCase().includes(lowerFilter)
        );

    return [...filtered].sort((a, b) => {
      let aVal: string | number = a[sortBy];
      let bVal: string | number = b[sortBy];

      // Convert salePrice strings to numbers for comparison
      if (sortBy === 'salePrice') {
        aVal = parseFloat(aVal as string);
        bVal = parseFloat(bVal as string);
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [namesForSale, sortBy, sortDirection, filterValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterValue(value);
    }, 500);

    // Cleanup timeout if searchValue changes before the timeout completes
    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  const handleSort = useCallback(
    (field: 'name' | 'salePrice') => {
      if (sortBy === field) {
        // Toggle direction
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        // Change field and reset direction
        setSortBy(field);
        setSortDirection('asc');
      }
    },
    [sortBy]
  );

  return (
    <div>
      <Box
        sx={{
          width: '100%',
          height: '60px',
          padding: '10px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Filter names"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          size="small"
        />
      </Box>
      <ForSaleTable
        namesForSale={namesForSaleFiltered}
        sortBy={sortBy}
        sortDirection={sortDirection}
        handleSort={handleSort}
      />
    </div>
  );
};
