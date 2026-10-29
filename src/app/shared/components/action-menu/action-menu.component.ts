import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent, IconName } from '../../icons/icon.component';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: IconName;
  destructive?: boolean;
}

@Component({
  selector: 'app-action-menu',
  imports: [IconComponent],
  templateUrl: './action-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': '$event.stopPropagation()' },
})
export class ActionMenuComponent {
  readonly label = input('Actions');
  readonly items = input.required<ActionMenuItem[]>();
  readonly disabled = input(false);
  readonly selected = output<string>();
  readonly open = signal(false);
  readonly position = signal({ top: 0, left: 0 });
  readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  toggle(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.open.set(false);
      return;
    }
    const rect = this.trigger().nativeElement.getBoundingClientRect();
    const width = 170;
    const height = this.items().length * 40 + 12;
    this.position.set({
      top:
        rect.bottom + height + 8 > window.innerHeight
          ? Math.max(8, rect.top - height - 6)
          : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
    });
    this.open.set(true);
  }

  choose(id: string): void {
    this.open.set(false);
    this.selected.emit(id);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  close(): void {
    this.open.set(false);
  }
}
