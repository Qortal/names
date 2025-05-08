import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { forwardRef, useMemo } from 'react';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import {
  forSaleAtom,
  namesAtom,
  pendingTxsAtom,
} from '../../state/global/names';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
  useGlobal,
} from 'qapp-core';

interface NameData {
  name: string;
  isSelling?: boolean;
}

const VirtuosoTableComponents: TableComponents<NameData> = {
  Scroller: forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }}
    />
  ),
  TableHead: forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableHead {...props} ref={ref} />
  )),
  TableRow,
  TableBody: forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

function fixedHeaderContent(
  sortBy: string,
  sortDirection: string,
  setSort: (field: 'name' | 'salePrice') => void
) {
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;

    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
    );
  };

  const sortableCellSx = {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'action.selected',
    },
  };

  return (
    <TableRow sx={{ backgroundColor: 'background.paper' }}>
      <TableCell onClick={() => setSort('name')} sx={sortableCellSx}>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          Name {renderSortIcon('name')}
        </span>
      </TableCell>
      <TableCell onClick={() => setSort('salePrice')} sx={sortableCellSx}>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          Sale Price {renderSortIcon('salePrice')}
        </span>
      </TableCell>
      <TableCell>Actions</TableCell>
    </TableRow>
  );
}

function rowContent(
  _index: number,
  row: NameData,
  setPendingTxs,
  setNames,
  setNamesForSale,
  address
) {
  const handleBuy = async (name: string) => {
    const loadId = showLoading('Attempting to purchase name...please wait');

    try {
      const res = await qortalRequest({
        action: 'BUY_NAME',
        nameForSale: name,
      });
      showSuccess('Purchased name');
      setPendingTxs((prev) => {
        return {
          ...prev, // preserve existing categories
          ['BUY_NAME']: {
            ...(prev['BUY_NAME'] || {}), // preserve existing transactions in this category
            [res.signature]: {
              ...res,
              status: 'PENDING',
              callback: () => {
                setNamesForSale((prev) =>
                  prev.filter((item) => item?.name !== res.name)
                );
                setNames((prev) => [
                  ...prev,
                  {
                    name: res.name,
                    owner: res.creatorAddress,
                  },
                ]);
              },
            }, // add or overwrite this transaction
          },
        };
      });
    } catch (error) {
      showError(error?.message || 'Unable to purchase name');

      console.log('error', error);
    } finally {
      dismissToast(loadId);
    }
  };

  return (
    <>
      <TableCell>{row.name}</TableCell>
      <TableCell>{row.salePrice}</TableCell>
      <TableCell>
        <Button
          variant="contained"
          size="small"
          onClick={() => handleBuy(row.name)}
        >
          Buy
        </Button>
      </TableCell>
    </>
  );
}

export const ForSaleTable = ({
  namesForSale,
  sortDirection,
  sortBy,
  handleSort,
}) => {
  const address = useGlobal().auth.address;
  const setNames = useSetAtom(namesAtom);
  const setNamesForSale = useSetAtom(forSaleAtom);
  const setPendingTxs = useSetAtom(pendingTxsAtom);

  return (
    <Paper
      sx={{
        height: 'calc(100vh - 64px - 60px)', // Header + footer height
        width: '100%',
      }}
    >
      <TableVirtuoso
        data={namesForSale}
        components={VirtuosoTableComponents}
        fixedHeaderContent={() =>
          fixedHeaderContent(sortBy, sortDirection, handleSort)
        }
        itemContent={(index, row) =>
          rowContent(
            index,
            row,
            setPendingTxs,
            setNames,
            setNamesForSale,
            address
          )
        }
      />
    </Paper>
  );
};
