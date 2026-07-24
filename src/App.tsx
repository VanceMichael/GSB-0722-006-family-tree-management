import { useState } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { loadSampleData, selectAllMembers, selectSelectedMember } from './features/familyTree/familyTreeSlice';
import FamilyTreeView from './components/FamilyTreeView';
import MemberManagement from './components/MemberManagement';
import RelationshipManagement from './components/RelationshipManagement';
import TimelineView from './components/TimelineView';
import SearchView from './components/SearchView';

type Page = 'tree' | 'members' | 'relationships' | 'timeline' | 'search';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('tree');
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectAllMembers);
  const selectedMember = useAppSelector(selectSelectedMember);

  const navItems = [
    { id: 'tree' as Page, label: '家谱树' },
    { id: 'members' as Page, label: '成员管理' },
    { id: 'relationships' as Page, label: '关系管理' },
    { id: 'timeline' as Page, label: '大事记' },
    { id: 'search' as Page, label: '搜索查询' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'tree':
        return <FamilyTreeView />;
      case 'members':
        return <MemberManagement />;
      case 'relationships':
        return <RelationshipManagement />;
      case 'timeline':
        return <TimelineView />;
      case 'search':
        return <SearchView />;
      default:
        return <FamilyTreeView />;
    }
  };

  const handleLoadSampleData = () => {
    if (members.length > 0) {
      if (!confirm('加载示例数据将覆盖当前所有数据，确定继续吗？')) {
        return;
      }
    }
    dispatch(loadSampleData());
  };

  return (
    <div className="app">
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>家谱族谱管理系统</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>数据自动保存到本地</span>
          <button 
            className="btn btn-outline" 
            onClick={handleLoadSampleData}
            style={{ 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.5)',
              fontSize: '0.85rem',
              padding: '0.4rem 0.8rem'
            }}
          >
            加载示例数据
          </button>
        </div>
      </header>
      
      <nav className="app-nav">
        <ul>
          {navItems.map(item => (
            <li
            key={item.id}
            className={currentPage === item.id ? 'active' : ''}
            onClick={() => setCurrentPage(item.id)}
          >
            {item.label}
          </li>
        ))}
        </ul>
      </nav>
      
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
