export type Task<TInput, TResult> = (input: TInput) => (Promise<TResult> | TResult);
export type TaskSuccessHandler<TInput, TResult> = (result: TResult, input: TInput, index: number) => void;
export type TaskErrorHandler<TInput> = (error: string, input: TInput, index: number) => void;
export type TaskResponse<TResult> = [number, TResult | undefined, string | undefined];

export type TaskHandlers<TInput, TResult> = {
  onTaskSuccess?: TaskSuccessHandler<TInput, TResult>;
  onTaskError?: TaskErrorHandler<TInput>;
}

export interface TaskResponseMessage<TInput, TResult> {
  taskIndex: number;
  inputData: TInput;
  result?: TResult;
  error?: string;
}
