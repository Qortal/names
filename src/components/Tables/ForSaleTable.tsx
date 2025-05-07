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
import { useAtom } from 'jotai';
import { forwardRef, useMemo } from 'react';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { forSaleAtom, namesAtom } from '../../state/global/names';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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

function rowContent(_index: number, row: NameData) {
  const handleUpdate = () => {
    console.log('Update:', row.name);
    // Your logic here
  };

  const handleBuy = async (name: string) => {
    try {
      console.log('hello');
      await qortalRequest({
        action: 'BUY_NAME',
        nameForSale: name,
      });
    } catch (error) {
      console.log('error', error);
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
        itemContent={rowContent}
      />
    </Paper>
  );
};
