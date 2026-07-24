import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectAllMembers,
  selectAllRelationships,
  addRelationship,
  deleteRelationship,
} from '../features/familyTree/familyTreeSlice';
import { Relationship, RelationshipType } from '../types';

function RelationshipManagement() {
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectAllMembers);
  const relationships = useAppSelector(selectAllRelationships);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'parent-child' as RelationshipType,
    fromMemberId: '',
    toMemberId: '',
    notes: '',
  });

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : '未知成员';
  };

  const getRelationshipTypeLabel = (type: RelationshipType) => {
    const labels: Record<RelationshipType, string> = {
      'parent-child': '父子/父女',
      'spouse': '夫妻',
      'sibling': '兄弟/姐妹',
    };
    return labels[type];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromMemberId || !formData.toMemberId) {
      alert('请选择两个成员');
      return;
    }
    if (formData.fromMemberId === formData.toMemberId) {
      alert('不能选择同一个成员');
      return;
    }

    const existingRelationship = relationships.find(
      r =>
        (r.fromMemberId === formData.fromMemberId && r.toMemberId === formData.toMemberId) ||
        (r.fromMemberId === formData.toMemberId && r.toMemberId === formData.fromMemberId)
    );

    if (existingRelationship) {
      alert('这两个成员之间已有关系存在');
      return;
    }

    const newRelationship: Relationship = {
      id: `rel_${Date.now()}`,
      ...formData,
    };
    dispatch(addRelationship(newRelationship));
    setShowModal(false);
    setFormData({
      type: 'parent-child',
      fromMemberId: '',
      toMemberId: '',
      notes: '',
    });
  };

  const handleDelete = (relationshipId: string) => {
    if (confirm('确定要删除此关系吗？')) {
      dispatch(deleteRelationship(relationshipId));
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">关系管理</h2>
      
      <div className="actions-bar">
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          disabled={members.length < 2}
        >
          + 添加关系
        </button>
        {members.length < 2 && (
          <span style={{ color: '#999', fontSize: '0.9rem' }}>
            需要至少2个成员才能添加关系
          </span>
        )}
      </div>

      {relationships.length === 0 ? (
        <div className="empty-state">
          <p>暂无关系数据</p>
          {members.length >= 2 && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              添加第一个关系
            </button>
          )}
        </div>
      ) : (
        <div className="relationship-list">
          {relationships.map(rel => (
            <div key={rel.id} className="relationship-item">
              <div className="relationship-info">
                <span className="relationship-type">
                  {getRelationshipTypeLabel(rel.type)}
                </span>
                <div className="relationship-members">
                  <span>{getMemberName(rel.fromMemberId)}</span>
                  <span className="relationship-arrow">→</span>
                  <span>{getMemberName(rel.toMemberId)}</span>
                </div>
                {rel.notes && (
                  <span style={{ color: '#999', fontSize: '0.9rem' }}>
                    备注：{rel.notes}
                  </span>
                )}
              </div>
              <button
                className="btn btn-danger"
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                onClick={() => handleDelete(rel.id)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加关系</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>关系类型</label>
                  <select
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as RelationshipType })}
                  >
                    <option value="parent-child">父子/父女/母子/母女</option>
                    <option value="spouse">夫妻</option>
                    <option value="sibling">兄弟/姐妹</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>成员 1</label>
                  <select
                    className="form-control"
                    value={formData.fromMemberId}
                    onChange={(e) => setFormData({ ...formData, fromMemberId: e.target.value })}
                    required
                  >
                    <option value="">请选择成员</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>成员 2</label>
                  <select
                    className="form-control"
                    value={formData.toMemberId}
                    onChange={(e) => setFormData({ ...formData, toMemberId: e.target.value })}
                    required
                  >
                    <option value="">请选择成员</option>
                    {members
                      .filter(m => m.id !== formData.fromMemberId)
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>备注（可选）</label>
                  <textarea
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="添加备注信息..."
                    rows={3}
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
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RelationshipManagement;
