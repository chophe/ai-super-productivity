import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { TaskSharedActions } from '../../../root-store/meta/task-shared.actions';
import { TaskUiEffects } from './task-ui.effects';
import { SnackService } from '../../../core/snack/snack.service';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { Action } from '@ngrx/store';
import { T } from '../../../t.const';

describe('TaskUiEffects - Task Not Found Error', () => {
  let effects: TaskUiEffects;
  let actions$: Observable<Action>;
  let snackService: jasmine.SpyObj<SnackService>;
  let store: Store;

  beforeEach(() => {
    const snackServiceSpy = jasmine.createSpyObj('SnackService', ['open']);

    TestBed.configureTestingModule({
      providers: [
        TaskUiEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            tasks: {
              entities: {
                'existing-task': { id: 'existing-task', title: 'Existing Task' },
              },
            },
          },
        }),
        { provide: SnackService, useValue: snackServiceSpy },
      ],
    });

    effects = TestBed.inject(TaskUiEffects);
    snackService = TestBed.inject(SnackService) as jasmine.SpyObj<SnackService>;
    store = TestBed.inject(Store);
  });

  it('should show error snackbar when trying to update non-existent task', (done) => {
    const updateAction = TaskSharedActions.updateTask({
      task: { id: 'non-existent-task', changes: { title: 'Updated Title' } },
    });

    actions$ = of(updateAction);

    effects.taskNotFoundError$.subscribe(() => {
      expect(snackService.open).toHaveBeenCalledWith({
        type: 'ERROR',
        msg: T.F.TASK.S.TASK_NOT_FOUND,
        translateParams: { taskId: 'non-existent-task' },
        ico: 'error',
      });
      done();
    });
  });

  it('should not show error snackbar when updating existing task', (done) => {
    const updateAction = TaskSharedActions.updateTask({
      task: { id: 'existing-task', changes: { title: 'Updated Title' } },
    });

    actions$ = of(updateAction);

    // Subscribe to the effect but expect it not to emit
    let effectEmitted = false;
    effects.taskNotFoundError$.subscribe(() => {
      effectEmitted = true;
    });

    // Wait a bit to ensure the effect doesn't emit
    setTimeout(() => {
      expect(effectEmitted).toBeFalse();
      expect(snackService.open).not.toHaveBeenCalled();
      done();
    }, 100);
  });
});