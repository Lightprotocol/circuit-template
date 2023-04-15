const fs = require('fs');

function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function buildRustType(dimension, size) {
  if (dimension === 0) {
    return "u8";
  }

  let rustType = buildRustType(dimension - 1, size.slice(1));
  return `[${rustType};${size[0]}]`;
}

function parseAndGenerateRustCode(inputs, title: string) {
  let structDefinition = `#[account]\npub struct ZK${title}Inputs {\n`;

  inputs.forEach((input) => {
    const { inputName, dimension, size } = input;
    const rustType = buildRustType(dimension, size);
    const inputName_snake = camelToSnakeCase(inputName);
    structDefinition += `    ${inputName_snake}: ${rustType},\n`;
  });

  structDefinition += "}";

  return structDefinition;
}

const inputs = [
  { inputName: "hash", dimension: 0, size: [0], Public: 1 },
  { inputName: "nonce", dimension: 0, size: [0], Public: 1 },
  { inputName: "encrypted_shot", dimension: 1, size: [4], Public: 1 },
  { inputName: "ships", dimension: 2, size: [5, 3], Public: 0 },
  { inputName: "key", dimension: 1, size: [2], Public: 0 },
  { inputName: "hit", dimension: 0, size: [0], Public: 0 },
];
const rustCode = parseAndGenerateRustCode(inputs, 'shot');
console.log(rustCode);

const circuit_inputs =  [
  { inputName: 'out1', dimension: 1, size: [ 2 ], Public: 1 },
  { inputName: 'out2', dimension: 1, size: [ 3 ], Public: 1 },
  { inputName: 'c', dimension: 0, size: [ 0 ], Public: 1 },
  { inputName: 'd', dimension: 0, size: [ 0 ], Public: 1 },
  { inputName: 'f', dimension: 0, size: [ 0 ], Public: 1 },
  { inputName: 'a', dimension: 0, size: [ 0 ], Public: 0 },
  { inputName: 'b', dimension: 0, size: [ 0 ], Public: 0 },
  { inputName: 'enforce', dimension: 0, size: [ 0 ], Public: 0 }
]

console.log('circuit rust code: ', parseAndGenerateRustCode(circuit_inputs, 'example'))

const mock_inputs = [
  { inputName: 'verifier', dimension: 0, size: [ 0 ], Public: 1 },
  { inputName: 'connectingHash', dimension: 0, size: [ 0 ], Public: 1 },
  { inputName: 'extDataHash', dimension: 0, size: [ 0 ], Public: 0 },
  { inputName: 'inAmount', dimension: 2, size: [ 4, 2 ], Public: 0 },
  { inputName: 'inPublicKey', dimension: 1, size: [ 4 ], Public: 0 },
  { inputName: 'inBlinding', dimension: 1, size: [ 4 ], Public: 0 },
  {
    inputName: 'inInstructionType',
    dimension: 1,
    size: [ 4 ],
    Public: 0
  },
  { inputName: 'inPoolType', dimension: 1, size: [ 4 ], Public: 0 },
  {
    inputName: 'inVerifierPubkey',
    dimension: 1,
    size: [ 4 ],
    Public: 0
  },
  {
    inputName: 'inIndices',
    dimension: 3,
    size: [ 4, 2, 3 ],
    Public: 0
  },
  {
    inputName: 'outputCommitment',
    dimension: 1,
    size: [ 4 ],
    Public: 0
  },
  { inputName: 'outAmount', dimension: 2, size: [ 4, 2 ], Public: 0 },
  { inputName: 'outPubkey', dimension: 1, size: [ 4 ], Public: 0 },
  { inputName: 'outBlinding', dimension: 1, size: [ 4 ], Public: 0 },
  {
    inputName: 'outInstructionType',
    dimension: 1,
    size: [ 4 ],
    Public: 0
  },
  {
    inputName: 'outIndices',
    dimension: 3,
    size: [ 4, 2, 3 ],
    Public: 0
  },
  { inputName: 'outPoolType', dimension: 1, size: [ 4 ], Public: 0 },
  {
    inputName: 'outVerifierPubkey',
    dimension: 1,
    size: [ 4 ],
    Public: 0
  },
  { inputName: 'assetPubkeys', dimension: 1, size: [ 3 ], Public: 0 }
]

console.log('mock_verifier rust code: \n\n', parseAndGenerateRustCode(mock_inputs, 'appTransaction'));



// ... previous code, including the inputs array and parseAndGenerateRustCode function ...

const circuitAccount = parseAndGenerateRustCode(inputs, 'shot');
const libPath = "./src/trials/lib.rs";

fs.appendFile(libPath, `\n${circuitAccount}\n`, (err) => {
  if (err) {
    console.error("Failed to append the Rust code to lib.rs:", err);
  } else {
    console.log("Rust code successfully appended to lib.rs.");
  }
});
