import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  ['⌂', 'Dashboard', '/dashboard'], ['▣', 'Documents', '/documents'], ['✦', 'Chat', '/chat'], ['⚙', 'Settings', '/settings'],
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return <aside className="sidebar">
    <NavLink className="brand sidebar-brand" to="/dashboard"><span className="brand-mark">✦</span> KnowledgeAI</NavLink>
    <nav className="side-links">{links.map(([icon, label, to]) => <NavLink key={to} to={to}><span>{icon}</span>{label}</NavLink>)}</nav>
    <div className="sidebar-user"><div className="avatar">{user?.name?.[0]?.toUpperCase()}</div><div><strong>{user?.name}</strong><button onClick={logout}>Log out</button></div></div>
  </aside>;
}
