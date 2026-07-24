import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectAllMembers,
  selectAllRelationships,
  selectMember,
  selectSelectedMember,
} from '../features/familyTree/familyTreeSlice';
import { FamilyMember, TreeNode } from '../types';

interface HierarchyNode {
  data: FamilyMember;
  children?: HierarchyNode[];
  spouse?: FamilyMember;
  x?: number;
  y?: number;
  id: string;
}

function FamilyTreeView() {
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectAllMembers);
  const relationships = useAppSelector(selectAllRelationships);
  const selectedMember = useAppSelector(selectSelectedMember);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [zoom, setZoom] = useState(1);

  const buildTree = (): TreeNode | null => {
    if (members.length === 0) return null;

    const memberMap = new Map<string, FamilyMember>();
    members.forEach(m => memberMap.set(m.id, m));

    const childToParents = new Map<string, string[]>();
    const parentToChildren = new Map<string, string[]>();
    const spousePairs: [string, string][] = [];
    const siblingGroups = new Map<string, string[]>();

    relationships.forEach(rel => {
      if (rel.type === 'parent-child') {
        if (!childToParents.has(rel.toMemberId)) {
          childToParents.set(rel.toMemberId, []);
        }
        childToParents.get(rel.toMemberId)!.push(rel.fromMemberId);

        if (!parentToChildren.has(rel.fromMemberId)) {
          parentToChildren.set(rel.fromMemberId, []);
        }
        parentToChildren.get(rel.fromMemberId)!.push(rel.toMemberId);
      } else if (rel.type === 'spouse') {
        spousePairs.push([rel.fromMemberId, rel.toMemberId]);
      } else if (rel.type === 'sibling') {
        const key = [rel.fromMemberId, rel.toMemberId].sort().join('-');
        if (!siblingGroups.has(key)) {
          siblingGroups.set(key, [rel.fromMemberId, rel.toMemberId]);
        }
      }
    });

    const hasParent = new Set<string>();
    childToParents.forEach((_, childId) => hasParent.add(childId));

    const rootMembers = members.filter(m => !hasParent.has(m.id));
    if (rootMembers.length === 0) {
      const rootId = members[0].id;
      const buildNode = (memberId: string, visited: Set<string> = new Set()): TreeNode | null => {
        if (visited.has(memberId)) return null;
        visited.add(memberId);

        const member = memberMap.get(memberId);
        if (!member) return null;

        const children: TreeNode[] = [];
        const childrenIds = parentToChildren.get(memberId) || [];
        childrenIds.forEach(childId => {
          const childNode = buildNode(childId, new Set(visited));
          if (childNode) children.push(childNode);
        });

        let spouse: FamilyMember | undefined;
        spousePairs.forEach(pair => {
          if (pair[0] === memberId) {
            spouse = memberMap.get(pair[1]);
          } else if (pair[1] === memberId) {
            spouse = memberMap.get(pair[0]);
          }
        });

        return {
          id: memberId,
          data: member,
          children,
          spouse,
        };
      };

      return buildNode(rootId);
    }

    const buildNode = (memberId: string, visited: Set<string> = new Set()): TreeNode | null => {
      if (visited.has(memberId)) return null;
      visited.add(memberId);

      const member = memberMap.get(memberId);
      if (!member) return null;

      const children: TreeNode[] = [];
      const childrenIds = parentToChildren.get(memberId) || [];
      const uniqueChildren = [...new Set(childrenIds)];
      uniqueChildren.forEach(childId => {
        const childNode = buildNode(childId, new Set(visited));
        if (childNode) children.push(childNode);
      });

      let spouse: FamilyMember | undefined;
      spousePairs.forEach(pair => {
        if (pair[0] === memberId) {
          spouse = memberMap.get(pair[1]);
        } else if (pair[1] === memberId) {
          spouse = memberMap.get(pair[0]);
        }
      });

      return {
        id: memberId,
        data: member,
        children,
        spouse,
      };
    };

    if (rootMembers.length === 1) {
      return buildNode(rootMembers[0].id);
    }

    const firstRoot = rootMembers[0];
    return buildNode(firstRoot.id);
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const tree = buildTree();
    if (!tree) {
      return;
    }

    const container = containerRef.current;
    const width = Math.max(800, container.clientWidth - 40);
    const height = layout === 'vertical' ? 600 : 500;

    const g = svg.append('g');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    const hierarchyData = d3.hierarchy(tree as HierarchyNode, (d) => d.children);

    let treeLayout;
    if (layout === 'vertical') {
      treeLayout = d3.tree<HierarchyNode>()
        .size([width - 100, height - 100]);
    } else {
      treeLayout = d3.tree<HierarchyNode>()
        .size([height - 100, width - 100]);
    }

    treeLayout(hierarchyData);

    const nodes = hierarchyData.descendants();
    const links = hierarchyData.links();

    const linkGroup = g.append('g').attr('class', 'links');

    if (layout === 'vertical') {
      linkGroup
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2)
        .attr('d', d => {
          const source = d.source as any;
          const target = d.target as any;
          return `M${source.x + 50},${source.y + 60}
                  C${source.x + 50},${(source.y + target.y) / 2 + 30}
                   ${target.x + 50},${(source.y + target.y) / 2 + 30}
                   ${target.x + 50},${target.y + 30}`;
        });
    } else {
      linkGroup
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2)
        .attr('d', d => {
          const source = d.source as any;
          const target = d.target as any;
          return `M${source.y + 120},${source.x + 50}
                  C${(source.y + target.y) / 2 + 60},${source.x + 50}
                   ${(source.y + target.y) / 2 + 60},${target.x + 50}
                   ${target.y + 30},${target.x + 50}`;
        });
    }

    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodeGroups = nodeGroup
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        if (selectedMember?.id === d.data.data.id) {
          dispatch(selectMember(null));
        } else {
          dispatch(selectMember(d.data.data.id));
        }
      });

    nodeGroups.each(function(d: any) {
      const nodeG = d3.select(this);
      const isSelected = selectedMember?.id === d.data.data.id;
      const member = d.data.data as FamilyMember;
      const spouse = d.data.spouse as FamilyMember | undefined;

      if (layout === 'vertical') {
        nodeG.attr('transform', `translate(${d.x}, ${d.y})`);

        const singleWidth = 160;
        const doubleWidth = 300;
        const nodeHeight = 70;

        nodeG.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', spouse ? doubleWidth : singleWidth)
          .attr('height', nodeHeight)
          .attr('rx', 8)
          .attr('fill', isSelected ? '#e8eaf6' : '#fff')
          .attr('stroke', isSelected ? '#667eea' : '#ddd')
          .attr('stroke-width', isSelected ? 2 : 1);

        nodeG.append('circle')
          .attr('cx', 28)
          .attr('cy', nodeHeight / 2)
          .attr('r', 16)
          .attr('fill', member.gender === 'male' ? '#667eea' : '#f5576c');

        nodeG.append('text')
          .attr('x', 28)
          .attr('y', nodeHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text(member.name.charAt(0));

        const memberNameText = member.name.length > 4 ? member.name.substring(0, 4) + '..' : member.name;
        nodeG.append('text')
          .attr('x', 52)
          .attr('y', nodeHeight / 2 - 8)
          .attr('fill', '#333')
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .text(memberNameText);

        const memberBirthText = member.birthDate ? member.birthDate.substring(0, 10) : '';
        nodeG.append('text')
          .attr('x', 52)
          .attr('y', nodeHeight / 2 + 12)
          .attr('fill', '#999')
          .attr('font-size', '10px')
          .text(memberBirthText);

        if (spouse) {
          const middleX = singleWidth;

          nodeG.append('line')
            .attr('x1', middleX)
            .attr('y1', 8)
            .attr('x2', middleX)
            .attr('y2', nodeHeight - 8)
            .attr('stroke', '#eee')
            .attr('stroke-width', 1);

          nodeG.append('circle')
            .attr('cx', middleX + 28)
            .attr('cy', nodeHeight / 2)
            .attr('r', 16)
            .attr('fill', spouse.gender === 'male' ? '#667eea' : '#f5576c');

          nodeG.append('text')
            .attr('x', middleX + 28)
            .attr('y', nodeHeight / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(spouse.name.charAt(0));

          const spouseNameText = spouse.name.length > 4 ? spouse.name.substring(0, 4) + '..' : spouse.name;
          nodeG.append('text')
            .attr('x', middleX + 52)
            .attr('y', nodeHeight / 2 - 8)
            .attr('fill', '#333')
            .attr('font-size', '13px')
            .attr('font-weight', 'bold')
            .text(spouseNameText);

          const spouseBirthText = spouse.birthDate ? spouse.birthDate.substring(0, 10) : '';
          nodeG.append('text')
            .attr('x', middleX + 52)
            .attr('y', nodeHeight / 2 + 12)
            .attr('fill', '#999')
            .attr('font-size', '10px')
            .text(spouseBirthText);
        }
      } else {
        nodeG.attr('transform', `translate(${d.y}, ${d.x})`);

        const singleWidth = 160;
        const doubleWidth = 300;
        const nodeHeight = 70;

        nodeG.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', spouse ? doubleWidth : singleWidth)
          .attr('height', nodeHeight)
          .attr('rx', 8)
          .attr('fill', isSelected ? '#e8eaf6' : '#fff')
          .attr('stroke', isSelected ? '#667eea' : '#ddd')
          .attr('stroke-width', isSelected ? 2 : 1);

        nodeG.append('circle')
          .attr('cx', 28)
          .attr('cy', nodeHeight / 2)
          .attr('r', 16)
          .attr('fill', member.gender === 'male' ? '#667eea' : '#f5576c');

        nodeG.append('text')
          .attr('x', 28)
          .attr('y', nodeHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text(member.name.charAt(0));

        const memberNameText = member.name.length > 4 ? member.name.substring(0, 4) + '..' : member.name;
        nodeG.append('text')
          .attr('x', 52)
          .attr('y', nodeHeight / 2 - 8)
          .attr('fill', '#333')
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .text(memberNameText);

        const memberBirthText = member.birthDate ? member.birthDate.substring(0, 10) : '';
        nodeG.append('text')
          .attr('x', 52)
          .attr('y', nodeHeight / 2 + 12)
          .attr('fill', '#999')
          .attr('font-size', '10px')
          .text(memberBirthText);

        if (spouse) {
          const middleX = singleWidth;

          nodeG.append('line')
            .attr('x1', middleX)
            .attr('y1', 8)
            .attr('x2', middleX)
            .attr('y2', nodeHeight - 8)
            .attr('stroke', '#eee')
            .attr('stroke-width', 1);

          nodeG.append('circle')
            .attr('cx', middleX + 28)
            .attr('cy', nodeHeight / 2)
            .attr('r', 16)
            .attr('fill', spouse.gender === 'male' ? '#667eea' : '#f5576c');

          nodeG.append('text')
            .attr('x', middleX + 28)
            .attr('y', nodeHeight / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(spouse.name.charAt(0));

          const spouseNameText = spouse.name.length > 4 ? spouse.name.substring(0, 4) + '..' : spouse.name;
          nodeG.append('text')
            .attr('x', middleX + 52)
            .attr('y', nodeHeight / 2 - 8)
            .attr('fill', '#333')
            .attr('font-size', '13px')
            .attr('font-weight', 'bold')
            .text(spouseNameText);

          const spouseBirthText = spouse.birthDate ? spouse.birthDate.substring(0, 10) : '';
          nodeG.append('text')
            .attr('x', middleX + 52)
            .attr('y', nodeHeight / 2 + 12)
            .attr('fill', '#999')
            .attr('font-size', '10px')
            .text(spouseBirthText);
        }
      }
    });

    svg.attr('width', width + 100).attr('height', height + 100);
    g.attr('transform', `translate(${layout === 'vertical' ? 50 : 30}, ${layout === 'vertical' ? 30 : 50})`);

  }, [members, relationships, layout, selectedMember, dispatch]);

  const handleExportPNG = async () => {
    if (!svgRef.current) return;
    
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
        
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'family-tree.png';
        link.href = pngUrl;
        link.click();
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  };

  const handleExportPDF = async () => {
    if (!svgRef.current) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const width = img.width || 800;
        const height = img.height || 600;
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
        }
        
        const pngUrl = canvas.toDataURL('image/png');
        
        const pdfWidth = Math.max(width + 40, 595);
        const pdfHeight = Math.max(height + 40, 842);
        
        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [pdfWidth, pdfHeight],
        });
        
        pdf.setFont('helvetica');
        pdf.setFontSize(18);
        pdf.text('家谱族谱', pdfWidth / 2, 30, { align: 'center' });
        
        const imgWidth = width;
        const imgHeight = height;
        const xOffset = (pdfWidth - imgWidth) / 2;
        
        pdf.addImage(pngUrl, 'PNG', xOffset, 50, imgWidth, imgHeight);
        
        pdf.save('family-tree.pdf');
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF导出失败，请重试');
    }
  };

  if (members.length === 0) {
    return (
      <div className="page-container">
        <h2 className="page-title">家谱树</h2>
        <div className="empty-state">
          <p>暂无成员数据，请先添加家庭成员</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">家谱树</h2>
      
      <div className="tree-controls">
        <label>布局方向：</label>
        <select
          className="form-control"
          value={layout}
          onChange={(e) => setLayout(e.target.value as 'vertical' | 'horizontal')}
          style={{ width: 'auto' }}
        >
          <option value="vertical">纵向（从上到下）</option>
          <option value="horizontal">横向（从左到右）</option>
        </select>
        
        <button className="btn btn-outline" onClick={handleExportPNG}>
          导出图片
        </button>
        <button className="btn btn-outline" onClick={handleExportPDF}>
          导出PDF
        </button>
        
        <span style={{ marginLeft: 'auto', color: '#999', fontSize: '0.9rem' }}>
          缩放: {(zoom * 100).toFixed(0)}% | 滚轮缩放，拖拽平移
        </span>
      </div>

      <div ref={containerRef} className="tree-container">
        <svg ref={svgRef} style={{ minWidth: '100%', minHeight: '500px' }} />
      </div>

      {selectedMember && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="detail-panel">
            <h3>已选中成员：{selectedMember.name}</h3>
            <div className="detail-info">
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

export default FamilyTreeView;
