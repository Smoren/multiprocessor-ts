import { describe, expect, it } from "@jest/globals";
import { infinite, single } from "itertools-ts";
import { Pool } from "../src";

describe('Pool IMap Unordered Extended Tests', () => {
  it('Array Input Calc Sinus Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = [];
    results.length = input.length;

    const errors = [];
    errors.length = input.length;

    for await (const [index, result, error] of pool.imapUnorderedExtended(input, calcSinTask)) {
      results[index] = result;
      errors[index] = error;
    }

    pool.close();

    expect(results.length).toBe(input.length);
    expect(errors.length).toBe(input.length);

    expect(results.filter((x) => x !== undefined).length).toBe(input.length);
    expect(errors.filter((x) => x !== undefined).length).toBe(0);

    for (let i = 0; i < results.length; i++) {
      expect(results[i]).toBeCloseTo(Math.sin(input[i]));
    }
  }, 10000);

  it('Iterable Inputs Calc Sinus Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const inputCount = 100;
    const input = single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount);
    const inputArray = [...single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount)];

    const results = [];
    results.length = inputArray.length;

    const errors = [];
    errors.length = inputArray.length;

    for await (const [index, result, error] of pool.imapUnorderedExtended(input, calcSinTask)) {
      results[index] = result;
      errors[index] = error;
    }

    pool.close();

    expect(results.length).toBe(inputArray.length);
    expect(errors.length).toBe(inputArray.length);

    expect(results.filter((x) => x !== undefined).length).toBe(inputArray.length);
    expect(errors.filter((x) => x !== undefined).length).toBe(0);

    for (let i = 0; i < results.length; i++) {
      expect(results[i]).toBeCloseTo(Math.sin(inputArray[i]));
    }
  }, 10000);

  it('Async Iterable Inputs Calc Sinus Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const inputCount = 100;
    const input = single.limitAsync(single.mapAsync(infinite.count(), (x) => x/inputCount), inputCount);
    const inputArray = [...single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount)];

    const results = [];
    results.length = inputArray.length;

    const errors = [];
    errors.length = inputArray.length;

    for await (const [index, result, error] of pool.imapUnorderedExtended(input, calcSinTask)) {
      results[index] = result;
      errors[index] = error;
    }

    pool.close();

    expect(results.length).toBe(inputArray.length);
    expect(errors.length).toBe(inputArray.length);

    expect(results.filter((x) => x !== undefined).length).toBe(inputArray.length);
    expect(errors.filter((x) => x !== undefined).length).toBe(0);

    for (let i = 0; i < results.length; i++) {
      expect(results[i]).toBeCloseTo(Math.sin(inputArray[i]));
    }
  }, 10000);

  it('Async Calc Sinus With Errors And Handlers Test', async () => {
    const poolSize = 4;

    const pool = new Pool(poolSize);
    const inputCount = 100;
    const input = single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount);
    const inputArray = [...single.limit(single.map(infinite.count(), (x) => x/inputCount), inputCount)];

    let resultsCount = 0;
    let errorsCount = 0;

    const onTaskSuccess = (result: number, input: number, index: number) => {
      console.log('taskSuccess', result, input, index);
      resultsCount++;
    };
    const onTaskError = (error: string, input: number, index: number) => {
      console.log('taskError', error, input, index);
      errorsCount++;
    };

    const results = [];
    results.length = inputArray.length;

    const errors = [];
    errors.length = inputArray.length;

    for await (const [index, result, error] of pool.imapUnorderedExtended(input, calcSinWithRandomErrorTask, onTaskSuccess, onTaskError)) {
      results[index] = result;
      errors[index] = error;
    }

    pool.close();

    expect(results.length).toBe(inputCount);
    expect(resultsCount + errorsCount).toBe(inputCount);
    expect(resultsCount).toBeGreaterThan(0);

    expect(results.length).toBe(inputArray.length);
    expect(errors.length).toBe(inputArray.length);

    expect(results.filter((x) => x !== undefined).length).toBe(resultsCount);
    expect(results.filter((x) => x === undefined).length).toBe(errorsCount);

    expect(errors.filter((x) => x !== undefined).length).toBe(errorsCount);
    expect(errors.filter((x) => x === undefined).length).toBe(resultsCount);

    for (let i = 0; i < results.length; i++) {
      if (results[i] === undefined) {
        continue;
      }
      expect(results[i]).toBeCloseTo(Math.sin(inputArray[i]));
    }

    const errorsSet = new Set(errors.filter((x) => x !== undefined));
    expect(errorsSet.size).toBe(1)
    expect(errorsSet.has('Random error')).toBe(true);
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

    const onTaskSuccess = (result: number, input: number[], index: number) => {
      console.log('taskSuccess', result, input, index);
      resultsCount++;
    };
    const onTaskError = (error: string, input: number[], index: number) => {
      console.log('taskError', error, input, index);
      errorsCount++;
    };

    const results = [];
    for await (const [_, result] of pool.imapUnorderedExtended(data, task, onTaskSuccess, onTaskError)) {
      results.push(result);
    }

    pool.close();

    expect(results.length).toBe(inputsCount);
    expect(resultsCount + errorsCount).toBe(inputsCount);
    expect(resultsCount).toBeGreaterThan(0);

    expect(results.filter((x) => x !== undefined).length).toBe(resultsCount);
    expect(results.filter((x) => x === undefined).length).toBe(errorsCount);
  }, 50000);
});

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

function calcSinWithRandomErrorTask(x: number): Promise<number> {
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
      return Promise.resolve(result);
    }

    result += delta;
  }

  return Promise.resolve(result);
}
