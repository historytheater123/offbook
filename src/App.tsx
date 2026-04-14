import { ScriptProvider, useScript } from './contexts/ScriptContext';
import { Landing } from './screens/Landing';
import { Auth } from './screens/Auth';
import { Dashboard } from './screens/Dashboard';
import { ScriptUpload } from './screens/ScriptUpload';
import { CharacterSelect } from './screens/CharacterSelect';
import { SceneSelect } from './screens/SceneSelect';
import { Rehearsal } from './screens/Rehearsal';
import { RunStats } from './screens/RunStats';

function StepRenderer() {
  const { currentStep } = useScript();
  switch (currentStep) {
    case 'landing':         return <Landing />;
    case 'auth':            return <Auth />;
    case 'dashboard':       return <Dashboard />;
    case 'upload':          return <ScriptUpload />;
    case 'character-select': return <CharacterSelect />;
    case 'scene-select':    return <SceneSelect />;
    case 'rehearsal':       return <Rehearsal />;
    case 'stats':           return <RunStats />;
    default:                return <Landing />;
  }
}

export default function App() {
  return (
    <ScriptProvider>
      <div style={{
        maxWidth: 390,
        margin: '0 auto',
        minHeight: '100dvh',
        background: '#FAFAF8',
        position: 'relative',
        boxShadow: '0 0 0 1px #E5E4E0',
      }}>
        <StepRenderer />
      </div>
    </ScriptProvider>
  );
}
