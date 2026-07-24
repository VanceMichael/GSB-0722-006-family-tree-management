import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectAllEvents,
  selectAllMembers,
  addEvent,
  deleteEvent,
} from '../features/familyTree/familyTreeSlice';
import { FamilyEvent, EventCategory } from '../types';

function TimelineView() {
  const dispatch = useAppDispatch();
  const events = useAppSelector(selectAllEvents);
  const members = useAppSelector(selectAllMembers);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    relatedMemberIds: [] as string[],
    category: 'other' as EventCategory,
  });

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : '未知成员';
  };

  const getCategoryLabel = (category: EventCategory) => {
    const labels: Record<EventCategory, string> = {
      birth: '出生',
      marriage: '婚姻',
      death: '逝世',
      education: '教育',
      career: '职业',
      other: '其他',
    };
    return labels[category];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      alert('请填写标题和日期');
      return;
    }

    const newEvent: FamilyEvent = {
      id: `event_${Date.now()}`,
      ...formData,
    };
    dispatch(addEvent(newEvent));
    setShowModal(false);
    setFormData({
      title: '',
      date: '',
      description: '',
      relatedMemberIds: [],
      category: 'other',
    });
  };

  const handleDelete = (eventId: string) => {
    if (confirm('确定要删除此事件吗？')) {
      dispatch(deleteEvent(eventId));
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedMemberIds: prev.relatedMemberIds.includes(memberId)
        ? prev.relatedMemberIds.filter(id => id !== memberId)
        : [...prev.relatedMemberIds, memberId],
    }));
  };

  return (
    <div className="page-container">
      <h2 className="page-title">家族大事记</h2>
      
      <div className="actions-bar">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 添加事件
        </button>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="empty-state">
          <p>暂无大事记数据</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            添加第一个事件
          </button>
        </div>
      ) : (
        <div className="timeline">
          {sortedEvents.map(event => (
            <div key={event.id} className={`timeline-item ${event.category}`}>
              <div className="timeline-date">{event.date}</div>
              <div className="timeline-title">
                {event.title}
                <span style={{ 
                  marginLeft: '0.5rem', 
                  fontSize: '0.8rem', 
                  color: '#999',
                  fontWeight: 'normal'
                }}>
                  [{getCategoryLabel(event.category)}]
                </span>
              </div>
              <div className="timeline-description">
                {event.description}
              </div>
              {event.relatedMemberIds.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  相关成员：{event.relatedMemberIds.map(id => getMemberName(id)).join('、')}
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  className="btn btn-danger"
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => handleDelete(event.id)}
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
              <h2>添加事件</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>事件标题 *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入事件标题"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>日期 *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>事件类型</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                  >
                    <option value="birth">出生</option>
                    <option value="marriage">婚姻</option>
                    <option value="death">逝世</option>
                    <option value="education">教育</option>
                    <option value="career">职业</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入事件描述..."
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>相关成员（可选）</label>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {members.map(member => (
                      <label key={member.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: formData.relatedMemberIds.includes(member.id) 
                          ? '#e8eaf6' 
                          : '#f8f9fa',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.relatedMemberIds.includes(member.id)}
                          onChange={() => handleMemberToggle(member.id)}
                        />
                        {member.name}
                      </label>
                    ))}
                  </div>
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

export default TimelineView;
