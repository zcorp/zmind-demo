export class TabBar {
  private container: HTMLElement;
  private tabs: Tab[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'tab-bar';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: var(--nodeBackground, #ffffff);
      border-bottom: 1px solid var(--nodeBorder, #cccccc);
      display: flex;
      align-items: center;
      padding: 0 10px;
      z-index: 10;
    `;
  }

  addTab(title: string, onActivate: () => void): void {
    const tab = new Tab(title, onActivate);
    this.tabs.push(tab);
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.tabs.forEach((tab, index) => {
      const tabElement = document.createElement('div');
      tabElement.className = 'tab';
      tabElement.textContent = tab.title;
      tabElement.style.cssText = `
        padding: 8px 16px;
        margin-right: 5px;
        background: var(--background, #f5f5f5);
        border: 1px solid var(--nodeBorder, #cccccc);
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        font-size: 13px;
      `;

      if (index === this.tabs.length - 1) {
        tabElement.style.fontWeight = 'bold';
        tabElement.style.background = 'var(--nodeBackground, #ffffff)';
      }

      tabElement.addEventListener('click', () => {
        tab.onActivate();
        this.setActiveTab(index);
      });

      this.container.appendChild(tabElement);
    });
  }

  private setActiveTab(index: number): void {
    this.tabs.forEach((_, i) => {
      const tabElement = this.container.children[i] as HTMLElement;
      if (i === index) {
        tabElement.style.fontWeight = 'bold';
        tabElement.style.background = 'var(--nodeBackground, #ffffff)';
      } else {
        tabElement.style.fontWeight = 'normal';
        tabElement.style.background = 'var(--background, #f5f5f5)';
      }
    });
  }
}

class Tab {
  title: string;
  onActivate: () => void;

  constructor(title: string, onActivate: () => void) {
    this.title = title;
    this.onActivate = onActivate;
  }
}
