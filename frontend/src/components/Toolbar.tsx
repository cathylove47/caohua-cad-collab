import { useCadStore } from '../store/useCadStore';

export function Toolbar() {
  const addObject = useCadStore((state) => state.addObject);
  const extrudeSelected = useCadStore((state) => state.extrudeSelected);
  const cutSelected = useCadStore((state) => state.cutSelected);
  const deleteSelected = useCadStore((state) => state.deleteSelected);
  const saveProject = useCadStore((state) => state.saveProject);
  const loadProject = useCadStore((state) => state.loadProject);
  const undo = useCadStore((state) => state.undo);
  const redo = useCadStore((state) => state.redo);
  const smartCommand = useCadStore((state) => state.smartCommand);
  const setSmartCommand = useCadStore((state) => state.setSmartCommand);
  const runSmartCommand = useCadStore((state) => state.runSmartCommand);

  return (
    <header className="toolbar">
      <div className="toolbar-group">
        <span className="toolbar-title">Primitives</span>
        <button type="button" onClick={() => addObject('box')}>Box</button>
        <button type="button" onClick={() => addObject('cylinder')}>Cylinder</button>
        <button type="button" onClick={() => addObject('sphere')}>Sphere</button>
      </div>
      <div className="toolbar-group">
        <span className="toolbar-title">Sketch</span>
        <button type="button" onClick={() => addObject('sketch-line')}>Line</button>
        <button type="button" onClick={() => addObject('sketch-circle')}>Circle</button>
        <button type="button" onClick={() => addObject('sketch-rectangle')}>Rectangle</button>
        <button type="button" onClick={extrudeSelected}>Extrude</button>
        <button type="button" onClick={cutSelected}>Cut</button>
      </div>
      <div className="toolbar-group">
        <span className="toolbar-title">Project</span>
        <button type="button" onClick={() => void saveProject()}>Save</button>
        <button type="button" onClick={() => void loadProject()}>Load</button>
        <button type="button" onClick={undo}>Undo</button>
        <button type="button" onClick={redo}>Redo</button>
        <button type="button" onClick={deleteSelected}>Delete</button>
      </div>
      <div className="toolbar-group toolbar-command-group">
        <span className="toolbar-title">Smart Assist</span>
        <input
          className="toolbar-command-input"
          value={smartCommand}
          onChange={(event) => setSmartCommand(event.target.value)}
          placeholder="创建 box width 4 height 2 depth 3"
        />
        <button type="button" onClick={runSmartCommand}>Run</button>
      </div>
    </header>
  );
}
