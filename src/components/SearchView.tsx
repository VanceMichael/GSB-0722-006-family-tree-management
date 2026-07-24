import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectAllMembers,
  selectAllRelationships,
  selectMember,
  selectSelectedMember,
} from '../features/familyTree/familyTreeSlice';
import { FamilyMember, RelationshipType } from '../types';

interface RelationResult {
  member: FamilyMember;
  relation: string;
  relationType: RelationshipType;
}

function SearchView() {
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectAllMembers);
  const relationships = useAppSelector(selectAllRelationships);
  const selectedMember = useAppSelector(selectSelectedMember);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'relation'>('name');
  const [fromMemberId, setFromMemberId] = useState('');
  const [toMemberId, setToMemberId] = useState('');
  const [relationResults, setRelationResults] = useState<RelationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const filteredMembers = members.filter(member =>
    member.name.includes(searchTerm) ||
    member.biography.includes(searchTerm) ||
    member.birthPlace.includes(searchTerm)
  );

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : '未知成员';
  };

  const getRelationshipLabel = (type: RelationshipType, fromGender: string, toGender: string) => {
    if (type === 'spouse') {
      return fromGender === 'male' ? '妻子' : '丈夫';
    }
    if (type === 'parent-child') {
      if (fromGender === 'male') {
        return toGender === 'male' ? '儿子' : '女儿';
      } else {
        return toGender === 'male' ? '儿子' : '女儿';
      }
    }
    if (type === 'sibling') {
      return toGender === 'male' ? '兄弟' : '姐妹';
    }
    return '未知关系';
  };

  const findAllRelations = (memberId: string, visited: Set<string> = new Set()): RelationResult[] => {
    if (visited.has(memberId)) return [];
    visited.add(memberId);

    const results: RelationResult[] = [];
    const currentMember = members.find(m => m.id === memberId);
    if (!currentMember) return results;

    relationships.forEach(rel => {
      let targetId: string | null = null;
      let relationType: RelationshipType | null = null;

      if (rel.fromMemberId === memberId) {
        targetId = rel.toMemberId;
        relationType = rel.type;
      } else if (rel.toMemberId === memberId) {
        targetId = rel.fromMemberId;
        if (rel.type === 'parent-child') {
          relationType = 'parent-child';
        } else {
          relationType = rel.type;
        }
      }

      if (targetId && relationType && !visited.has(targetId)) {
        const targetMember = members.find(m => m.id === targetId);
        if (targetMember) {
          let relationLabel = '';
          if (rel.type === 'spouse') {
            relationLabel = currentMember.gender === 'male' ? '妻子' : '丈夫';
          } else if (rel.type === 'sibling') {
            relationLabel = targetMember.gender === 'male' ? '兄弟' : '姐妹';
          } else if (rel.type === 'parent-child') {
            if (rel.fromMemberId === memberId) {
              relationLabel = targetMember.gender === 'male' ? '儿子' : '女儿';
            } else {
              relationLabel = currentMember.gender === 'male' ? '父亲' : '母亲';
            }
          }

          results.push({
            member: targetMember,
            relation: relationLabel,
            relationType: relationType,
          });

          results.push(...findAllRelations(targetId, new Set(visited)));
        }
      }
    });

    return results;
  };

  const handleSearchRelations = () => {
    if (!fromMemberId) {
      alert('请选择要查询的成员');
      return;
    }

    const results = findAllRelations(fromMemberId);
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex(r => r.member.id === result.member.id)
    );
    setRelationResults(uniqueResults);
    setShowResults(true);
  };

  const handleQueryRelation = () => {
    if (!fromMemberId || !toMemberId) {
      alert('请选择两个成员');
      return;
    }

    if (fromMemberId === toMemberId) {
      alert('不能选择同一个成员');
      return;
    }

    const results = findAllRelations(fromMemberId);
    const found = results.find(r => r.member.id === toMemberId);
    
    if (found) {
      const fromName = getMemberName(fromMemberId);
      const toName = getMemberName(toMemberId);
      alert(`${fromName} 的 ${found.relation} 是 ${toName}`);
    } else {
      alert('未找到直接关系');
    }
  };

  const handleSelectMember = (member: FamilyMember) => {
    dispatch(selectMember(member.id));
  };

  return (
    <div className="page-container">
      <h2 className="page-title">搜索与查询</h2>
      
      <div className="search-bar" style={{ marginBottom: '2rem' }}>
        <select
          className="form-control"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as 'name' | 'relation')}
          style={{ maxWidth: '150px' }}
        >
          <option value="name">按名称搜索</option>
          <option value="relation">按关系查询</option>
        </select>
        
        {searchType === 'name' ? (
          <input
            type="text"
            className="form-control"
            placeholder="输入姓名、简介或籍贯进行搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        ) : (
          <>
            <select
              className="form-control"
              value={fromMemberId}
              onChange={(e) => setFromMemberId(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="">选择成员 1</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <select
              className="form-control"
              value={toMemberId}
              onChange={(e) => setToMemberId(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="">选择成员 2（可选）</option>
              {members
                .filter(m => m.id !== fromMemberId)
                .map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
            </select>
            <button className="btn btn-primary" onClick={toMemberId ? handleQueryRelation : handleSearchRelations}>
              {toMemberId ? '查询关系' : '查看所有关系'}
            </button>
          </>
        )}
      </div>

      {searchType === 'name' ? (
        <>
          {searchTerm && filteredMembers.length === 0 ? (
            <div className="empty-state">
              <p>未找到匹配的成员</p>
            </div>
          ) : searchTerm ? (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                找到 {filteredMembers.length} 个匹配的成员：
              </p>
              <div className="members-grid">
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className={`member-card ${selectedMember?.id === member.id ? 'selected' : ''}`}
                    onClick={() => handleSelectMember(member)}
                  >
                    <div className="member-card-header">
                      <div className={`member-avatar ${member.gender}`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="member-info">
                        <h3>{member.name}</h3>
                        <span className={`gender-badge ${member.gender}`}>
                          {member.gender === 'male' ? '男' : '女'}
                        </span>
                      </div>
                    </div>
                    <div className="member-details">
                      <p><strong>出生：</strong>{member.birthDate || '-'}</p>
                      <p><strong>籍贯：</strong>{member.birthPlace || '-'}</p>
                      {member.biography && (
                        <p style={{ marginTop: '0.5rem', color: '#666', fontStyle: 'italic' }}>
                          {member.biography.length > 50 ? member.biography.substring(0, 50) + '...' : member.biography}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>输入搜索关键词开始搜索成员</p>
            </div>
          )}
        </>
      ) : (
        <>
          {showResults && relationResults.length > 0 ? (
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                {getMemberName(fromMemberId)} 的所有关系：
              </h3>
              <div className="relationship-list">
                {relationResults.map(result => (
                  <div key={result.member.id} className="relationship-item">
                    <div className="relationship-info">
                      <span className="relationship-type">
                        {result.relation}
                      </span>
                      <div className="relationship-members">
                        <div className={`member-avatar ${result.member.gender}`} style={{ 
                          width: '36px', 
                          height: '36px', 
                          fontSize: '0.9rem' 
                        }}>
                          {result.member.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '500' }}>{result.member.name}</span>
                      </div>
                      {result.member.birthDate && (
                        <span style={{ color: '#999', fontSize: '0.9rem' }}>
                          出生：{result.member.birthDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : showResults ? (
            <div className="empty-state">
              <p>未找到相关关系</p>
            </div>
          ) : (
            <div className="empty-state">
              <p>选择成员后点击查询查看关系</p>
            </div>
          )}
        </>
      )}

      {selectedMember && (
        <div style={{ marginTop: '2rem' }}>
          <div className="detail-panel">
            <h3>已选中成员详情</h3>
            <div className="detail-info">
              <div className="detail-info-item">
                <label>姓名</label>
                <span>{selectedMember.name}</span>
              </div>
              <div className="detail-info-item">
                <label>性别</label>
                <span>{selectedMember.gender === 'male' ? '男' : '女'}</span>
              </div>
              <div className="detail-info-item">
                <label>出生日期</label>
                <span>{selectedMember.birthDate || '-'}</span>
              </div>
              <div className="detail-info-item">
                <label>逝世日期</label>
                <span>{selectedMember.deathDate || (selectedMember.isAlive ? '在世' : '-')}</span>
              </div>
              <div className="detail-info-item">
                <label>籍贯</label>
                <span>{selectedMember.birthPlace || '-'}</span>
              </div>
              <div className="detail-info-item">
                <label>状态</label>
                <span>{selectedMember.isAlive ? '在世' : '已故'}</span>
              </div>
              <div className="detail-info-item" style={{ gridColumn: '1 / -1' }}>
                <label>简介</label>
                <span>{selectedMember.biography || '暂无简介'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchView;
