import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CustomerService } from '../../core/services/customer.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { Customer } from '../../core/models/api.models';
import { ListState } from '../../shared/utils/list-state';
import { showMutationError } from '../../shared/utils/mutation-error';
import { IconComponent } from '../../shared/icons/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { CustomerFormComponent } from './customer-form.component';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/components/action-menu/action-menu.component';
import { SearchComponent } from '../../shared/components/search/search.component';
@Component({
  selector: 'app-customers',
  imports: [
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    DrawerComponent,
    CustomerFormComponent,
    ActionMenuComponent,
    SearchComponent,
  ],
  templateUrl: './customers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersComponent {
  private readonly service = inject(CustomerService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly list = new ListState(
    () => this.service.list(),
    (customer, query) =>
      [customer.customerName, customer.email, customer.mobileNo, customer.customerCity]
        .join(' ')
        .toLowerCase()
        .includes(query),
  );
  readonly open = signal(false);
  readonly viewing = signal(false);
  readonly selected = signal<Customer | null>(null);
  readonly busy = signal(false);
  readonly deleting = signal<number | null>(null);
  readonly rowActions: ActionMenuItem[] = [
    { id: 'view', label: 'View', icon: 'view' },
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'ledger', label: 'Ledger', icon: 'ledger' },
    { id: 'delete', label: 'Delete', icon: 'delete', destructive: true },
  ];
  readonly customerForm = viewChild(CustomerFormComponent);
  constructor() {
    void this.initialize();
  }
  private async initialize(): Promise<void> {
    await this.list.load();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const customer = this.list.records().find((item) => item.customerId === id);
    if (customer) this.edit(customer, true);
  }
  edit(customer?: Customer, view = false): void {
    this.selected.set(customer || null);
    this.viewing.set(view);
    this.open.set(true);
  }
  hasUnsavedChanges(): boolean {
    return this.busy() || !!this.customerForm()?.form.dirty;
  }
  async saved(): Promise<void> {
    this.open.set(false);
    await this.list.load();
  }
  async remove(customer: Customer): Promise<void> {
    if (
      this.deleting() !== null ||
      !(await this.feedback.confirm(
        'Delete customer?',
        'Delete ' + customer.customerName + '? Existing bookings may reference this customer.',
      ))
    )
      return;
    this.deleting.set(customer.customerId);
    try {
      await firstValueFrom(this.service.delete(customer.customerId));
      this.feedback.toast('Customer deleted successfully.');
      await this.list.load();
    } catch (error) {
      showMutationError(this.feedback, error);
    } finally {
      this.deleting.set(null);
    }
  }
  customerAction(action: string, customer: Customer): void {
    if (action === 'view') this.viewCustomer(customer);
    if (action === 'edit') this.edit(customer);
    if (action === 'ledger')
      void this.router.navigate(['/customer-ledger'], {
        queryParams: { customer: customer.customerId },
      });
    if (action === 'delete') void this.remove(customer);
  }
  viewCustomer(customer: Customer, event?: Event): void {
    event?.preventDefault();
    void this.router.navigate(['/customers', customer.customerId]);
  }
  closeDrawer(): void {
    this.open.set(false);
    if (this.route.snapshot.paramMap.has('id')) void this.router.navigate(['/customers']);
  }
}
