import { useCadStore } from '../store/useCadStore';

export function LoginScreen() {
  const loginForm = useCadStore((state) => state.loginForm);
  const setLoginForm = useCadStore((state) => state.setLoginForm);
  const connectSession = useCadStore((state) => state.connectSession);
  const notice = useCadStore((state) => state.notice);

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="eyebrow">Cloud CAD MVP</div>
        <h1>基于云的协同机械 CAD 系统</h1>
        <p className="login-copy">
          输入用户名和房间号即可进入本地演示环境。系统采用前端重计算 + 后端轻状态广播的课程设计 MVP 架构。
        </p>
        <label>
          用户名
          <input value={loginForm.username} onChange={(event) => setLoginForm({ username: event.target.value })} />
        </label>
        <label>
          房间号
          <input value={loginForm.roomId} onChange={(event) => setLoginForm({ roomId: event.target.value })} />
        </label>
        <button type="button" className="primary-button" onClick={() => void connectSession()}>
          进入协同房间
        </button>
        <div className="hint-text">{notice}</div>
      </div>
    </div>
  );
}
