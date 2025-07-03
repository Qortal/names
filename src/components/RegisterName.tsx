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
import { useEffect, useMemo, useState } from 'react';
import { BarSpinner } from '../common/Spinners/BarSpinner/BarSpinner';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import { useAtom, useSetAtom } from 'jotai';
import {
  forSaleAtom,
  namesAtom,
  pendingTxsAtom,
  primaryNameAtom,
} from '../state/global/names';
import { Availability } from '../interfaces';
import { useTranslation } from 'react-i18next';

const Label = styled('label')`
  display: block;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 4px;
`;

const RegisterName = () => {
  const { t } = useTranslation(['core']);

  const [isOpen, setIsOpen] = useState(false);
  const balance = useGlobal().auth.balance;
  const setNames = useSetAtom(namesAtom);
  const [namesForSale] = useAtom(forSaleAtom);
  const [primaryName] = useAtom(primaryNameAtom);
  const [pendingTxs] = useAtom(pendingTxsAtom);
  const address = useGlobal().auth.address;
  const [nameValue, setNameValue] = useState('');
  const [isNameAvailable, setIsNameAvailable] = useState<Availability>(
    Availability.NULL
  );
  const setPendingTxs = useSetAtom(pendingTxsAtom);

  const [isLoadingRegisterName, setIsLoadingRegisterName] = useState(false);
  const theme = useTheme();
  const [nameFee, setNameFee] = useState<number | null>(null);
  const isPrimaryNameForSale = useMemo(() => {
    if (!primaryName) return false;
    const findPendingNameSellTx = pendingTxs?.['SELL_NAME'];
    let isOnSale = false;
    if (findPendingNameSellTx) {
      Object.values(findPendingNameSellTx).forEach((value) => {
        if (value?.name === primaryName) {
          isOnSale = true;
          return;
        }
      });
    }
    if (isOnSale) return true;
    const findNameIndex = namesForSale?.findIndex(
      (item) => item?.name === primaryName
    );
    if (findNameIndex === -1) return false;
    return true;
  }, [namesForSale, primaryName, pendingTxs]);
  const registerNameFunc = async () => {
    if (!address) return;
    const loadId = showLoading(
      t('core:new_name.responses.loading', {
        postProcess: 'capitalizeFirstChar',
      })
    );
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
      showSuccess(
        t('core:new_name.responses.success', {
          postProcess: 'capitalizeFirstChar',
        })
      );
      setNameValue('');
      setIsOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError(
          t('core:new_name.responses.error', {
            postProcess: 'capitalizeFirstChar',
          })
        );
      }
    } finally {
      setIsLoadingRegisterName(false);
      dismissToast(loadId);
    }
  };

  const checkIfNameExisits = async (name: string) => {
    if (!name?.trim()) {
      setIsNameAvailable(Availability.NULL);

      return;
    }
    setIsNameAvailable(Availability.LOADING);
    try {
      const res = await fetch(`/names/` + name);
      const data = await res.json();
      if (data?.message === 'name unknown' || data?.error) {
        setIsNameAvailable(Availability.AVAILABLE);
      } else {
        setIsNameAvailable(Availability.NOT_AVAILABLE);
      }
    } catch (error) {
      setIsNameAvailable(Availability.AVAILABLE);
      console.error(error);
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

        setNameFee(Number((Number(fee) / 1e8).toFixed(8)));
      } catch (error) {
        console.error(error);
      }
    };
    nameRegistrationFee();
  }, []);

  return (
    <>
      <Button
        disabled={isPrimaryNameForSale}
        onClick={() => setIsOpen(true)}
        variant="outlined"
        sx={{
          flexShrink: 0,
        }}
      >
        {t('core:actions.new_name', {
          postProcess: 'capitalizeFirstChar',
        })}
      </Button>
      <Dialog
        open={isOpen}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('core:actions.register_name', {
            postProcess: 'capitalizeFirstChar',
          })}
        </DialogTitle>
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
            <Label></Label>
            <TextField
              autoComplete="off"
              autoFocus
              onChange={(e) => setNameValue(e.target.value)}
              value={nameValue}
              placeholder={t('core:new_name.choose_name', {
                postProcess: 'capitalizeFirstChar',
              })}
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
                    {t('balance_message', {
                      balance: balance ?? 0,
                      nameFee,
                      postProcess: 'capitalizeFirstChar',
                    })}
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
                <Typography>
                  {t('core:new_name.name_available', { name: nameValue })}
                </Typography>
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
                <Typography>
                  {t('core:new_name.name_unavailable', { name: nameValue })}
                </Typography>
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
                <Typography>
                  {t('core:new_name.checking_name', {
                    postProcess: 'capitalizeFirstChar',
                  })}
                </Typography>
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
            {t('core:actions.close', {
              postProcess: 'capitalizeFirstChar',
            })}
          </Button>
          <Button
            disabled={Boolean(
              !nameValue.trim() ||
                isLoadingRegisterName ||
                isNameAvailable !== Availability.AVAILABLE ||
                !balance ||
                (balance && nameFee && +balance < +nameFee)
            )}
            variant="contained"
            onClick={registerNameFunc}
            autoFocus
          >
            {t('core:actions.register_name', {
              postProcess: 'capitalizeFirstChar',
            })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RegisterName;
