import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  styled,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
  Spacer,
  useGlobal,
} from 'qapp-core';
import { useEffect, useState } from 'react';
import { BarSpinner } from '../common/Spinners/BarSpinner/BarSpinner';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import { useSetAtom } from 'jotai';
import { namesAtom, pendingTxsAtom } from '../state/global/names';
export enum Availability {
  NULL = 'null',
  LOADING = 'loading',
  AVAILABLE = 'available',
  NOT_AVAILABLE = 'not-available',
}

const Label = styled('label')`
  display: block;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 4px;
`;

const RegisterName = () => {
  const [isOpen, setIsOpen] = useState(false);
  const balance = useGlobal().auth.balance;
  const setNames = useSetAtom(namesAtom);

  const address = useGlobal().auth.address;
  const [nameValue, setNameValue] = useState('');
  const [isNameAvailable, setIsNameAvailable] = useState<Availability>(
    Availability.NULL
  );
  const setPendingTxs = useSetAtom(pendingTxsAtom);

  const [isLoadingRegisterName, setIsLoadingRegisterName] = useState(false);
  const theme = useTheme();
  const [nameFee, setNameFee] = useState(null);
  const registerNameFunc = async () => {
    if (!address) return;
    const loadId = showLoading('Registering name...please wait');
    try {
      setIsLoadingRegisterName(true);
      const res = await qortalRequest({
        action: 'REGISTER_NAME',
        name: nameValue,
      });
      setPendingTxs((prev) => {
        return {
          ...prev, // preserve existing categories
          ['REGISTER_NAME']: {
            ...(prev['REGISTER_NAME'] || {}), // preserve existing transactions in this category
            [res.signature]: {
              ...res,
              status: 'PENDING',
              callback: () => {
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
      showSuccess('Successfully registered a name');
      setNameValue('');
      setIsOpen(false);
    } catch (error) {
      showError(error?.message || 'Unable to register name');
    } finally {
      setIsLoadingRegisterName(false);
      dismissToast(loadId);
    }
  };

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
      checkIfNameExisits(nameValue);
    }, 500);

    // Cleanup timeout if searchValue changes before the timeout completes
    return () => {
      clearTimeout(handler);
    };
  }, [nameValue]);

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
    <>
      <Button
        // disabled={!nameValue?.trim()}
        onClick={() => setIsOpen(true)}
        variant="outlined"
        sx={{
          flexShrink: 0,
        }}
      >
        new name
      </Button>
      <Dialog
        open={isOpen}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Register name'}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              width: '400px',
              maxWidth: '90vw',
              height: '250px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
            }}
          >
            <Label>Choose a name</Label>
            <TextField
              autoComplete="off"
              autoFocus
              onChange={(e) => setNameValue(e.target.value)}
              value={nameValue}
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
                <Typography>{nameValue} is available</Typography>
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
                <Typography>{nameValue} is unavailable</Typography>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isLoadingRegisterName}
            variant="contained"
            onClick={() => {
              setIsOpen(false);
              setNameValue('');
            }}
          >
            Close
          </Button>
          <Button
            disabled={
              !nameValue.trim() ||
              isLoadingRegisterName ||
              isNameAvailable !== Availability.AVAILABLE ||
              !balance ||
              (balance && nameFee && +balance < +nameFee)
            }
            variant="contained"
            onClick={registerNameFunc}
            autoFocus
          >
            Register Name
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RegisterName;
