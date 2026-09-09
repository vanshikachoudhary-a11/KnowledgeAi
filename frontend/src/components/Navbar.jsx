import { Link, NavLink } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <header className="navbar">
      <Link className="brand" to={isAuthenticated ? '/dashboard' : '/'}><span className="brand-mark">✦</span> KnowledgeAI</Link>
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#features">Features</a><a href="#how-it-works">How it works</a>
        {isAuthenticated ? <Button variant="ghost" onClick={logout}>Log out</Button> : <><NavLink to="/login">Log in</NavLink><Link to="/signup"><Button>Get started</Button></Link></>}
      </nav>
    </header>
  );
}
