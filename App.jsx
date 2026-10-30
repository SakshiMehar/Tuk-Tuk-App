import React from 'react';
import { AppProviders } from '@app/AppProviders';
import { AppBootstrap } from '@app/AppBootstrap';
import { AppNavigator } from '@navigation/AppNavigator';

export function App() {
  return (
    <AppProviders>
      <AppBootstrap>
        <AppNavigator />
      </AppBootstrap>
    </AppProviders>
  );
}

export default App;
