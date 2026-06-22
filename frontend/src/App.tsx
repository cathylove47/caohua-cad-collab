import { useEffect } from 'react';
import { CanvasViewport } from './components/CanvasViewport';
import { FeatureTree } from './components/FeatureTree';
import { InspectorPanel } from './components/InspectorPanel';
import { LoginScreen } from './components/LoginScreen';
import { StatusPanel } from './components/StatusPanel';
import { Toolbar } from './components/Toolbar';
import { useCadStore } from './store/useCadStore';
import './App.css';

function App() {
  const session = useCadStore((state) => state.session);
  const connectSession = useCadStore((state) => state.connectSession);
  const connectionStatus = useCadStore((state) => state.connectionStatus);

  useEffect(() => {
    if (session && connectionStatus === 'disconnected') {
      void connectSession();
    }
  }, [connectSession, connectionStatus, session]);

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="app-shell">
      <Toolbar />
      <main className="workspace-grid">
        <FeatureTree />
        <CanvasViewport />
        <InspectorPanel />
      </main>
      <StatusPanel />
    </div>
  );
}

export default App;
