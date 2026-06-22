import { useCadStore } from '../store/useCadStore';

export function FeatureTree() {
  const objects = useCadStore((state) => state.objects);
  const selectedId = useCadStore((state) => state.selectedId);
  const selectObject = useCadStore((state) => state.selectObject);

  return (
    <aside className="panel side-panel">
      <div className="panel-header">
        <h2>Feature Tree</h2>
        <span>{objects.length} items</span>
      </div>
      <div className="feature-list">
        {objects.map((object) => (
          <button
            type="button"
            key={object.id}
            className={`feature-item ${selectedId === object.id ? 'active' : ''}`}
            onClick={() => selectObject(object.id)}
          >
            <strong>{object.name}</strong>
            <span>{object.type}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
