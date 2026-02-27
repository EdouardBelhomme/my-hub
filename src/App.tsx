import { LayoutProvider } from './components/layout/LayoutContext';
import { AccountProvider } from './components/layout/AccountContext';
import { Dashboard } from './components/core/Dashboard';

function App() {
  return (
    <AccountProvider>
      <LayoutProvider>
        <Dashboard />
      </LayoutProvider>
    </AccountProvider>
  );
}

export default App;
