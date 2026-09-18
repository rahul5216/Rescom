import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import type { UserProfile, Peer, Conversation, Message, FileTransfer, TopologyNode, TopologyLink } from './types';
import { TopBar } from './components/TopBar';
import { Navigation, type ActiveTab } from './components/Navigation';
import { ChatsView } from './components/ChatsView';
import { PeersView } from './components/PeersView';
import { MeshTopologyView } from './components/MeshTopologyView';

import { EmergencyModal } from './components/EmergencyModal';
import { LoginView } from './components/LoginView';
import { SettingsView } from './components/SettingsView';
import { AnnounceView } from './components/AnnounceView';

const API_BASE = 'http://localhost:3001';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [topologyNodes, setTopologyNodes] = useState<TopologyNode[]>([]);
  const [topologyLinks, setTopologyLinks] = useState<TopologyLink[]>([]);
  const [topologyRoutes, setTopologyRoutes] = useState<any[]>([]);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial profile & peers
  const fetchData = useCallback(async () => {
    try {
      const [pRes, peersRes, convsRes, filesRes, topoRes] = await Promise.all([
        fetch(`${API_BASE}/api/profile`).then(r => r.json()),
        fetch(`${API_BASE}/api/peers`).then(r => r.json()),
        fetch(`${API_BASE}/api/conversations`).then(r => r.json()),
        fetch(`${API_BASE}/api/files`).then(r => r.json()),
        fetch(`${API_BASE}/api/topology`).then(r => r.json()),
      ]);

      if (pRes.success) setProfile(pRes.profile);
      if (peersRes.success) setPeers(peersRes.peers);
      if (convsRes.success) {
        setConversations(convsRes.conversations);
        if (convsRes.conversations.length > 0 && !activeConvId) {
          setActiveConvId(convsRes.conversations[0].conversationId);
        }
      }
      if (filesRes.success) setFileTransfers(filesRes.transfers);
      if (topoRes.success) {
        setTopologyNodes(topoRes.nodes);
        setTopologyLinks(topoRes.links);
        setTopologyRoutes(topoRes.routes);
      }
    } catch (err) {
      console.error('[App] Failed to load initial data:', err);
    }
  }, [activeConvId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    fetch(`${API_BASE}/api/conversations/${activeConvId}/messages`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setMessages(res.messages);
      })
      .catch(err => console.error('[App] Message load error:', err));
  }, [activeConvId]);

  // Connect WebSocket for live mesh events
  useEffect(() => {
    let ws: WebSocket;

    function connectWs() {
      ws = new WebSocket('ws://localhost:3001/ws');

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);

          if (packet.type === 'INITIAL_STATE') {
            if (packet.profile) setProfile(packet.profile);
            if (packet.peers) setPeers(packet.peers);
            if (packet.conversations) setConversations(packet.conversations);
          } else if (packet.type === 'MESSAGE_RECEIVED') {
            fetchData();
            showToast(`📩 New message from ${packet.data.senderId?.substring(0, 8)}`);
          } else if (packet.type === 'MESSAGE_ACK') {
            fetchData();
          } else if (packet.type === 'EMERGENCY_BROADCAST_RECEIVED') {
            showToast(`🚨 EMERGENCY: ${packet.data.content}`);
          } else if (packet.type === 'FILE_COMPLETED') {
            fetchData();
            showToast(`📁 File received: ${packet.data.session.filename}`);
          } else if (packet.type === 'LOAD_TEST_COMPLETED') {
            // handle load test report
          }
        } catch (e) {
          console.error('[App] WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWs, 3000);
      };
    }

    connectWs();
    return () => {
      if (ws) ws.close();
    };
  }, [fetchData]);

  // Send message handler
  const handleSendMessage = async (receiverId: string, content: string, isEncrypted: boolean) => {
    const res = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId, content, isEncrypted }),
    }).then(r => r.json());

    if (res.success) {
      if (activeConvId) {
        const mRes = await fetch(`${API_BASE}/api/conversations/${activeConvId}/messages`).then(r => r.json());
        if (mRes.success) setMessages(mRes.messages);
      }
    }
  };

  // Start chat with peer
  const handleStartChatWithPeer = (peer: Peer) => {
    const conv = conversations.find(c => c.title.includes(peer.displayName) || c.conversationId.includes(peer.peerId));
    if (conv) {
      setActiveConvId(conv.conversationId);
    } else {
      const newConvId = `conv-${[profile?.userId || 'me', peer.peerId].sort().join('_')}`;
      const newConv: Conversation = {
        conversationId: newConvId,
        type: 'PRIVATE',
        title: peer.displayName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConvId);
    }
    setActiveTab('chats');
  };

  // Send file handler
  const handleSendFile = async (receiverId: string, filename: string, dataBase64: string, mimeType: string) => {
    const res = await fetch(`${API_BASE}/api/files/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId, filename, dataBase64, mimeType }),
    }).then(r => r.json());

    if (res.success) {
      showToast(`📁 File transmission started`);
      fetchData();
    }
  };

  // Emergency broadcast handler
  const handleSendEmergency = async (content: string, alertLevel: string) => {
    const res = await fetch(`${API_BASE}/api/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, alertLevel }),
    }).then(r => r.json());

    if (res.success) {
      showToast(`🚨 Emergency broadcast sent!`);
    }
  };

  // Update profile handler
  const handleUpdateProfile = async (displayName: string, department: string, semester: string) => {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, department, semester }),
    }).then(r => r.json());

    if (res.success) {
      setProfile(res.profile);
      showToast(`Profile updated`);
    }
  };

  const handleRefreshPeers = async () => {
    setIsScanning(true);
    await fetchData();
    setTimeout(() => setIsScanning(false), 800);
  };

  if (!isAuthenticated) {
    return (
      <LoginView onLogin={(_username) => {
        setIsAuthenticated(true);
      }} />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          {toastMessage}
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        profile={profile}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
        activePeerCount={peers.length}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '72px' }}>
        {activeTab === 'chats' && (
          <ChatsView
            conversations={conversations}
            peers={peers}
            activeConversationId={activeConvId}
            onSelectConversation={setActiveConvId}
            messages={messages}
            onSendMessage={handleSendMessage}
            localUserId={profile?.userId || ''}
          />
        )}

        {activeTab === 'network' && (
          <PeersView
            peers={peers}
            onStartChat={handleStartChatWithPeer}
            onRefresh={handleRefreshPeers}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'groups' && (
          <MeshTopologyView
            nodes={topologyNodes}
            links={topologyLinks}
            routes={topologyRoutes}
          />
        )}

        {activeTab === 'announce' && (
          <AnnounceView
            onSendEmergency={handleSendEmergency}
            fileTransfers={fileTransfers}
            peers={peers}
            onSendFile={handleSendFile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Emergency Broadcast Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onSendEmergency={handleSendEmergency}
      />
    </div>
  );
};

export default App;
