import { Prover, circuitFilePaths } from '../src/trials/prover_old';
import { expect } from 'chai';
const fs = require('fs');

describe('Circuit-Example Prover Tests', async() => {
  let prover;
  before(async() => {

    const circuitFilePaths: circuitFilePaths = 
    {
      zkey: './test-cases/circuit_example/build/circuit.zkey',
      r1cs: './test-cases/circuit_example/build/Circuit.r1cs',
      sym: './test-cases/circuit_example/build/Circuit.sym',
      wasm: './test-cases/circuit_example/build/Circuit_js/Circuit.wasm',
    }
    prover = new Prover(circuitFilePaths);
  })

  it('Inputs Parser Test', async() => {
    await prover.prepareInputs();
    console.log('nOut: ', prover.nOut);
    console.log('nPub: ', prover.nPub);
    console.log('nPrv: ', prover.nPrv);

    const idl = JSON.parse(fs.readFileSync('./zk-battleship/target/idl/zk_battleship.json'));
    console.log(idl)
    
  })
})
describe('ZK-Battleships Shot Prover Tests', async() => {

  let sample_prover;
  before(async() => {

  const shot_circuitFilePaths: circuitFilePaths = 
  {
    zkey: './test-cases/zk-Battleship/shot_final.zkey',
    r1cs: './test-cases/zk-Battleship/shot.r1cs',
    sym: './test-cases/zk-Battleship/shot.sym',
    wasm: './test-cases/zk-Battleship/shot.wasm'
  }
  sample_prover = new Prover(shot_circuitFilePaths);

  await sample_prover.getR1csJson();
  })    

  it('Inputs Parser Test', async() => {

    //console.log('r1csJson', sample_prover.r1csJson);
    await sample_prover.prepareInputs();

    // expect correct input names
    expect(sample_prover.inputs[0].inputName).to.equals('hash');
    expect(sample_prover.inputs[1].inputName).to.equals('nonce');
    expect(sample_prover.inputs[2].inputName).to.equals('encrypted_shot');
    expect(sample_prover.inputs[3].inputName).to.equals('ships');
    expect(sample_prover.inputs[4].inputName).to.equals('key');
    expect(sample_prover.inputs[5].inputName).to.equals('hit');
    // expect correct public inputs
    expect(sample_prover.inputs[0].Public).to.equals(1);
    expect(sample_prover.inputs[1].Public).to.equals(1);
    expect(sample_prover.inputs[2].Public).to.equals(1);
    // expect correct private inputs
    expect(sample_prover.inputs[3].Public).to.equals(0);
    expect(sample_prover.inputs[4].Public).to.equals(0);
    expect(sample_prover.inputs[5].Public).to.equals(0);
    // expect inputs length to be compliant
    expect(sample_prover.inputs.length).to.be.equals(6);
    // expect dimension and size of an input to be compliant
    const ships = sample_prover.inputs[3];
    expect(ships.dimension).to.equals(ships.size.length);

    // sample_prover.parseAndAppendRustStruct(
    //   sample_prover.inputs,
    //   'BattleshipShot',
    //   './zk-battleship/programs/zk-battleship/src/lib.rs'
    // );

  })

  it('Groth16 Prover Test', async() => {
    // the order doesn't make difference since circuit inputs are taken as object
    await sample_prover.fullProve(
      {
        ships: [
          [ '1', '0', '0' ],
          [ '1', '1', '0' ],
          [ '1', '2', '0' ],
          [ '1', '3', '0' ],
          [ '1', '4', '0' ]
        ],
        hash: '7171555781321129731590343863966959210743929912730030629554698118236204286162',
        encrypted_shot: [
          '13444658903629867527392084833316018698942918335868794129987452428589496377518',
          '17915305370736659653917138872651614773722423379801238519076566198870230276051',
          '13630137655148614842816669651393958336595217026427779948770185734153739514852',
          '1876325965396019197137789368302240586036052257420262563276125478462536683927'
        ],
        nonce: '12315616',
        key: [
          '3795449174703890877525719218610067547868909955981030708747970621694911155720',
          '10399447853415595469589103517420800934362450582406364308589620849454103120098'
        ],
        hit: '0'
      }
    );     
    //console.log('proof', sample_prover.proof);
    //console.log('publicInputs', sample_prover.publicInputs)
     
  })

  it('Groth16 Verifier Test', async() => {
    const result = await sample_prover.verify();
    expect(result).to.equals(true); 
    //console.log('vKey: ', sample_prover.vKey);
     
  })

})

describe('Light Protocol Mock Verifier Test', async() => {
  
  let mock_prover;
  before(async() => {

    const mock_circuitFilePaths: circuitFilePaths = 
    {
      zkey: './test-cases/light-protocol/build/appTransaction.zkey',
      r1cs: './test-cases/light-protocol/build/appTransaction.r1cs',
      sym: './test-cases/light-protocol/build/appTransaction.sym',
      wasm: './test-cases/light-protocol/build/appTransaction_js/appTransaction.wasm'
    }

    mock_prover = new Prover(mock_circuitFilePaths);

    await mock_prover.getR1csJson();    
  })

  it('Inputs Parser Test', async() => {


    //console.log('mock verifier r1cs: ', mock_prover.r1csJson);
    await mock_prover.prepareInputs();
    console.log('nOut: ', mock_prover.nOut);
    console.log('nPub: ', mock_prover.nPub);
    console.log('nPrv: ', mock_prover.nPrv);
    const mock_inputs = mock_prover.inputs;

    // expect correct number of inputs
    expect(mock_prover.inputsNum).to.equals(19);
    // expect correct public inputs
    expect(mock_inputs[0].inputName).to.equals('verifier');
    expect(mock_inputs[0].Public).to.equals(1);
    expect(mock_inputs[1].inputName).to.equals('connectingHash');
    expect(mock_inputs[1].Public).to.equals(1);

    // expect correct private inputs
    let mock_prv_inputs = [
      'extDataHash',        'inAmount',
      'inPublicKey',        'inBlinding',
      'inInstructionType',  'inPoolType',
      'inVerifierPubkey',   'inIndices',
      'outputCommitment',   'outAmount',
      'outPubkey',          'outBlinding',
      'outInstructionType', 'outIndices',
      'outPoolType',        'outVerifierPubkey',
      'assetPubkeys'
    ];

    for (let i=0; i<mock_prv_inputs.length; i++) {
      expect(mock_inputs.slice(2)[i].inputName).to.equals(mock_prv_inputs[i]);
      expect(mock_inputs.slice(2)[i].Public).to.equals(0);
    }

    // expect dimension and size of sample inputs to be compliant
    expect(mock_inputs[2].dimension).to.equals(0);  // extDataHash
    expect(mock_inputs[6].dimension).to.equals(1);  // inInstructionType[]
    expect(mock_inputs[11].dimension).to.equals(2); // outAmount[][]
    expect(mock_inputs[9].dimension).to.equals(3).to.equals(mock_inputs[9].size.length); // inIndices[][][]
    
    // mock_prover.parseAndAppendRustStruct(
    //   mock_prover.inputs,
    //   'mockVerifier',
    //   './zk-battleship/programs/zk-battleship/src/lib.rs'
    // );
  })

  // input sample is needed for Groth16 prover and verifier tests
})
