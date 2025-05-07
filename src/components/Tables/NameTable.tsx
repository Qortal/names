import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  useTheme,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { useAtom } from 'jotai';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { forSaleAtom, namesAtom } from '../../state/global/names';
import PersonIcon from '@mui/icons-material/Person';
import { useModal } from '../../hooks/useModal';
import {
  dismissToast,
  ImagePicker,
  RequestQueueWithPromise,
  showError,
  showLoading,
  showSuccess,
  Spacer,
  useGlobal,
} from 'qapp-core';
import { Availability } from '../RegisterName';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import { BarSpinner } from '../../common/Spinners/BarSpinner/BarSpinner';
interface NameData {
  name: string;
  isSelling?: boolean;
}

const getNameQueue = new RequestQueueWithPromise(2);

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

function fixedHeaderContent() {
  return (
    <TableRow
      sx={{
        backgroundColor: 'background.paper',
      }}
    >
      <TableCell>Name</TableCell>
      <TableCell>Actions</TableCell>
    </TableRow>
  );
}

const ManageAvatar = ({ name, modalFunctionsAvatar }) => {
  const [hasAvatar, setHasAvatar] = useState<boolean | null>(null);

  const checkIfAvatarExists = useCallback(async (name) => {
    try {
      const identifier = `qortal_avatar`;
      const url = `/arbitrary/resources/searchsimple?mode=ALL&service=THUMBNAIL&identifier=${identifier}&limit=1&name=${name}&includemetadata=false&prefix=true`;
      const response = await getNameQueue.enqueue(() =>
        fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const responseData = await response.json();
      if (responseData?.length > 0) {
        setHasAvatar(true);
      } else {
        setHasAvatar(false);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);
  useEffect(() => {
    if (!name) return;
    checkIfAvatarExists(name);
  }, [name, checkIfAvatarExists]);
  return (
    <Button
      variant="outlined"
      size="small"
      disabled={hasAvatar === null}
      onClick={() => modalFunctionsAvatar.show({ name, hasAvatar })}
    >
      {hasAvatar === null ? (
        <CircularProgress size={10} />
      ) : hasAvatar ? (
        'Change avatar'
      ) : (
        'Set avatar'
      )}
    </Button>
  );
};

function rowContent(
  _index: number,
  row: NameData,
  primaryName?: string,
  modalFunctions?: any,
  modalFunctionsUpdateName?: any,
  modalFunctionsAvatar?: any,
  modalFunctionsSellName?: any
) {
  const handleUpdate = async (name: string) => {
    try {
      const response = await modalFunctionsUpdateName.show();
      console.log('Update:', row.name);
      console.log('hello', response);
      await qortalRequest({
        action: 'UPDATE_NAME',
        newName: response,
        oldName: name,
      });
    } catch (error) {
      console.log('error', error);
    }

    // Your logic here
  };

  const handleSell = async (name: string) => {
    try {
      if (name === primaryName) {
        await modalFunctions.show({ name });
      }
      const price = await modalFunctionsSellName.show(name);
      console.log('hello');
      await qortalRequest({
        action: 'SELL_NAME',
        nameForSale: name,
        salePrice: price,
      });
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleCancel = async (name: string) => {
    try {
      console.log('hello', name);
      await qortalRequest({
        action: 'CANCEL_SELL_NAME',
        nameForSale: name,
      });
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <>
      <TableCell>
        <Box
          sx={{
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}
        >
          {primaryName === row.name && (
            <Tooltip
              title="This is your primary name ( identity )"
              placement="left"
              arrow
              sx={{ fontSize: '24' }}
            >
              <PersonIcon color="success" />
            </Tooltip>
          )}
          {row.name}
        </Box>
      </TableCell>
      <TableCell>
        <Box
          sx={{
            display: 'flex',
            gap: '5px',
            flexWrap: 'wrap',
          }}
        >
          <Button
            color={primaryName === row.name ? 'warning' : 'primary'}
            variant="outlined"
            size="small"
            onClick={() => handleUpdate(row.name)}
          >
            Update
          </Button>
          {!row.isSelling ? (
            <Button
              color={primaryName === row.name ? 'warning' : 'primary'}
              size="small"
              variant="outlined"
              onClick={() => handleSell(row.name)}
            >
              Sell
            </Button>
          ) : (
            <Button
              color="error"
              size="small"
              onClick={() => handleCancel(row.name)}
            >
              Cancel Sell
            </Button>
          )}
          <ManageAvatar
            name={row.name}
            modalFunctionsAvatar={modalFunctionsAvatar}
          />
        </Box>
      </TableCell>
    </>
  );
}

export const NameTable = ({ names, primaryName }) => {
  // const [names, setNames] = useAtom(namesAtom);
  const [namesForSale] = useAtom(forSaleAtom);
  const modalFunctions = useModal();
  const modalFunctionsUpdateName = useModal();
  const modalFunctionsAvatar = useModal();
  const modalFunctionsSellName = useModal();

  console.log('names', names);
  const namesToDisplay = useMemo(() => {
    const namesForSaleString = namesForSale.map((item) => item.name);
    return names.map((name) => {
      return {
        name: name.name,
        isSelling: namesForSaleString.includes(name.name),
      };
    });
  }, [names, namesForSale]);

  return (
    <Paper
      sx={{
        height: 'calc(100vh - 64px - 60px)', // Header + footer height
        width: '100%',
      }}
    >
      <TableVirtuoso
        data={namesToDisplay}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={(index, row) =>
          rowContent(
            index,
            row,
            primaryName,
            modalFunctions,
            modalFunctionsUpdateName,
            modalFunctionsAvatar,
            modalFunctionsSellName
          )
        }
      />
      {modalFunctions?.isShow && (
        <Dialog
          open={modalFunctions?.isShow}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Warning</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Caution when selling your primary name
            </DialogContentText>
            <Spacer height="20px" />
            <DialogContentText id="alert-dialog-description2">
              {modalFunctions?.data?.name} is your primary name. If you are an
              admin of a private group, selling this name will remove your group
              keys for the group. Make sure another admin re-encrypts the latest
              keys before selling. Proceed with caution!
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              color="warning"
              variant="contained"
              onClick={modalFunctions.onOk}
              autoFocus
            >
              continue
            </Button>
            <Button variant="contained" onClick={modalFunctions.onCancel}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {modalFunctionsUpdateName?.isShow && (
        <UpdateNameModal modalFunctionsUpdateName={modalFunctionsUpdateName} />
      )}
      {modalFunctionsAvatar?.isShow && (
        <AvatarModal modalFunctionsAvatar={modalFunctionsAvatar} />
      )}
      {modalFunctionsSellName?.isShow && (
        <SellNameModal modalFunctionsSellName={modalFunctionsSellName} />
      )}
    </Paper>
  );
};

const AvatarModal = ({ modalFunctionsAvatar }) => {
  const [arbitraryFee, setArbitraryFee] = useState('');
  const [pickedAvatar, setPickedAvatar] = useState<any>(null);
  const [isLoadingPublish, setIsLoadingPublish] = useState(false);
  const theme = useTheme();
  console.log('pickedAvatar', pickedAvatar);
  useEffect(() => {
    const getArbitraryName = async () => {
      try {
        const data = await fetch(`/transactions/unitfee?txType=ARBITRARY`);
        const fee = await data.text();

        setArbitraryFee((Number(fee) / 1e8).toFixed(8));
      } catch (error) {
        console.error(error);
      }
    };
    getArbitraryName();
  }, []);

  const publishAvatar = async () => {
    const loadId = showLoading('Publishing avatar...please wait');
    try {
      setIsLoadingPublish(true);
      await qortalRequest({
        action: 'PUBLISH_QDN_RESOURCE',
        base64: pickedAvatar?.base64,
        service: 'THUMBNAIL',
        identifier: 'qortal_avatar',
        name: modalFunctionsAvatar.data.name,
      });
      showSuccess('Successfully published avatar');
      modalFunctionsAvatar.onOk();
    } catch (error) {
      showError(error?.message || 'Unable to publish avatar');
    } finally {
      dismissToast(loadId);
      setIsLoadingPublish(false);
    }
  };

  return (
    <Dialog
      open={modalFunctionsAvatar?.isShow}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Publish Avatar</DialogTitle>
      <DialogContent
        sx={{
          width: '300px',
          maxWidth: '95vw',
        }}
      >
        <Spacer height="20px" />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {modalFunctionsAvatar.data.hasAvatar && !pickedAvatar?.base64 && (
            <Avatar
              sx={{
                height: '138px',
                width: '138px',
              }}
              src={`/arbitrary/THUMBNAIL/${modalFunctionsAvatar.data.name}/qortal_avatar?async=true`}
              alt={modalFunctionsAvatar.data.name}
            >
              <CircularProgress />
            </Avatar>
          )}
          {pickedAvatar?.base64 && (
            <Avatar
              sx={{
                height: '138px',
                width: '138px',
              }}
              src={`data:image/webp;base64,${pickedAvatar?.base64}`}
              alt={modalFunctionsAvatar.data.name}
            >
              <CircularProgress />
            </Avatar>
          )}

          {pickedAvatar?.name && (
            <>
              <Spacer height="10px" />
              <Typography variant="body2">{pickedAvatar?.name}</Typography>
            </>
          )}

          <Spacer height="20px" />
          <Typography
            sx={{
              fontSize: '12px',
            }}
          >
            (500 KB max. for GIFS){' '}
          </Typography>
          <ImagePicker onPick={(file) => setPickedAvatar(file)} mode="single">
            <Button variant="contained">Choose Image</Button>
          </ImagePicker>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={!pickedAvatar?.base64 || isLoadingPublish}
          variant="contained"
          onClick={publishAvatar}
          autoFocus
        >
          publish
        </Button>
        <Button variant="contained" onClick={modalFunctionsAvatar.onCancel}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UpdateNameModal = ({ modalFunctionsUpdateName }) => {
  const [step, setStep] = useState(1);
  const [newName, setNewName] = useState('');
  const [isNameAvailable, setIsNameAvailable] = useState<Availability>(
    Availability.NULL
  );
  const [nameFee, setNameFee] = useState(null);
  const balance = useGlobal().auth.balance;

  const theme = useTheme();

  const checkIfNameExisits = async (name) => {
    if (!name?.trim()) {
      setIsNameAvailable(Availability.NULL);

      return;
    }
    setIsNameAvailable(Availability.LOADING);
    try {
      const res = await fetch(`/names/` + name);
      const data = await res.json();
      if (data?.message === 'name unknown') {
        setIsNameAvailable(Availability.AVAILABLE);
      } else {
        setIsNameAvailable(Availability.NOT_AVAILABLE);
      }
    } catch (error) {
      console.error(error);
    } finally {
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      checkIfNameExisits(newName);
    }, 500);

    // Cleanup timeout if searchValue changes before the timeout completes
    return () => {
      clearTimeout(handler);
    };
  }, [newName]);

  useEffect(() => {
    const nameRegistrationFee = async () => {
      try {
        const data = await fetch(`/transactions/unitfee?txType=REGISTER_NAME`);
        const fee = await data.text();

        setNameFee((Number(fee) / 1e8).toFixed(8));
      } catch (error) {
        console.error(error);
      }
    };
    nameRegistrationFee();
  }, []);

  return (
    <Dialog
      open={modalFunctionsUpdateName?.isShow}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {step === 1 && (
        <>
          <DialogTitle id="alert-dialog-title">Warning</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Caution when updating your name
            </DialogContentText>
            <Spacer height="20px" />
            <DialogContentText id="alert-dialog-description2">
              If you update your Name, you will forfeit the resources associated
              with the original Name. In other words, you will lose ownership of
              the content under the original Name on QDN. Proceed with caution!
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              color="warning"
              variant="contained"
              onClick={() => setStep(2)}
              autoFocus
            >
              continue
            </Button>
            <Button
              variant="contained"
              onClick={modalFunctionsUpdateName.onCancel}
            >
              Cancel
            </Button>
          </DialogActions>
        </>
      )}
      {step === 2 && (
        <>
          <DialogTitle id="alert-dialog-title">Warning</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Choose new name
            </DialogContentText>
            <Spacer height="20px" />
            <TextField
              autoComplete="off"
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              value={newName}
              placeholder="Choose a name"
            />
            {(!balance || (nameFee && balance && balance < nameFee)) && (
              <>
                <Spacer height="10px" />
                <Box
                  sx={{
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center',
                  }}
                >
                  <ErrorIcon
                    sx={{
                      color: theme.palette.text.primary,
                    }}
                  />
                  <Typography>
                    Your balance is {balance ?? 0} QORT. A name registration
                    requires a {nameFee} QORT fee
                  </Typography>
                </Box>
                <Spacer height="10px" />
              </>
            )}
            <Spacer height="5px" />
            {isNameAvailable === Availability.AVAILABLE && (
              <Box
                sx={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                <CheckIcon
                  sx={{
                    color: theme.palette.text.primary,
                  }}
                />
                <Typography>{newName} is available</Typography>
              </Box>
            )}
            {isNameAvailable === Availability.NOT_AVAILABLE && (
              <Box
                sx={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                <ErrorIcon
                  sx={{
                    color: theme.palette.text.primary,
                  }}
                />
                <Typography>{newName} is unavailable</Typography>
              </Box>
            )}
            {isNameAvailable === Availability.LOADING && (
              <Box
                sx={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                <BarSpinner width="16px" color={theme.palette.text.primary} />
                <Typography>Checking if name already existis</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              color="primary"
              variant="contained"
              disabled={
                !newName?.trim() ||
                isNameAvailable !== Availability.AVAILABLE ||
                !balance ||
                (balance && nameFee && +balance < +nameFee)
              }
              onClick={() => modalFunctionsUpdateName.onOk(newName.trim())}
              autoFocus
            >
              continue
            </Button>
            <Button
              color="secondary"
              variant="contained"
              onClick={modalFunctionsUpdateName.onCancel}
            >
              Cancel
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

const SellNameModal = ({ modalFunctionsSellName }) => {
  const [price, setPrice] = useState(0);

  return (
    <Dialog
      open={modalFunctionsSellName?.isShow}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Selling name</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Choose selling price
        </DialogContentText>
        <Spacer height="20px" />
        <TextField
          autoComplete="off"
          autoFocus
          onChange={(e) => setPrice(+e.target.value)}
          value={price}
          type="number"
          placeholder="Choose a name"
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          variant="contained"
          disabled={!price}
          onClick={() => modalFunctionsSellName.onOk(price)}
          autoFocus
        >
          continue
        </Button>
        <Button
          color="secondary"
          variant="contained"
          onClick={modalFunctionsSellName.onCancel}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
