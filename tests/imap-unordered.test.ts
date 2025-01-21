import { describe, expect, it } from "@jest/globals";
import { infinite, single } from "itertools-ts";
import { Pool } from "../src";
import { TaskHandlers } from "../src/types";

describe('Pool IMap Unordered Tests', () => {
  it('Array Input Calc Sinus Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const indexedInput: [number, number][] = input.map((x, index) => [index, x]);

    const result = [];
    result.length = indexedInput.length;

    for await (const item of pool.imapUnordered(indexedInput, calcSinIndexedTask)) {
      const [taskIndex, taskResult] = item!;
      result[taskIndex] = taskResult;
    }

    pool.close();

    expect(result.length).toBe(input.length);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeCloseTo(Math.sin(input[i]));
    }
  }, 10000);

  it('Iterable Inputs Calc Sinus Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const inputCount = 100;
    const input = single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount);
    const inputArray = [...single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount)];
    const indexedInput: Iterable<[number, number]> = single.enumerate(input);

    const result = [];
    result.length = inputCount;

    for await (const item of pool.imapUnordered(indexedInput, calcSinIndexedTask)) {
      const [taskIndex, taskResult] = item!;
      result[taskIndex] = taskResult;
    }

    pool.close();

    expect(result.length).toBe(inputCount);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeCloseTo(Math.sin(inputArray[i]));
    }
  }, 10000);

  it('Async Iterable Inputs Calc Sinus Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const inputCount = 100;
    const input = single.limitAsync(single.mapAsync(infinite.count(), (x) => x/inputCount), inputCount);
    const inputArray = [...single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount)];
    const indexedInput: AsyncIterable<[number, number]> = single.enumerateAsync(input);

    const result = [];
    result.length = inputCount;

    for await (const item of pool.imapUnordered(indexedInput, calcSinIndexedTask)) {
      const [taskIndex, taskResult] = item!;
      result[taskIndex] = taskResult;
    }

    pool.close();

    expect(result.length).toBe(inputCount);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeCloseTo(Math.sin(inputArray[i]));
    }
  }, 10000);

  it('Async Calc Sinus With Errors And Handlers Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const inputCount = 100;
    const input = single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount);
    const inputArray = [...single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount)];
    const indexedInput: Iterable<[number, number]> = single.enumerate(input);

    let resultsCount = 0;
    let errorsCount = 0;

    const taskHandlers: TaskHandlers<[number, number], [number, number]> = {
      onTaskSuccess: (result: [number, number], input: [number, number], index: number) => {
        console.log('taskSuccess', result, input, index);
        resultsCount++;
      },
      onTaskError: (error: string, input: [number, number], index: number) => {
        console.log('taskError', error, input, index);
        errorsCount++;
      },
    };

    const result: Array<number | undefined> = [...single.repeat(undefined, inputCount)];

    for await (const item of pool.imapUnordered(indexedInput, calcSinIndexedWithRandomErrorTask, taskHandlers)) {
      if (item === undefined) {
        continue;
      }
      const [taskIndex, taskResult] = item!;
      result[taskIndex] = taskResult;
    }

    pool.close();

    expect(result.length).toBe(inputCount);
    expect(resultsCount + errorsCount).toBe(inputCount);
    expect(resultsCount).toBeGreaterThan(0);

    expect(result.filter((x) => x !== undefined).length).toBe(resultsCount);
    expect(result.filter((x) => x === undefined).length).toBe(errorsCount);

    expect(result.length).toBe(inputCount);
    for (let i = 0; i < result.length; i++) {
      if (result[i] === undefined) {
        continue;
      }
      expect(result[i]).toBeCloseTo(Math.sin(inputArray[i]));
    }
  }, 10000);

  it('Long Test', async () => {
    const poolSize = 4;
    const inputsCount = 100;

    const pool = new Pool(poolSize);
    const data = [...single.limit(infinite.count(), inputsCount)].map((x) => [x]);

    const task = (input: number[]) => {
      let r = 0;
      for (let i = 0; i < 100000000; ++i) {
        r += input[0] ** 2;
      }
      if (Math.random() > 0.9) {
        throw new Error('Random error');
      }
      return Promise.resolve(r);
    };

    let resultsCount = 0;
    let errorsCount = 0;

    const taskHandlers: TaskHandlers<number[], number> = {
      onTaskSuccess: (result: number, input: number[], index: number) => {
        console.log('taskSuccess', result, input, index);
        resultsCount++;
      },
      onTaskError: (error: string, input: number[], index: number) => {
        console.log('taskError', error, input, index);
        errorsCount++;
      },
    };

    const result = [];
    for await (const item of pool.imapUnordered(data, task, taskHandlers)) {
      result.push(item);
    }

    pool.close();

    expect(result.length).toBe(inputsCount);
    expect(resultsCount + errorsCount).toBe(inputsCount);
    expect(resultsCount).toBeGreaterThan(0);

    expect(result.filter((x) => x !== undefined).length).toBe(resultsCount);
    expect(result.filter((x) => x === undefined).length).toBe(errorsCount);
  }, 50000);
});

function calcSinIndexedTask([taskIndex, x]: [number, number]): [number, number] {
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
      return [taskIndex, result];
    }

    result += delta;
  }

  return [taskIndex, result];
}

function calcSinIndexedWithRandomErrorTask([taskIndex, x]: [number, number]): Promise<[number, number]> {
  if (Math.random() > 0.5) {
    throw new Error('Random error');
  }

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
      return Promise.resolve([taskIndex, result]);
    }

    result += delta;
  }

  return Promise.resolve([taskIndex, result]);
}
