interface FixedLengthArray<T, L extends number> extends Array<T> {
    readonly length: L;
  }
type A = FixedLengthArray<number, 3>
  const arr = [1, 2, 3] as FixedLengthArray<number, 2>;
  console.log(arr)
  
  type ArrayType<N extends number> =
  N extends 0 ? string :
  N extends 1 ? string[] :
  N extends 2 ? string[][] :
  N extends 3 ? string[][][] :
  string[][][];

// Example usage
const arr1: ArrayType<1> = ['hello', 'world'];
const arr2: ArrayType<3> = [[['foo'], ['bar']], [['baz'], ['qux']]];


const filteredInputs = [
    { inputName: 'out1', dimension: 0, size: [ 0 ], Public: 1 },
    { inputName: 'out2', dimension: 0, size: [ 0 ], Public: 1 },
    { inputName: 'c', dimension: 0, size: [ 0 ], Public: 1 },
    { inputName: 'd', dimension: 3, size: [ 0 ], Public: 1 },
    { inputName: 'f', dimension: 2, size: [ 0 ], Public: 1 },
    { inputName: 'a', dimension: 0, size: [ 0 ], Public: 0 },
    { inputName: 'b', dimension: 0, size: [ 0 ], Public: 0 },
    { inputName: 'enforce', dimension: 0, size: [ 0 ], Public: 0 }
]

let obj = {};
for (let i=0; i<filteredInputs.length; i++) {
    let dim = filteredInputs[i].dimension;
    obj[filteredInputs[i].inputName] as ArrayType<3>
}

console.log(obj)

interface InputMap<T> {
    inputName: string;
    dimension: number;
    size: Array<number>;
    Public: number;
  }
  
  function parseInputMap<T>(inputMap: Array<InputMap<T>>): Record<string, T | T[]> {
    const result: Record<string, T | T[]> = {};
    inputMap.forEach((input) => {
      const { inputName, dimension, size } = input;
      let type: T | T[] | undefined = undefined;
      if (dimension === 0) {
        type = 'string' as T ;
      } else {
        type = 'string' as T;
        for (let i = 0; i < dimension; i++) {
          type = `Array<${type}>` as T | Array<T>;
        }
      }
      if (type !== undefined) {
        result[inputName] = type;
      }
    });
    return result;
  }
  
  const inputMap: Array<InputMap<number>> = [
    { inputName: 'a', dimension: 0, size: [0], Public: 1 },
    { inputName: 'b', dimension: 1, size: [5], Public: 1 },
    { inputName: 'c', dimension: 2, size: [3, 2], Public: 1 },
    { inputName: 'd', dimension: 3, size: [3, 2, 3], Public: 1 },
    { inputName: 'e', dimension: 4, size: [3, 2, 3, 5], Public: 1 },
  
  ];
  
  const output = parseInputMap(inputMap);
  console.log('output', output); // { a: 'string', b: Array<number>, c: Array<Array<string>> }
type ParsedTypes<T> = T extends 'string' ? string :
  T extends `Array<${infer U}>` ? U extends 'string' ? string[] : ParsedArray<U> :
  { [K in keyof T]: ParsedTypes<T[K]> };

interface ParsedArray<T> extends Array<ParsedTypes<T>> {}

function parseTypes<T extends Record<string, string>>(input: T): ParsedTypes<T> {
  const result: any = {};
  for (const [inputName, type] of Object.entries(input)) {
    if (type === 'string') {
      result[inputName] = 'string';
    } else if (type.startsWith('Array<')) {
      const innerType = type.slice(6, -1);
      result[inputName] = [] as ParsedArray<typeof innerType>;
    } else {
      result[inputName] = parseTypes(JSON.parse(type));
    }
  }
  return result;
}

const input = {
  a: 'string',
  b: 'Array<string>',
  c: 'Array<Array<string>>',
  d: 'Array<Array<Array<string>>>',
  e: 'Array<Array<Array<Array<string>>>>'
};

type OutputType = ParsedTypes<typeof input>;
