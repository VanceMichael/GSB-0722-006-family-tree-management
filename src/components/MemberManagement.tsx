import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectAllMembers,
  selectSelectedMember,
  addMember,
  updateMember,
  deleteMember,
  selectMember,
} from '../features/familyTree/familyTreeSlice';
import { FamilyMember } from '../types';

const emptyMember: Omit<FamilyMember, 'id'> = {
  name: '',
  gender: 'male',
  birthDate: '',
  deathDate: '',
  photo: '',
  biography: '',
  birthPlace: '',
  isAlive: true,
};

function MemberManagement() {
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectAllMembers);
  const selectedMember = useAppSelector(selectSelectedMember);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState<Omit<FamilyMember, 'id'>>(emptyMember);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member =>
    member.name.includes(searchTerm) ||
    member.biography.includes(searchTerm)
  );

  const handleAddClick = () => {
    setEditingMember(null);
    setFormData(emptyMember);
    setShowModal(true);
  };

  const handleEditClick = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      gender: member.gender,
      birthDate: member.birthDate,
      deathDate: member.deathDate || '',
      photo: member.photo || '',
      biography: member.biography,
      birthPlace: member.birthPlace,
      isAlive: member.isAlive,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (memberId: string) => {
    if (confirm('确定要删除此成员吗？相关关系也会被删除。')) {
      dispatch(deleteMember(memberId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请输入姓名');
      return;
    }

    if (editingMember) {
      dispatch(
        updateMember({
          ...editingMember,
          ...formData,
          deathDate: formData.isAlive ? undefined : formData.deathDate || undefined,
        })
      );
    } else {
      const newMember: FamilyMember = {
        ...formData,
        id: `member_${Date.now()}`,
        deathDate: formData.isAlive ? undefined : formData.deathDate || undefined,
      };
      dispatch(addMember(newMember));
    }
    setShowModal(false);
  };

  const handleSelectMember = (member: FamilyMember) => {
    if (selectedMember?.id === member.id) {
      dispatch(selectMember(null));
    } else {
      dispatch(selectMember(member.id));
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return date;
  };

  return (
    <div className="page-container">
      <h2 className="page-title">成员管理</h2>
      
      <div className="actions-bar">
        <button className="btn btn-primary" onClick={handleAddClick}>
          + 添加成员
        </button>
        <div className="search-bar" style={{ margin: 0, flex: 1 }}>
          <input
            type="text"
            className="form-control"
            placeholder="搜索成员姓名或简介..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="empty-state">
          <p>暂无成员数据</p>
          <button className="btn btn-primary" onClick={handleAddClick}>
            添加第一个成员
          </button>
        </div>
      ) : (
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
                <p><strong>出生：</strong>{formatDate(member.birthDate)}</p>
                {!member.isAlive && member.deathDate && (
                  <p><strong>逝世：</strong>{formatDate(member.deathDate)}</p>
                )}
                <p><strong>籍贯：</strong>{member.birthPlace || '-'}</p>
                <p><strong>状态：</strong>{member.isAlive ? '在世' : '已故'}</p>
                {member.biography && (
                  <p style={{ marginTop: '0.5rem', color: '#666', fontStyle: 'italic' }}>
                    {member.biography.length > 50 ? member.biography.substring(0, 50) + '...' : member.biography}
                  </p>
                )}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(member);
                  }}
                >
                  编辑
                </button>
                <button
                  className="btn btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(member.id);
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMember ? '编辑成员' : '添加成员'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>姓名 *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>性别</label>
                  <select
                    className="form-control"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>出生日期</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isAlive}
                      onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    在世
                  </label>
                </div>
                {!formData.isAlive && (
                  <div className="form-group">
                    <label>逝世日期</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.deathDate}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>籍贯</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    placeholder="请输入籍贯"
                  />
                </div>
                <div className="form-group">
                  <label>简介</label>
                  <textarea
                    className="form-control"
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    placeholder="请输入个人简介..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberManagement;
