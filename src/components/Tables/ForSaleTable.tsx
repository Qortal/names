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
import { useSetAtom } from 'jotai';
import { forwardRef } from 'react';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import {
  forSaleAtom,
  Names,
  namesAtom,
  NamesForSale,
  pendingTxsAtom,
  PendingTxsState,
} from '../../state/global/names';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { dismissToast, showError, showLoading, showSuccess } from 'qapp-core';
import { SetStateAction } from 'jotai';
import { SortBy, SortDirection } from '../../interfaces';

const VirtuosoTableComponents: TableComponents<NamesForSale> = {
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
  setSort: (field: SortBy) => void
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

type SetPendingTxs = (update: SetStateAction<PendingTxsState>) => void;

type SetNames = (update: SetStateAction<Names[]>) => void;

type SetNamesForSale = (update: SetStateAction<NamesForSale[]>) => void;

function rowContent(
  _index: number,
  row: NamesForSale,
  setPendingTxs: SetPendingTxs,
  setNames: SetNames,
  setNamesForSale: SetNamesForSale
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
      if (error instanceof Error) {
        showError(error?.message);
        return;
      }
      showError('Unable to purchase name');
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

interface ForSaleTable {
  namesForSale: NamesForSale[];
  sortDirection: SortDirection;
  sortBy: SortBy;
  handleSort: (sortBy: SortBy) => void;
}

export const ForSaleTable = ({
  namesForSale,
  sortDirection,
  sortBy,
  handleSort,
}: ForSaleTable) => {
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
        itemContent={(index, row: NamesForSale) =>
          rowContent(index, row, setPendingTxs, setNames, setNamesForSale)
        }
      />
    </Paper>
  );
};
