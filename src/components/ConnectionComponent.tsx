import React from 'react';
import { MindNode } from '../types';

interface ConnectionComponentProps {
  nodes: MindNode;
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ nodes }) => {
  const connections: JSX.Element[] = [];

  const traverse = (node: MindNode) => {
    node.children.forEach(child => {
      const path = createPath(node.position, child.position);
      connections.push(
        <path
          key={`${node.id}-${child.id}`}
          d={path}
          stroke="#666666"
          strokeWidth={2}
          fill="none"
        />
      );
      traverse(child);
    });
  };

  const createPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const midX = from.x + dx / 2;

    // Bézier curve avec contrôle au milieu
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  };

  traverse(nodes);

  return <>{connections}</>;
};

export default ConnectionComponent;
