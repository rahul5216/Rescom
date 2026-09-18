import React from 'react';
import { Wifi, Users, MessageSquare, Megaphone } from 'lucide-react';

export type ActiveTab = 'network' | 'groups' | 'chats' | 'announce' | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const navItems = [
    { id: 'network' as ActiveTab, label: 'Network', icon: Wifi },
    { id: 'groups' as ActiveTab, label: 'Groups', icon: Users },
    { id: 'chats' as ActiveTab, label: 'Chats', icon: MessageSquare },
    { id: 'announce' as ActiveTab, label: 'Announce', icon: Megaphone },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`nav-tab ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
