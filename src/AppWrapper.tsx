import { Routes } from './Routes';
import { GlobalProvider } from 'qapp-core';
import { publicSalt } from './qapp-config.ts';
import { PendingTxsProvider } from './state/contexts/PendingTxsProvider.tsx';
import { FetchNamesProvider } from './state/contexts/FetchNamesProvider.tsx';

export const AppWrapper = () => {
  return (
    <GlobalProvider
      config={{
        auth: {
          balanceSetting: {
            interval: 180000,
            onlyOnMount: false,
          },
          authenticateOnMount: true,
        },
        publicSalt: publicSalt,
        appName: 'names',
      }}
    >
      <FetchNamesProvider>
        <PendingTxsProvider>
          <Routes />
        </PendingTxsProvider>
      </FetchNamesProvider>
    </GlobalProvider>
  );
};
