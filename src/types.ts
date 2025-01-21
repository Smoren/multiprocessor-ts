/**
 * Pool task function that takes an input and returns a result, either synchronously or asynchronously.
 *
 * @template TInput The type of the input.
 * @template TResult The type of the result.
 */
export type Task<TInput, TResult> = (input: TInput) => (Promise<TResult> | TResult);

/**
 * A function that is called when a task succeeds.
 *
 * @template TInput The type of the input.
 * @template TResult The type of the result.
 *
 * @param result The result of the task.
 * @param input The input that was passed to the task.
 * @param index The index of the task in the order of the original input data.
 */
export type TaskSuccessHandler<TInput, TResult> = (result: TResult, input: TInput, index: number) => void;

/**
 * A function that is called when a task fails.
 *
 * @template TInput The type of the input.
 *
 * @param error The message of the error that occurred during the task.
 * @param input The input that was passed to the task.
 * @param index The index of the task in the order of the original input data.
 */
export type TaskErrorHandler<TInput> = (error: string, input: TInput, index: number) => void;

/**
 * The type of the result of a task.
 *
 * * The index of the task in the order of the original input data.
 * * The result of the task, if it succeeded.
 * * The error that occurred during the task, if it failed.
 *
 * @template TResult The type of the result.
 */
export type TaskResponse<TResult> = [number, TResult | undefined, string | undefined];

/**
 * An object that contains functions for handling task events.
 *
 * @template TInput The type of the input.
 * @template TResult The type of the result.
 */
export type TaskHandlers<TInput, TResult> = {
  /**
   * A function that is called when a task succeeds.
   */
  onTaskSuccess?: TaskSuccessHandler<TInput, TResult>;
  /**
   * A function that is called when a task fails.
   */
  onTaskError?: TaskErrorHandler<TInput>;
}

/**
 * An object that is sent from a worker process to the main process when a task completes.
 *
 * @template TInput The type of the input.
 * @template TResult The type of the result.
 */
export interface TaskResponseMessage<TInput, TResult> {
  /**
   * The index of the task in the order of the original input data.
   */
  taskIndex: number;
  /**
   * The input that was passed to the task.
   */
  inputData: TInput;
  /**
   * The result of the task, if it succeeded.
   */
  result?: TResult;
  /**
   * The error that occurred during the task, if it failed.
   */
  error?: string;
}
