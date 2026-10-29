import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { FeedbackService } from '../services/feedback.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  it('uses FeedbackService after an asynchronous HTTP authentication failure', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    const http = TestBed.inject(HttpTestingController);
    const feedback = TestBed.inject(FeedbackService);
    const client = TestBed.inject(HttpClient);
    const result = firstValueFrom(client.post<never>('/api/auth/login', {})).catch(
      (error: Error) => error,
    );

    http
      .expectOne('/api/auth/login')
      .flush({ message: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });

    expect((await result).message).toBe('Invalid email or password.');
    expect(feedback.toasts()[0]?.message).toBe('Invalid email or password.');
    http.verify();
  });
});
