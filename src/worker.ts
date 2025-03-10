process.on('message', async (message: any) => {
  const { taskFunctionString, inputData, taskIndex } = message;
  const taskFunction = eval(`(${taskFunctionString})`);
  try {
    const result = await taskFunction(inputData);
    process.send!({ result, inputData, taskIndex });
  } catch (error) {
    process.send!({ error: (error as Error).message, inputData, taskIndex });
  }
});
