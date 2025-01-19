# Multiprocessing Pool Implementation for TypeScript

[![npm](https://img.shields.io/npm/v/multiprocessor.svg)](https://www.npmjs.com/package/multiprocessor)
[![npm](https://img.shields.io/npm/dm/multiprocessor.svg?style=flat)](https://www.npmjs.com/package/multiprocessor)
[![Coverage Status](https://coveralls.io/repos/github/Smoren/multiprocessor-ts/badge.svg?branch=master&rand=222)](https://coveralls.io/github/Smoren/multiprocessor-ts?branch=master)
![Build and test](https://github.com/Smoren/multiprocessor-ts/actions/workflows/test.yml/badge.svg)
[![Minified Size](https://badgen.net/bundlephobia/minzip/multiprocessor)](https://bundlephobia.com/result?p=multiprocessor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Description
-----------

Multiprocessing pool implementation for NodeJS and TypeScript.

Real multiprocessing is implemented using [child_process](https://nodejs.org/api/child_process.html) module.

Setup
-----

```bash
npm i multiprocessor
```

Usage example
-------------

```typescript
import { Pool } from 'multiprocessor';

const poolSize = 4;

const pool = new Pool(poolSize);
const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const onTaskSuccess = (taskResult: number, taskInput: number, taskIndex: number) => {
  console.log('taskSuccess', taskResult, taskInput, taskIndex);
};
const onTaskError = (taskError: string, taskInput: number, taskIndex: number) => {
  console.log('taskError', taskError, taskInput, taskIndex);
};

const result = await pool.map(input, calcSinTask, onTaskSuccess, onTaskError);
pool.close();

console.log(result);
// [ 0.8414, 0.9092, 0.1411, ... ]

function calcSinTask(x: number): number {
  let result = 0;
  let sign = 1;
  let power = x;
  let factorial = 1;

  for (let n = 0; n < 1000000; n++) {
    if (n > 0) {
      factorial *= (2 * n) * (2 * n + 1);
      power *= x * x;
      sign *= -1;
    }

    const delta = sign * (power / factorial);

    if (isNaN(result + delta)) {
      return result
    }

    result += delta;
  }

  return result;
}
```

### Example with import

You can run this example from [this repository](https://github.com/Smoren/multiprocessor-example-ts).

```typescript
// File: src/index.ts
import { Pool } from 'multiprocessor';

const poolSize = 4;

const pool = new Pool(poolSize);
const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const result = await pool.map(input, calcSinTask);
pool.close();

console.log(result);
// [ 0.8414, 0.9092, 0.1411, ... ]

async function calcSinTask(x: number): Promise<number> {
  const dirName = __dirname.replace('/node_modules/multiprocessor/lib', '/src');
  const { calcSin } = await import(`${dirName}/path/to/your/module`);
  return calcSin(x);
}
```

```typescript
// File: src/path/to/your/module.ts
export function calcSin(x: number): number {
  let result = 0;
  let sign = 1;
  let power = x;
  let factorial = 1;

  for (let n = 0; n < 1000000; n++) {
    if (n > 0) {
      factorial *= (2 * n) * (2 * n + 1);
      power *= x * x;
      sign *= -1;
    }

    const delta = calcDelta(sign, power, factorial);

    if (isNaN(result + delta)) {
      return result
    }

    result += delta;
  }

  return result;
}

function calcDelta(sign: number, power: number, factorial: number): number {
  return sign * (power / factorial);
}
```

API Reference
-------------

For detailed documentation and usage examples, please refer to the [API documentation](https://smoren.github.io/multiprocessor-ts/).

## Types
```typescript
export type Task<TInput, TResult> = (input: TInput) => (Promise<TResult> | TResult);
export type TaskSuccessHandler<TInput, TResult> = (result: TResult, input: TInput, index: number) => void;
export type TaskErrorHandler<TInput> = (error: string, input: TInput, index: number) => void;
export type TaskResponse<TResult> = [number, TResult | undefined, string | undefined];
```

## Pool
```typescript
class Pool extends EventEmitter {
  /**
   * Create a new pool with the specified number of workers.
   *
   * @param poolSize The number of workers to create in the pool.
   */
  constructor(poolSize: number);

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
  ): Promise<Array<TResult | undefined>>;

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
  ): AsyncGenerator<TResult | undefined>;

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
  ): AsyncGenerator<TResult | undefined>;

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
  ): AsyncGenerator<TaskResponse<TResult>>;

  /**
   * Closes the worker pool by terminating all worker processes.
   * This method should be called when the pool is no longer needed
   * to ensure that all resources are properly released.
   */
  public close();
}
```

Unit testing
------------

```bash
npm i
npm run test
```

License
-------

Multiprocessor TS is licensed under the MIT License.
