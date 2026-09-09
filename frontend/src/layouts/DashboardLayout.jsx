import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() { return <div className="app-shell"><Sidebar /><main className="dashboard-content"><Outlet /></main></div>; }
