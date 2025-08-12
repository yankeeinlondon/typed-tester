export interface TestInterface {
  name: string;
  value: number;
}

export function testFunction(input: TestInterface): string {
  return input.name;
}

export type TestType = {
  id: string;
  data: TestInterface;
};