import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import type { PermissionCode } from '../../core/models/rbac.models';
import { PermissionService } from '../../core/services/permission.service';

@Directive({ selector: '[appHasPermission]' })
export class HasPermissionDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private readonly permissions = inject(PermissionService);
  readonly appHasPermission = input.required<PermissionCode>();

  constructor() {
    effect(() => {
      this.container.clear();
      if (this.permissions.has(this.appHasPermission()))
        this.container.createEmbeddedView(this.template);
    });
  }
}
