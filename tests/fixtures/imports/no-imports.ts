// File with no imports at all

export const localFunction = () => {
  return "This file has no imports";
};

export interface LocalType {
  id: number;
  name: string;
}

export class LocalClass {
  constructor(public value: string) {}
}
