import { Routes } from './Routes';
import { GlobalProvider } from 'qapp-core';
import { publicSalt } from './qapp-config.ts';
import { PendingTxsProvider } from './state/contexts/PendingTxsProvider.tsx';

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
      <PendingTxsProvider>
        <Routes />
      </PendingTxsProvider>
    </GlobalProvider>
  );
};
