type FieldType = {
  name: string;
  type: any;
};

type IdlElement = {
  name: string;
  type: {
    kind: string;
    fields: FieldType[];
  };
};

type IdlObject = IdlElement[];

type SizeObject = {
  [key: string]: number[];
};

function getSize(type: any): number[] {
  const sizeArray = [];
  if (typeof type === 'string') {
    sizeArray.push(0);
  } else if (Array.isArray(type)) {
    if (typeof type[0] === 'string') {
      sizeArray.push(type[1]);
    } else {
      sizeArray.push(...getSize(type[0]), type[1]);
    }
  } else {
    return getSize(type.array);
  }

  return sizeArray
}

function getObjectSizes(idlObject: IdlObject): SizeObject {
  let output: SizeObject = {};

  for (const field of idlObject[0].type.fields) {
    output[field.name] = getSize(field.type);
  }

  return output;
}

const idlObject: IdlObject = [
  {
    name: "ZKshotProofInputs",
    type: {
      kind: "struct",
      fields: [
        {
          name: "hash",
          type: "u8",
        },
        {
          name: "nonce",
          type: "u8",
        },
        {
          name: "encryptedShot",
          type: {
            array: ["u8", 4],
          },
        },
        {
          name: "ships",
          type: {
            array: [
              {
                array: ["u8", 3],
              },
              5,
            ],
          },
        },
        {
          name: "key",
          type: {
            array: ["u8", 2],
          },
        },
        {
          name: "hit",
          type: {
            array: [
              {
                array: [
                  {
                    array: [
                      {
                        array: ["u8", 3],
                      },
                      2,
                    ],
                  },
                  4,
                ],
              },
              2,
            ],
          },
        },
      ],
    },
  },
];


type NestedNumberArray = number[] | NestedNumberArray[];

type OutputObject = {
  [key: string]: NestedNumberArray;
};

/* function spreadArrayToObject(input: number[], sizes: SizeObject): OutputObject {
  let currentIndex = 0;

  const output: OutputObject = {};

  for (const key in sizes) {
    if (!sizes.hasOwnProperty(key)) {
      continue;
    }

    const shape = sizes[key];
    if (shape.length === 1 && shape[0] === 0) {
      output[key] = input[currentIndex];
      currentIndex += 1;
    } else {
      const totalElements = shape.reduce((accumulator, size) => accumulator * size, 1);
      const slicedArray = input.slice(currentIndex, currentIndex + totalElements);
      let reshapedArray: any = slicedArray;

      if (shape.length > 1) {
        let currentData = reshapedArray;
        for (let i = 0; i < shape.length - 1; i++) {
          currentData = currentData.reduce((accumulator: any[], _, index) => {
            if (index % shape[i] === 0) {
              accumulator.push(currentData.slice(index, index + shape[i]));
            }
            return accumulator;
          }, []);
        }
        reshapedArray = currentData;
      }

      output[key] = reshapedArray;
      currentIndex += totalElements;
    }
  }

  if (currentIndex !== input.length) {
    throw new Error(`Input array length mismatch: ${currentIndex} != ${input.length}`);
  }

  return output;
}  */


function spreadArrayToObject(input: number[][], sizes: SizeObject): OutputObject {
  let currentIndex = 0;

  const output: OutputObject = {};

  for (const key in sizes) {
    if (!sizes.hasOwnProperty(key)) {
      continue;
    }

    const shape = sizes[key];
    if (shape.length === 1 && shape[0] === 0) {
      output[key] = input[currentIndex];
      currentIndex += 1;
    } else {
      const totalElements = shape.reduce((accumulator, size) => accumulator * size, 1);
      const slicedArray = input.slice(currentIndex, currentIndex + totalElements);
      let reshapedArray: any = slicedArray;

      if (shape.length > 1) {
        let currentData = reshapedArray;
        for (let i = 0; i < shape.length - 1; i++) {
          currentData = currentData.reduce((accumulator: any[], _, index) => {
            if (index % shape[i] === 0) {
              accumulator.push(currentData.slice(index, index + shape[i]));
            }
            return accumulator;
          }, []);
        }
        reshapedArray = currentData;
      }

      output[key] = reshapedArray;
      currentIndex += totalElements;
    }
  }

  if (currentIndex !== input.length) {
    throw new Error(`Input array length mismatch: ${currentIndex} != ${input.length}`);
  }

  return output;
}


console.log(getObjectSizes(idlObject));
console.log(getObjectSizes(idlObject).hit);

//const inputArray = Array.from({ length: 71 }, (_, i) => i + 1);
const inputArray: number[][] = Array.from({ length: 71 }, (_, i) => Array.from({ length: 1 }, () => i + 1));


const sizes: SizeObject = {
  hash: [0],
  nonce: [0],
  encryptedShot: [4],
  ships: [5, 3],
  key: [2],
  hit: [2, 4, 3, 2],
};

const idl_size = getObjectSizes(idlObject);
const outputObject = spreadArrayToObject(inputArray, idl_size);
console.log(outputObject);
console.log(outputObject.hit[0]);

//console.log(JSON.stringify(outputObject, null, 2));

