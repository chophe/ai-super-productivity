import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LLMService } from './llm.service';
import { TaskService } from '../../features/tasks/task.service';
import { GlobalConfigService } from '../../features/config/global-config.service';
import { of } from 'rxjs';

describe('LLMService', () => {
  let service: LLMService;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let globalConfigServiceSpy: jasmine.SpyObj<GlobalConfigService>;

  beforeEach(() => {
    const taskSpy = jasmine.createSpyObj('TaskService', [
      'add',
      'remove',
      'setDone',
      'update',
      'updateTags',
      'getByIdOnce$',
      'allTasks$',
    ]);
    const configSpy = jasmine.createSpyObj('GlobalConfigService', ['cfg$']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LLMService,
        { provide: TaskService, useValue: taskSpy },
        { provide: GlobalConfigService, useValue: configSpy },
      ],
    });

    service = TestBed.inject(LLMService);
    taskServiceSpy = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    globalConfigServiceSpy = TestBed.inject(
      GlobalConfigService,
    ) as jasmine.SpyObj<GlobalConfigService>;

    // Setup default config observable
    globalConfigServiceSpy.cfg$ = of({
      llm: {
        apiKey: 'test-key',
        provider: 'openai' as any,
        model: 'gpt-3.5-turbo',
      },
    } as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle missing API key', (done) => {
    globalConfigServiceSpy.cfg$ = of({
      llm: {
        apiKey: null,
        provider: 'openai' as any,
        model: 'gpt-3.5-turbo',
      },
    } as any);

    service.processPrompt('create a task').subscribe({
      next: (result) => {
        expect(result.success).toBeFalse();
        expect(result.message).toContain('API key not configured');
        done();
      },
    });
  });
});
