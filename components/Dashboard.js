'use client';

import { useState } from 'react';
import {
  Home, Users, ShoppingCart, DollarSign, UserCircle,
  Database, FolderKanban, LayoutDashboard, LogOut, Menu, X
} from 'lucide-react';
import HomeTab from './tabs/HomeTab';
import WorkTab from './tabs/WorkTab';
import ManagerTab from './tabs/ManagerTab';
import DataEngineeringTab from './tabs/DataEngineeringTab';
import ProjectScopingTab from './tabs/ProjectScopingTab';
import ProjectPlanningTab from './tabs/ProjectPlanningTab';

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'cs-product', label: 'CS & Product', icon: Users },
  { id: 'sales-marketing', label: 'Sales & Marketing', icon: ShoppingCart },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'manager', label: 'Manager', icon: UserCircle },
  { id: 'data-engineering', label: 'Data Engineering', icon: Database },
  { id: 'project-scoping', label: 'Project Scoping', icon: FolderKanban },
  { id: 'project-planning', label: 'Project Planning', icon: LayoutDashboard },
];

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'cs-product': return <WorkTab tabId="cs-product" tabName="CS & Product" />;
      case 'sales-marketing': return <WorkTab tabId="sales-marketing" tabName="Sales & Marketing" />;
      case 'finance': return <WorkTab tabId="finance" tabName="Finance" />;
      case 'manager': return <ManagerTab />;
      case 'data-engineering': return <DataEngineeringTab />;
      case 'project-scoping': return <ProjectScopingTab />;
      case 'project-planning': return <ProjectPlanningTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen flex bg-dark-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-surface border-r border-dark-border
                         flex flex-col transition-transform lg:translate-x-0
                         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PS</span>
            </div>
            <span className="font-semibold text-text-primary">Prod Suite</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'tab-active text-accent-blue'
                    : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover'
                  }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-dark-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary
                     hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-dark-surface border-b border-dark-border flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-text-secondary hover:text-text-primary">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-text-primary">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse-dot" />
            <span>Live</span>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
