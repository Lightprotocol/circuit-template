import { InputType } from "zlib";

  
const inputMap = [
  { inputName: 'a', dimension: 0, size: [0], Public: 1 },
  { inputName: 'b', dimension: 1, size: [5], Public: 1 },
  { inputName: 'c', dimension: 2, size: [3, 2], Public: 1 },
  { inputName: 'd', dimension: 3, size: [3, 2, 3], Public: 1 },
  { inputName: 'e', dimension: 4, size: [3, 2, 3, 5], Public: 1 },

];

const input_sample = {
  a: 'string',
  b: 'Array<string>',
  c: 'Array<Array<string>>',
  d: 'Array<Array<Array<string>>>',
  e: 'Array<Array<Array<Array<string>>>>'
};


// GPT4 generics code
type Dimension = 0 | 1 | 2 | 3 | 4 | 5;

type NestedArray<T, D extends Dimension> = D extends 0
  ? T
  : D extends 1
  ? Array<T>
  : D extends 2
  ? Array<Array<T>>
  : D extends 3
  ? Array<Array<Array<T>>>
  : D extends 4
  ? Array<Array<Array<Array<T>>>>
  : Array<Array<Array<Array<Array<T>>>>>;

type DimensionMap = {
  0: 0;
  1: 1;
  2: 2;
  3: 3;
  4: 4;
  5: 5;
};

function process<T, D extends Dimension>(input: NestedArray<T, D>): NestedArray<T, D> {
  return input;
}

interface InputData {
  inputName: string;
  dimension: number;
  size: number[];
  public?: number;
}
const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];
 
type Person = typeof MyArray[number];

const prover_inputs = [
  { inputName: 'input0', dimension: 0, size: [] },
  { inputName: 'input1', dimension: 1, size: [5] },
  { inputName: 'input2', dimension: 2, size: [5, 5] },
  { inputName: 'input3', dimension: 3, size: [5, 5, 5] },
  { inputName: 'input4', dimension: 4, size: [5, 5, 5, 5] },
  { inputName: 'input5', dimension: 5, size: [5, 5, 5, 5, 5] },
];

const a = prover_inputs[2].dimension;

type NumberToDimension<N extends number> = N extends keyof DimensionMap ? DimensionMap[N] : never;

const result = process<number, NumberToDimension<typeof a> & Dimension>([[42]] as NestedArray<number, NumberToDimension<typeof a> & Dimension>);
console.log(typeof result)

///////////////

let inputs_sample = [
  { inputName: 'hash', dimension: 0, size: [ 0 ], Public: 1 },
  { inputName: 'nonce', dimension: 0, size: [ 0 ], Public: 1 },
  { inputName: 'encrypted_shot', dimension: 1, size: [ 3 ], Public: 1 },
  { inputName: 'ships', dimension: 2, size: [ 4, 2 ], Public: 0 },
  { inputName: 'key', dimension: 1, size: [ 1 ], Public: 0 },
  { inputName: 'hit', dimension: 0, size: [ 0 ], Public: 0 }
]
let ssample = [
  { inputName: 'hash', type: { dimension: 0, size: [ 0 ] }, Public: 1 },
  { inputName: 'nonce', type: { dimension: 0, size: [ 0 ] }, Public: 1 },
]
type circomIDL = typeof ssample[number];
type circuitInput = typeof inputs_sample[number];

export type IdlCircuit = {
  name: string;
  type: inputType;
  size?: number[];
  public?: boolean;
};

export type inputType = "string" | "array";

type mapish = {[k: string]: boolean};
type M = keyof mapish;
let tt: M
let fb: string[][];
let tp: typeof inputs_sample;

function f() {
  return { x: 10, y: 3 };
}

type P = ReturnType<typeof f>;

type ParseTypeString<T extends string> =
  T extends 'string' ? string
  : T extends 'string[]' ? string[]
  : T extends 'string[][]' ? string[][]
  : T extends 'string[][][]' ? string[][][]
  : T extends 'string[][][][]' ? string[][][][]
  : T extends 'string[][][][][]' ? string[][][][][]
  : never;

let ss = 'string[][][]';

type TestType = ParseTypeString<'string[][]'>; // The type will be string[][][]

let pp: TestType = [['s']]

function parseType<T extends string>(input: T): ParseTypeString<T> {
  throw "unimplemented";
}

let abc = parseType(inputs_sample[3].dimension === 2 ? 'string[][]': undefined);

const string_object = {
  a: 'string',
  b: 'string[]',
  c: 'string[][]',
  d: 'string[][][]',
  e: 'string[][][][]'
};


const proof = {
  pi_a: [
    '21526111195252256294907576963009410152346119980938730529936899251435017845368',
    '18439742383111692307371150889774453297827550939712274985550146413453876282029',
    '1'
  ],
  pi_b: [
    [
      '4056828859092658966165081811473140250979871661761664025323129304063426794897',
      '21710827246673677506834440387872671178808598036349536668965077819998271231238'
    ],
    [
      '146078824235981017454177503667099974923432959985845758222681160184512486447',
      '15609636510565551377448974148054534534216765486796328206213701320681135352794'
    ],
    [ '1', '0' ]
  ],
  pi_c: [
    '6557796398336996177072398571922760824323278192873236022003521061428656308020',
    '3312610127253935140906387451775096520486765355720307302677276346735300583247',
    '1'
  ],
  protocol: 'groth16',
  curve: 'bn128'
}