import { describe, expect, it } from "@jest/globals";
import { Pool } from "../src";
import { infinite, single } from "itertools-ts";

describe('Multiprocessing Examples', () => {
  it('Pool Map Example Test', () => {
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

    const onItemResult = (itemResult: number, itemInput: number[], taskIndex: number) => {
      console.log('itemResult', itemResult, itemInput, taskIndex);
      resultsCount++;
    };
    const onItemError = (error: string, itemInput: number[], taskIndex: number) => {
      console.log('itemError', error, itemInput, taskIndex);
      errorsCount++;
    };

    return pool.map(data, task, onItemResult, onItemError).then((result) => {
      pool.close();

      expect(result.length).toBe(inputsCount);
      expect(resultsCount + errorsCount).toBe(inputsCount);
      expect(resultsCount).toBeGreaterThan(0);

      expect(result.filter((x) => x !== undefined).length).toBe(resultsCount);
      expect(result.filter((x) => x === undefined).length).toBe(errorsCount);
    });
  }, 50000);

  it('Pool IMap Unordered Example Test', async () => {
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

    const onItemResult = (itemResult: number, itemInput: number[], taskIndex: number) => {
      console.log('itemResult', itemResult, itemInput, taskIndex);
      resultsCount++;
    };
    const onItemError = (error: string, itemInput: number[], taskIndex: number) => {
      console.log('itemError', error, itemInput, taskIndex);
      errorsCount++;
    };

    const result = [];
    for await (const item of pool.imapUnordered(data, task, onItemResult, onItemError)) {
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
