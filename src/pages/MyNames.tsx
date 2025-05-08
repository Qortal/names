import { useAtom, useSetAtom } from 'jotai';
import { useGlobal } from 'qapp-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { namesAtom } from '../state/global/names';
import { NameTable } from '../components/Tables/NameTable';
import { Box, Button, TextField } from '@mui/material';
import RegisterName from '../components/RegisterName';

export const MyNames = () => {
  const [names] = useAtom(namesAtom);
  const [value, setValue] = useState('');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterValue(value);
    }, 500);

    // Cleanup timeout if searchValue changes before the timeout completes
    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  const filteredNames = useMemo(() => {
    const lowerFilter = filterValue.trim().toLowerCase();
    const filtered = !lowerFilter
      ? names
      : names.filter((item) => item.name.toLowerCase().includes(lowerFilter));
    return filtered;
  }, [names, filterValue]);

  const primaryName = useMemo(() => {
    return names[0]?.name || '';
  }, [names]);
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
          justifyContent: 'space-between',
        }}
      >
        {' '}
        <TextField
          placeholder="Filter names"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          size="small"
        />
        <RegisterName />
      </Box>
      <NameTable names={filteredNames} primaryName={primaryName} />
    </div>
  );
};
