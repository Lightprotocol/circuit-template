import { findSourceMap } from "module";

const fs = require('fs');
const snarkjs = require('snarkjs');

interface InputData {
  inputName: string;
  dimension: number;
  size: number[];
  sumSize?: number;
  public?: number;
}

function uniqueMaxSize(arr: Array<InputData> ): Array<InputData> {

  const uniqueArr = arr.reduce((acc, cur) => {
    const { inputName, dimension, size } = cur;
    const Public = cur.public;
    const sumSize = size.reduce((a, b) => a + b, 0);

    const idx = acc.findIndex(
      obj =>
        obj.inputName === inputName && 
        obj.sumSize < sumSize
    );
    
    if (idx === -1) {
      acc.push({ inputName, dimension, size, sumSize, Public });
    } else {
      acc[idx] = { inputName, dimension, size, sumSize, Public };
    }

    return acc;
  }, []);

  const filteredArr = uniqueArr.reduce((acc, cur) => {

    const idx = acc.findIndex(obj => obj.inputName === cur.inputName);
    if (idx === -1) {
      delete cur.sumSize;
      acc.push(cur);
    }
    return acc;
  }, []);

  return filteredArr
}

function unique(arr: Array<InputData>): Array<InputData> {

  const uniqueArr = arr.reduce((acc, cur) => {
    const idx = acc.findIndex(obj => obj.inputName === cur.inputName);
    if (idx === -1) {
      acc.push(cur);
    }
    return acc;
  }, []);

  return uniqueArr
}

async function prepareInputs() {

  // Read .sym file and filter signal names
  const regex = /main\.(.+)/g;
  let sym = fs.readFileSync('./build/Circuit.sym', 'utf-8');
  let shot = fs.readFileSync('./shot.sym', 'utf-8');
  let app = fs.readFileSync('./appTransaction.sym', 'utf-8');
  //console.log('sym: ', sym);

  let match;
  let keys = [];
  while ((match = regex.exec(sym)) !== null) {
    keys.push(match[1]);
    const name = match[1];
    //console.log(name);
  }
  //console.log('keys', keys);
  let arr = [];
  
  keys.map(name => {
    const dimension = (name.match(/\[/g) || []).length;
    const inputName = dimension === 0 ? name : name.slice(0, name.indexOf('['));
    //const size = [].push(parseInt(name[name.indexOf('[')+1]));
    const size = dimension === 0 ? [0] : (name.match(/\[(.*?)\]/g) || []).map(m => m.replace(/\[|\]/g, '')).map(n => parseInt(n));
  
    arr.push({ inputName, dimension, size });
  })
  
  //let marr = uniqueMaxSum(arr);
  //console.log('uniqueMaxSum', marr);
  //unique(marr);
  // Retrieve the number of outputs as well as the number of private and public inputs from the R1CS file
  const r1cs = await snarkjs.r1cs.exportJson('./build/Circuit.r1cs');
  //console.log(r1cs);
  
  const nOut = r1cs.nOutputs;
  const nPub = r1cs.nPubInputs;
  const nPrv = r1cs.nPrvInputs;
  let total = nOut + nPub + nPrv;
  // console.log('total inputs: ', total);
  // console.log('original arr: ', arr.slice(0, total));
  let uarr = unique(arr.slice(0, total));
  // console.log('uarr', uarr, uarr.length);

  for (let i=0; i<total; i++) {
    if(i < nOut+nPub) arr[i].public = 1;
    else arr[i].public = 0;
  }
  // console.log('arr', arr.slice(0, total));
  let marr = uniqueMaxSize(arr.slice(0, total));
  // console.log('prepared', marr.slice(0, uarr.length));
  

  return marr.slice(0, uarr.length);

}

prepareInputs().then(result => {
  let prepared = result; 
  console.log(prepared);
});

export {
  prepareInputs
}

/**
 *  signal input extDataHash;
    signal input  inAmount[nIns][nInAssets];
    signal input  inPublicKey[nIns];
    signal input  inBlinding[nIns];
    signal input  inInstructionType[nIns];
    signal  input inPoolType[nIns];
    signal  input inVerifierPubkey[nIns];
    signal  input inIndices[nIns][nInAssets][nAssets];

    // data for transaction outputsAccount
    signal  input outputCommitment[nOuts];
    signal  input outAmount[nOuts][nOutAssets];
    signal  input outPubkey[nOuts];
    signal  input outBlinding[nOuts];
    signal  input outInstructionType[nOuts];
    signal  input outIndices[nOuts][nOutAssets][nAssets];
    signal  input outPoolType[nOuts];
    signal  input outVerifierPubkey[nOuts];

    signal  input assetPubkeys[nAssets];

    component main {public [connectingHash, verifier]} = TransactionMarketPlace(18, 4, 4, 24603683191960664281975569809895794547840992286820815015841170051925534051, 0, 1, 3, 2, 2, 1);

 */