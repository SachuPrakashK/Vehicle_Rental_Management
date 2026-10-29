import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { endpoints } from '../config/api.config';
import { Customer } from '../models/api.models';
import { map, switchMap, of, throwError } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);
  list() {
    return this.api.get<Customer[]>(endpoints.customers);
  }
  create(customer: Customer) {
    return this.api.post<Customer | Customer[] | null>(endpoints.createCustomer, customer).pipe(
      switchMap((result) => {
        const saved = Array.isArray(result) ? result[0] : result;
        if (saved?.customerId) return of(saved);
        return this.list().pipe(
          switchMap((customers) => {
            const matches = customers.filter(
              (item) =>
                item.customerName.trim() === customer.customerName.trim() &&
                item.mobileNo === customer.mobileNo &&
                item.email === customer.email,
            );
            return matches.length === 1
              ? of(matches[0])
              : throwError(
                  () =>
                    new Error(
                      'Customer was saved, but could not be uniquely identified. Refresh the customer list and select the correct record.',
                    ),
                );
          }),
        );
      }),
    );
  }
  update(customer: Customer) {
    return this.api.put<Customer | null>(endpoints.updateCustomer, customer);
  }
  delete(id: number) {
    return this.api.delete(endpoints.deleteCustomer, { id });
  }
}
