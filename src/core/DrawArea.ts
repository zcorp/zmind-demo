import { MinderNode } from './Node';
import { Connection } from './Connection';
import { Theme } from './Theme';

export class DrawArea {
  private svg: SVGSVGElement;
  private nodesGroup: SVGGElement;
  private connectionsGroup: SVGGElement;
  private theme: Theme;
  private scale: number = 1;
  private translateX: number = 0;
  private translateY: number = 0;

  constructor(container: HTMLElement, theme: Theme = Theme.light()) {
    this.theme = theme;

    // Créer l'élément SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.backgroundColor = this.theme.colors.background;
    this.svg.style.cursor = 'grab';

    // Groupes pour organiser les éléments
    this.connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.connectionsGroup.setAttribute('class', 'connections');

    this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesGroup.setAttribute('class', 'nodes');

    // Appliquer les transformations de zoom/pan
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.setAttribute('class', 'viewport');
    mainGroup.setAttribute('transform', 'translate(0,0) scale(1)');
    mainGroup.appendChild(this.connectionsGroup);
    mainGroup.appendChild(this.nodesGroup);

    this.svg.appendChild(mainGroup);
    container.appendChild(this.svg);

    // Appliquer le thème
    this.theme.apply();

    // Ajouter les interactions
    this.setupInteractions();
  }

  clear(): void {
    while (this.nodesGroup.firstChild) {
      this.nodesGroup.removeChild(this.nodesGroup.firstChild);
    }
    while (this.connectionsGroup.firstChild) {
      this.connectionsGroup.removeChild(this.connectionsGroup.firstChild);
    }
  }

  renderNode(node: MinderNode, onSelect?: (node: MinderNode) => void): void {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-node-id', node.id);
    g.setAttribute('transform', `translate(${node.position.x}, ${node.position.y})`);
    g.style.cursor = 'pointer';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '-60');
    rect.setAttribute('y', '-20');
    rect.setAttribute('width', '120');
    rect.setAttribute('height', '40');
    rect.setAttribute('rx', node.style.shape === 'rounded' ? '10' : '0');
    rect.setAttribute('fill', node.style.backgroundColor);

    // Style selon état sélectionné
    if (node.selected) {
      rect.setAttribute('stroke', '#0066cc');
      rect.setAttribute('stroke-width', '3');
      rect.setAttribute('filter', 'drop-shadow(0 0 4px rgba(0,102,204,0.5))');
    } else {
      rect.setAttribute('stroke', node.style.color);
      rect.setAttribute('stroke-width', '2');
      rect.removeAttribute('filter');
    }

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', node.style.color);
    text.setAttribute('font-size', node.style.fontSize.toString());
    text.setAttribute('font-family', node.style.fontFamily);
    text.textContent = node.text;

    g.appendChild(rect);
    g.appendChild(text);
    this.nodesGroup.appendChild(g);

    // Gérer le clic
    if (onSelect) {
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(node);
      });
    }
  }

  renderConnection(connection: Connection): void {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', connection.getPath());
    path.setAttribute('stroke', connection.style.stroke);
    path.setAttribute('stroke-width', connection.style.strokeWidth.toString());
    path.setAttribute('fill', 'none');

    this.connectionsGroup.appendChild(path);
  }

  setTransform(scale: number, translateX: number, translateY: number): void {
    this.scale = scale;
    this.translateX = translateX;
    this.translateY = translateY;

    const mainGroup = this.nodesGroup.parentElement;
    if (mainGroup) {
      mainGroup.setAttribute(
        'transform',
        `translate(${translateX}, ${translateY}) scale(${scale})`
      );
    }
  }

  getSVGElement(): SVGSVGElement {
    return this.svg;
  }

  private setupInteractions(): void {
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    // Gestion du zoom avec la molette
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();

      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom autour du curseur
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(3, this.scale * zoomFactor));

      // Ajuster la translation pour zoomer vers le curseur
      this.translateX = mouseX - (mouseX - this.translateX) * (newScale / this.scale);
      this.translateY = mouseY - (mouseY - this.translateY) * (newScale / this.scale);
      this.scale = newScale;

      this.updateTransform();
    });

    // Gestion du pan (glisser-déposer)
    this.svg.addEventListener('mousedown', (e) => {
      if (e.target === this.svg || e.target === this.nodesGroup.parentElement) {
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        this.svg.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isPanning) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        this.translateX += dx;
        this.translateY += dy;
        this.updateTransform();

        lastX = e.clientX;
        lastY = e.clientY;
      }
    });

    document.addEventListener('mouseup', () => {
      isPanning = false;
      this.svg.style.cursor = 'grab';
    });
  }

  private updateTransform(): void {
    const mainGroup = this.svg.querySelector('.viewport') as SVGGElement;
    if (mainGroup) {
      mainGroup.setAttribute(
        'transform',
        `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`
      );
    }
  }

  zoomIn(): void {
    this.scale = Math.min(3, this.scale * 1.2);
    this.updateTransform();
  }

  zoomOut(): void {
    this.scale = Math.max(0.1, this.scale * 0.8);
    this.updateTransform();
  }

  resetZoom(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }
}
