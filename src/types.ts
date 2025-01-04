export type ItemResultHandler<TInput, TResult> = (itemResult: TResult, itemInput: TInput, taskIndex: number) => void;
export type ItemErrorHandler<TInput> = (error: string, itemInput: TInput, taskIndex: number) => void;

export interface ResultMessage<TInput, TResult> {
  taskIndex: number;
  inputData: TInput;
  result?: TResult;
  error?: string;
}
