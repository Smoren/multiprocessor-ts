import * as path from 'path';
import { EventEmitter } from 'events';
import { fork, ChildProcess } from 'child_process';
import type { TaskErrorHandler, TaskSuccessHandler, TaskResponseMessage, Task, TaskResponse } from "./types";

/**
 * A class representing a pool of workers for executing tasks concurrently using child processes.
 * Extends EventEmitter to allow task result events to be emitted.
 */
export class Pool extends EventEmitter {
  /**
   * Array of child processes representing the workers in the pool.
   */
  private workers: ChildProcess[] = [];
  /**
   * Array of child processes representing the available workers in the pool.
   */
  private availableWorkers: ChildProcess[] = [];
  /**
   * Array of tasks to be processed in the pool.
   */
  private taskQueue: Array<{ inputData: any; taskFunctionString: string }> = [];
  /**
   * Map of tasks currently being processed by workers, keyed by worker.
   */
  private tasksInProcess = new Map<ChildProcess, any>();
  /**
   * Current task index, incremented for each task processed.
   */
  private currentTaskIndex = 0;
  /**
   * Optional callback invoked when a task completes successfully.
   */
  private onTaskSuccess: TaskSuccessHandler<any, any>;
  /**
   * Optional callback invoked when a task encounters an error.
   */
  private onTaskError: TaskErrorHandler<any>;

  /**
   * Create a new pool with the specified number of workers.
   *
   * @param poolSize The number of workers to create in the pool.
   */
  constructor(poolSize: number) {
    super();
    this.initWorkers(poolSize);
    this.onTaskSuccess = this.createEmptyHandler();
    this.onTaskError = this.createEmptyHandler();
  }

  /**
   * Asynchronously processes tasks from the provided inputs in an ordered manner.
   * Tasks are executed concurrently using a pool of workers.
   *
   * @template TInput The type of the input elements.
   * @template TResult The type of the result elements.
   *
   * @param inputs An iterable or async iterable of input elements.
   * @param task The task to execute for each input element.
   * @param onTaskSuccess Optional callback invoked when a task completes successfully.
   * @param onTaskError Optional callback invoked when a task encounters an error.
   *
   * @returns A promise that resolves to an array of task results in the order of the input elements.
   */
  public async map<TInput, TResult>(
    inputs: Iterable<TInput> | AsyncIterable<TInput>,
    task: Task<TInput, TResult>,
    onTaskSuccess?: TaskSuccessHandler<TInput, TResult>,
    onTaskError?: TaskErrorHandler<TInput>,
  ): Promise<Array<TResult | undefined>> {
    const result: TaskResponse<TResult>[] = [];
    for await (const item of this.imapUnorderedExtended(inputs, task, onTaskSuccess, onTaskError)) {
      result.push(item);
    }
    result.sort((lhs, rhs) => lhs[0] - rhs[0]);
    return result.map((item) => item[1]);
  }

  /**
   * Asynchronously processes tasks from the provided inputs in a lazy ordered manner.
   * Tasks are executed concurrently using a pool of workers.
   *
   * @template TInput The type of the input elements.
   * @template TResult The type of the result elements.
   *
   * @param inputs An iterable or async iterable of input elements.
   * @param task The task to execute for each input element.
   * @param onTaskSuccess Optional callback invoked when a task completes successfully.
   * @param onTaskError Optional callback invoked when a task encounters an error.
   *
   * @returns An async generator yielding results of the tasks in the order of the input elements.
   */
  public async *imap<TInput, TResult>(
    inputs: Iterable<TInput> | AsyncIterable<TInput>,
    task: Task<TInput, TResult>,
    onTaskSuccess?: TaskSuccessHandler<TInput, TResult>,
    onTaskError?: TaskErrorHandler<TInput>,
  ): AsyncGenerator<TResult | undefined> {
    let lastYieldedIndex = -1;
    const bufferedResults: Map<number, TResult | undefined> = new Map();

    for await (const [taskIndex, result] of this.imapUnorderedExtended(inputs, task, onTaskSuccess, onTaskError)) {
      if (taskIndex !== lastYieldedIndex + 1) {
        bufferedResults.set(taskIndex, result);
        continue;
      }

      ++lastYieldedIndex;
      yield result;

      while (bufferedResults.has(lastYieldedIndex + 1)) {
        yield bufferedResults.get(lastYieldedIndex + 1);
        bufferedResults.delete(lastYieldedIndex + 1);
        ++lastYieldedIndex;
      }
    }
  }

  /**
   * Asynchronously processes tasks from the provided inputs in a lazy unordered manner.
   * Tasks are executed concurrently using a pool of workers.
   *
   * @template TInput The type of the input elements.
   * @template TResult The type of the result elements.
   *
   * @param inputs An iterable or async iterable of input elements.
   * @param task The task to execute for each input element.
   * @param onTaskSuccess Optional callback invoked when a task completes successfully.
   * @param onTaskError Optional callback invoked when a task encounters an error.
   *
   * @returns An async generator yielding results of the tasks in completion order.
   */
  public async *imapUnordered<TInput, TResult>(
    inputs: Iterable<TInput> | AsyncIterable<TInput>,
    task: Task<TInput, TResult>,
    onTaskSuccess?: TaskSuccessHandler<TInput, TResult>,
    onTaskError?: TaskErrorHandler<TInput>,
  ): AsyncGenerator<TResult | undefined> {
    for await (const [_, result] of this.imapUnorderedExtended(inputs, task, onTaskSuccess, onTaskError)) {
      yield result;
    }
  }

  /**
   * Asynchronously processes tasks from the provided inputs in a lazy unordered manner with extended information.
   * Tasks are executed concurrently using a pool of workers.
   *
   * @template TInput The type of the input elements.
   * @template TResult The type of the result elements.
   *
   * @param inputs An iterable or async iterable of input elements.
   * @param task The task to execute for each input element.
   * @param onTaskSuccess Optional callback invoked when a task completes successfully.
   * @param onTaskError Optional callback invoked when a task encounters an error.
   *
   * @returns An async generator yielding task responses containing the index, result or error for each task.
   */
  public async *imapUnorderedExtended<TInput, TResult>(
    inputs: Iterable<TInput> | AsyncIterable<TInput>,
    task: Task<TInput, TResult>,
    onTaskSuccess?: TaskSuccessHandler<TInput, TResult>,
    onTaskError?: TaskErrorHandler<TInput>,
  ): AsyncGenerator<TaskResponse<TResult>> {
    this.currentTaskIndex = 0;

    this.onTaskSuccess = onTaskSuccess ?? this.createEmptyHandler();
    this.onTaskError = onTaskError ?? this.createEmptyHandler();

    const taskFunctionString = task.toString();
    let totalTasks = 0;

    // Enqueue all tasks
    for await (const inputData of inputs) {
      this.taskQueue.push({ inputData, taskFunctionString });
      ++totalTasks;
    }

    // Start processing
    this.processQueue();

    let received = 0;

    while (received < totalTasks) {
      const result = await new Promise<any>((resolve) => {
        this.once('result', resolve);
      });
      received++;
      yield [result.taskIndex, result.result, result.error];
    }
  }

  /**
   * Closes the worker pool by terminating all worker processes.
   * This method should be called when the pool is no longer needed
   * to ensure that all resources are properly released.
   */
  public close() {
    for (const worker of this.workers) {
      worker.kill();
    }
  }

  private processQueue() {
    while (this.availableWorkers.length > 0 && this.taskQueue.length > 0) {
      const worker = this.availableWorkers.shift()!;
      const task = this.taskQueue.shift()!;

      this.tasksInProcess.set(worker, task.inputData);
      worker.send({
        taskFunctionString: task.taskFunctionString,
        inputData: task.inputData,
        taskIndex: this.currentTaskIndex++,
      });
    }
  }

  private initWorkers(poolSize: number) {
    for (let i = 0; i < poolSize; i++) {
      const worker = fork(path.resolve(__dirname, './worker.js'));
      worker.on('message', (message: TaskResponseMessage<any, any>) => {
        const { result, error, inputData, taskIndex } = message;
        if (error) {
          this.onTaskError(error, inputData, taskIndex);
        } else {
          this.onTaskSuccess(result, inputData, taskIndex);
        }
        this.emit('result', { result, taskIndex, error });
        this.tasksInProcess.delete(worker);
        this.availableWorkers.push(worker);
        this.processQueue();
      });
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  private createEmptyHandler() {
    return () => {};
  }
}
