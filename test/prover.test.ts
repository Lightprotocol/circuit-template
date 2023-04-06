import { Prover } from '../src/prover';
import { expect } from 'chai';

// import chaiAsPromised from 'chai-as-promised';
// import chai from 'chai';
// chai.use(chaiAsPromised);

describe('ZK-Battleships Shot Prover Tests', async() => {

  let sample_prover;
  before(async() => {

  sample_prover = new Prover(
    './test-cases/zk-Battleship/shot_final.zkey',
    './test-cases/zk-Battleship/shot.r1cs',
    './test-cases/zk-Battleship/shot.sym'
  );

  await sample_prover.genR1csJson();
  })    

  it('Inputs Parser Test', async() => {

    // console.log(sample_prover.r1csJson);
    await sample_prover.prepareInputs();
    console.log(sample_prover.inputs);

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

  })

  it('Groth16 Prover Test', async() => {
    // the order doesn't make difference since circuit inputs are taken as object
    await sample_prover.fullProve(
      './test-cases/zk-Battleship/shot.wasm',
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
    // console.log('proof', sample_prover.proof);
     
  })

  it('Groth16 Verifier Test', async() => {
    const result = await sample_prover.verify();
    expect(result).to.equals(true);  
  })

})

describe('Light Protocol Mock Verifier Test', async() => {
  
  let mock_prover;
  before(async() => {
    mock_prover = new Prover(
      './test-cases/light-protocol/build/appTransaction.zkey',
      './test-cases/light-protocol/build/appTransaction.r1cs',
      './test-cases/light-protocol/build/appTransaction.sym'
    );

    await mock_prover.genR1csJson();    
  })

  it('Inputs Parser Test', async() => {


    //console.log('mock verifier r1cs: ', mock_prover.r1csJson);
    await mock_prover.prepareInputs();
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
  
  })

})

/**
 * sample_prover.genR1csJson().then(update => {
	//console.log(sample_prover.symText);
	//console.log(sample_prover.r1csJson);
});

sample_prover.prepareInputs().then(update => {
	console.log(sample_prover.inputs);
});	

// sample_prover.fullProve('./build/Circuit_js/Circuit.wasm').then(update => {
// 	console.log(sample_prover.publicInputs);
// 	//console.log(sample_prover.proof);

// 	sample_prover.verify().then(res => {
// 		console.log('Verification Ok!', res);
// 	})
// })
    })
 */