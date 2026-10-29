import React from 'react';
import { MindNode } from '../types';

interface NodeComponentProps {
  node: MindNode;
  positions: Map<string>;
  onNodeClick: (node: MindNode) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({ node, positions, onNodeClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node);
  };

  const position = positions.get(node.id) || node.position;

  const rectProps = {
    x: position.x - 60,
    y: position.y - 20,
    width: 120,
    height: 40,
    rx: node.style.shape === 'rounded' ? 8 : 0,
    fill: node.style.backgroundColor,
    stroke: node.selected ? '#0066cc' : node.style.color,
    strokeWidth: node.selected ? 3 : 2,
    filter: node.selected ? 'url(#selected)' : 'none',
  };

  return (
    <>
      <defs>
        <filter id="selected">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(0,102,204,0.5)" />
        </filter>
      </defs>

      <g transform={`translate(${position.x}, ${position.y})`} onClick={handleClick}>
        <rect {...rectProps} />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={node.style.color}
          fontSize={node.style.fontSize}
          fontFamily={node.style.fontFamily}
        >
          {node.text}
        </text>
      </g>

      {node.children.map((child: MindNode) => (
        <NodeComponent key={child.id} node={child} positions={positions} onNodeClick={onNodeClick} />
      ))}
    </>
  );
};

export default NodeComponent;
