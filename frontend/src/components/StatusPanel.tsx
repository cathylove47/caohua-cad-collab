import { useCadStore } from '../store/useCadStore';

export function StatusPanel() {
  const session = useCadStore((state) => state.session);
  const users = useCadStore((state) => state.users);
  const connectionStatus = useCadStore((state) => state.connectionStatus);
  const notice = useCadStore((state) => state.notice);
  const disconnectSession = useCadStore((state) => state.disconnectSession);

  return (
    <div className="status-panel">
      <div>
        <strong>Room</strong>
        <span>{session?.roomId ?? '-'}</span>
      </div>
      <div>
        <strong>Status</strong>
        <span className={`status-pill ${connectionStatus}`}>{connectionStatus}</span>
      </div>
      <div className="user-list">
        <strong>Online</strong>
        <div className="user-chips">
          {users.map((user) => (
            <span key={user.userId} className="user-chip" style={{ borderColor: user.color }}>
              <i style={{ backgroundColor: user.color }} />
              {user.username}
            </span>
          ))}
        </div>
      </div>
      <div className="notice-text">{notice}</div>
      <button type="button" className="ghost-button" onClick={disconnectSession}>
        Exit Room
      </button>
    </div>
  );
}
