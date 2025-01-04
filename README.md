# Multiprocessing Pool Implementation for TypeScript

[![npm](https://img.shields.io/npm/v/multiprocessor.svg)](https://www.npmjs.com/package/multiprocessor)
[![npm](https://img.shields.io/npm/dm/multiprocessor.svg?style=flat)](https://www.npmjs.com/package/multiprocessor)
[![Coverage Status](https://coveralls.io/repos/github/Smoren/multiprocessor-ts/badge.svg?branch=master&rand=222)](https://coveralls.io/github/Smoren/multiprocessor-ts?branch=master)
![Build and test](https://github.com/Smoren/multiprocessor-ts/actions/workflows/test.yml/badge.svg)
[![Minified Size](https://badgen.net/bundlephobia/minzip/multiprocessor)](https://bundlephobia.com/result?p=multiprocessor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Description
-----------

Multiprocessing pool implementation for TypeScript.

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

const onItemResult = (itemResult: number, itemInput: number, taskIndex: number) => {
  console.log('itemResult', itemResult, itemInput, taskIndex);
};
const onItemError = (error: string, itemInput: number, taskIndex: number) => {
  console.log('itemError', error, itemInput, taskIndex);
};

const result = await pool.map(input, calcSinTask, onItemResult, onItemError);
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

API Reference
-------------

## Types
```typescript
export type Task<TInput, TResult> = ((input: TInput) => TResult) | ((input: TInput) => Promise<TResult>)
export type ItemResultHandler<TInput, TResult> = (itemResult: TResult, itemInput: TInput, taskIndex: number) => void;
export type ItemErrorHandler<TInput> = (error: string, itemInput: TInput, taskIndex: number) => void;
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
   * Asynchronously processes tasks from the provided inputs in a lazy unordered manner.
   * Tasks are executed concurrently using a pool of workers.
   *
   * @template TInput The type of the input elements.
   * @template TResult The type of the result elements.
   *
   * @param inputs An iterable or async iterable of input elements.
   * @param task The task to execute for each input element.
   * @param onItemResult Optional callback invoked when a task completes successfully.
   * @param onItemError Optional callback invoked when a task encounters an error.
   *
   * @returns An async generator yielding results of the tasks in completion order.
   */
  public async *imapUnordered<TInput, TResult>(
    inputs: Iterable<TInput> | AsyncIterable<TInput>,
    task: Task<TInput, TResult>,
    onItemResult?: ItemResultHandler<TInput, TResult>,
    onItemError?: ItemErrorHandler<TInput>,
  ): AsyncGenerator<TResult | undefined>;

  /**
   * Asynchronously processes tasks from the provided inputs in an ordered manner.
   * Tasks are executed concurrently using a pool of workers.
   *
   * @template TInput The type of the input elements.
   * @template TResult The type of the result elements.
   *
   * @param inputs An iterable or async iterable of input elements.
   * @param task The task to execute for each input element.
   * @param onItemResult Optional callback invoked when a task completes successfully.
   * @param onItemError Optional callback invoked when a task encounters an error.
   *
   * @returns A promise that resolves to an array of task results in the order of the input elements.
   */
  public async map<TInput, TResult>(
    inputs: Iterable<TInput> | AsyncIterable<TInput>,
    task: Task<TInput, TResult>,
    onItemResult?: ItemResultHandler<TInput, TResult>,
    onItemError?: ItemErrorHandler<TInput>,
  ): Promise<Array<TResult | undefined>>;

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
