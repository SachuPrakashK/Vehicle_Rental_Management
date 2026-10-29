import { Injectable, computed, signal } from '@angular/core';
export type ToastKind = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}
export interface Confirmation {
  title: string;
  message: string;
  action: string;
}
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly requests = signal(0);
  readonly loading = computed(() => this.requests() > 0);
  readonly toasts = signal<Toast[]>([]);
  readonly confirmation = signal<Confirmation | null>(null);
  private nextId = 0;
  private resolver?: (answer: boolean) => void;
  begin(): void {
    this.requests.update((n) => n + 1);
  }
  end(): void {
    this.requests.update((n) => Math.max(0, n - 1));
  }
  toast(message: string, kind: ToastKind = 'success'): void {
    const id = ++this.nextId;
    this.toasts.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 12000 : 6500);
  }
  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((item) => item.id !== id));
  }
  confirm(title: string, message: string, action = 'Delete'): Promise<boolean> {
    this.resolver?.(false);
    this.confirmation.set({ title, message, action });
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }
  answer(answer: boolean): void {
    this.confirmation.set(null);
    this.resolver?.(answer);
    this.resolver = undefined;
  }
}
