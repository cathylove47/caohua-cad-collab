import { useCadStore } from '../store/useCadStore';

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string | boolean | null | undefined;
  onChange: (value: number | string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function InspectorPanel() {
  const selected = useCadStore((state) => state.objects.find((item) => item.id === state.selectedId));
  const updateSelectedProperty = useCadStore((state) => state.updateSelectedProperty);
  const versions = useCadStore((state) => state.versions);
  const restoreProjectVersion = useCadStore((state) => state.restoreProjectVersion);
  const loadVersions = useCadStore((state) => state.loadVersions);

  return (
    <aside className="panel inspector-panel">
      <div className="panel-header">
        <h2>Properties</h2>
        <button type="button" onClick={() => void loadVersions()}>Refresh Versions</button>
      </div>

      {selected ? (
        <div className="property-section">
          <div className="object-meta">
            <strong>{selected.name}</strong>
            <span>{selected.type}</span>
            <span>By {selected.createdBy}</span>
          </div>

          <div className="field-grid">
            {Object.entries(selected.position).map(([key, value]) => (
              <NumberField key={key} label={`Position ${key}`} value={value} onChange={(next) => updateSelectedProperty('position', key, next)} />
            ))}
            {Object.entries(selected.rotation).map(([key, value]) => (
              <NumberField key={key} label={`Rotation ${key}`} value={value} onChange={(next) => updateSelectedProperty('rotation', key, next)} />
            ))}
            {Object.entries(selected.params).map(([key, value]) => (
              <NumberField key={key} label={key} value={value} onChange={(next) => updateSelectedProperty('params', key, next)} />
            ))}
          </div>

          {selected.note ? <div className="callout">{selected.note}</div> : null}
        </div>
      ) : (
        <div className="empty-state">Select an object to edit its parameters.</div>
      )}

      <div className="version-section">
        <div className="panel-subtitle">Versions</div>
        <div className="version-list">
          {versions.map((version) => (
            <div className="version-item" key={version.id}>
              <div>
                <strong>{version.id}</strong>
                <span>{version.objectCount} objects</span>
              </div>
              <button type="button" onClick={() => void restoreProjectVersion(version.id)}>Restore</button>
            </div>
          ))}
          {versions.length === 0 ? <div className="empty-state">No saved versions yet.</div> : null}
        </div>
      </div>
    </aside>
  );
}
