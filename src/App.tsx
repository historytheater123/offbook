import { ScriptProvider, useScript } from './contexts/ScriptContext';
import { Splash } from './screens/Splash';
import { ScriptUpload } from './screens/ScriptUpload';
import { CharacterSelect } from './screens/CharacterSelect';
import { SceneSelect } from './screens/SceneSelect';
import { Rehearsal } from './screens/Rehearsal';
import { RunStats } from './screens/RunStats';

function StepRenderer() {
  const { currentStep } = useScript();
  switch (currentStep) {
    case 'splash': return <Splash />;
    case 'upload': return <ScriptUpload />;
    case 'character-select': return <CharacterSelect />;
    case 'scene-select': return <SceneSelect />;
    case 'rehearsal': return <Rehearsal />;
    case 'stats': return <RunStats />;
    default: return <Splash />;
  }
}

export default function App() {
  return (
    <ScriptProvider>
      <StepRenderer />
    </ScriptProvider>
  );
}
