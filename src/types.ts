export type Task<TInput, TResult> = ((input: TInput) => TResult) | ((input: TInput) => Promise<TResult>)
export type TaskSuccessHandler<TInput, TResult> = (result: TResult, input: TInput, index: number) => void;
export type TaskErrorHandler<TInput> = (error: string, input: TInput, index: number) => void;
export type TaskResponse<TResult> = [number, TResult | undefined, string | undefined];

export interface TaskResponseMessage<TInput, TResult> {
  taskIndex: number;
  inputData: TInput;
  result?: TResult;
  error?: string;
}
