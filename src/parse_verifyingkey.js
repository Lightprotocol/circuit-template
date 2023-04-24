var ffjavascript = require("ffjavascript");
const { unstringifyBigInts, leInt2Buff } = ffjavascript.utils;
const snarkjs = require('snarkjs')
var fs = require("fs");
const { argv } = require("process");

 /**
   * 1- Regex matching to filter main signals taken from .sym file
   * 2- Extract properties: array dimension, size, Public, Private
   * 3- Read .r1cs file and save the #total of Prv, Pbl inputs as well as outputs
   * 4- Filter inputs with unique name and max size according to circom signals format
   */
async function prepareInputs() {

  // filter inputData array based on the maximum size of nested arrays([0] otherwise)
  function uniqueMaxSize(arr) {

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
  
  // Prepare an array of outputs and inputs Input Data objects
  // filter signal names from the sym file
  const regex = /main\.(.+)/g;
  
  let match;
  let keys = [];
  const symText = fs.readFileSync(`./circuits/artifacts/setup/${argv[4]}.sym`, 'utf-8');
  while ((match = regex.exec(symText)) !== null) {
    keys.push(match[1]);
    const name = match[1];
  }

  let arr = [];
  
  keys.map(name => {
    const dimension = (name.match(/\[/g) || []).length;
    const inputName = dimension === 0 ? name : name.slice(0, name.indexOf('['));
    const size = dimension === 0 ? [0] : (name.match(/\[(.*?)\]/g) || []).map(m => m.replace(/\[|\]/g, '')).map(n => parseInt(n) + 1);
  
    arr.push({ inputName, dimension, size });
  })
  
  // Retrieve the number of outputs as well as the number of private and public inputs from the R1CS file
  const r1cs = await snarkjs.r1cs.exportJson(`./circuits/artifacts/setup/${argv[4]}.r1cs`); 

  const nOut = r1cs.nOutputs;
  const nPub = r1cs.nPubInputs;
  const nPrv = r1cs.nPrvInputs;
  const total = nOut + nPub + nPrv;
  
  // Save the main circuit signals .i.e inputs -> nOut, nPub, and nPrv separately 
  /* const signalsArray = keys.map(name => 
    name.indexOf('[') == -1 
    ? name 
    : name.slice(0, name.indexOf('[')))
    .slice(0, total);

  this.nOut = [...new Set(signalsArray.slice(0, nOut))]; 
  this.nPub = [... new Set(signalsArray.slice(nOut, nOut + nPub))];
  this.nPrv = [... new Set(signalsArray.slice(nOut + nPub))]; */

  // Retrieve the main inputs and outputs and select unique input names
  const inputs_arr = arr.slice(0, total); 
  
  for (let i=0; i<total; i++) {
    if(i < nOut+nPub) arr[i].public = 1;
    else arr[i].public = 0;
  }
  const marr = uniqueMaxSize(inputs_arr);
  
  const inputsNum = marr.length;
  const inputs = marr.slice(0, inputsNum);
  //console.log('inputs: ', this.inputs)
  return inputs
}

function parseAndAppendRustStruct(inputs, title, outPath) {

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
  
  //  start of the main method
  /// parse the inputs output into a rust struct as a program account
  let structDefinition = `\n#[account]\npub struct ZK${title}Inputs {\n`;
  
  inputs.forEach((input) => {
    const { inputName, dimension, size } = input;
    const rustType = buildRustType(dimension, size);
    const inputName_snake = camelToSnakeCase(inputName);
    structDefinition += `    ${inputName_snake}: ${rustType},\n`;
  });
  
  structDefinition += "}";
  
  /// append the rust code to the lib.rs i.e. solana program file
  fs.appendFile(outPath, `\n${structDefinition}`, (err) => {
    if (err) {
      console.error("Failed to append the Rust code to VerifyingKey file!:", err);
    } else {
      console.log("Rust code successfully appended to VerifyingKey file!.");
    }
  });
  
}

async function main() {
  let nrInputs = argv[2];
  if (!nrInputs) {
    throw new Error("circuit nrInputs not specified");
  }

  let program = "";
  if (nrInputs == "2") {
    program = "verifier_program_zero";
  } else if (nrInputs == "10") {
    program = "verifier_program_one";
  } else if (nrInputs == "4") {
    program = "verifier_program_two";
  } else if (nrInputs == "app") {
    program = `${argv[3]}`;
  } else {
    throw new Error("invalid nr of inputs");
  }

  console.log = () => {};

  let file = await fs.readFile(`./circuits/artifacts/${argv[4]}_verification_key.json`, async function (err, fd) {
    if (err) {
      return console.error(err);
    }
    console.log("File opened successfully!");
    var mydata = JSON.parse(fd.toString());
    console.log(mydata);

    for (var i in mydata) {
      if (i == "vk_alpha_1") {
        for (var j in mydata[i]) {
          mydata[i][j] = leInt2Buff(
            unstringifyBigInts(mydata[i][j]),
            32
          ).reverse();
        }
      } else if (i == "vk_beta_2") {
        for (var j in mydata[i]) {
          console.log("mydata[i][j] ", mydata[i][j]);

          let tmp = Array.from(
            leInt2Buff(unstringifyBigInts(mydata[i][j][0]), 32)
          )
            .concat(
              Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][1]), 32))
            )
            .reverse();
          console.log("tmp ", tmp);
          mydata[i][j][0] = tmp.slice(0, 32);
          mydata[i][j][1] = tmp.slice(32, 64);
          console.log("mydata[i][j] ", mydata[i][j]);   
        }
      } else if (i == "vk_gamma_2") {
        for (var j in mydata[i]) {
          let tmp = Array.from(
            leInt2Buff(unstringifyBigInts(mydata[i][j][0]), 32)
          )
            .concat(
              Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][1]), 32))
            )
            .reverse();
          console.log(`i ${i}, tmp ${tmp}`);
          mydata[i][j][0] = tmp.slice(0, 32);
          mydata[i][j][1] = tmp.slice(32, 64);
        }
      } else if (i == "vk_delta_2") {
        for (var j in mydata[i]) {
          let tmp = Array.from(
            leInt2Buff(unstringifyBigInts(mydata[i][j][0]), 32)
          )
            .concat(
              Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][1]), 32))
            )
            .reverse();
          mydata[i][j][0] = tmp.slice(0, 32);
          mydata[i][j][1] = tmp.slice(32, 64);

        }
      } else if (i == "vk_alphabeta_12") {
        for (var j in mydata[i]) {
          for (var z in mydata[i][j]) {
            for (var u in mydata[i][j][z]) {
              mydata[i][j][z][u] = leInt2Buff(
                unstringifyBigInts(mydata[i][j][z][u])
              );
            }
          }
        }
      } else if (i == "IC") {
        for (var j in mydata[i]) {
          for (var z in mydata[i][j]) {
            console.log(unstringifyBigInts(mydata[i][j][z]));
            console.log(
              unstringifyBigInts(mydata[i][j][z]) ==
                unstringifyBigInts(
                  "0x279A3A31DB55A7D9E82122ADFD708F5FF0DD33706A0404DD0E6EA06D9B83452E"
                )
            );
            console.log(
              unstringifyBigInts(mydata[i][j][z]) ==
                unstringifyBigInts(
                  "0x2875717270029F096FEC64D14A540AAD5475725428F790D6D848B32E98A81FBE"
                )
            );

            if (z == 1) {
            }
            mydata[i][j][z] = leInt2Buff(
              unstringifyBigInts(mydata[i][j][z]),
              32
            ).reverse();
          }
        }
      }
    }

    let path = "./programs/" + argv[3] + `/src/${argv[4]}_verifying_key.rs`;
    console.log(path);
    let resFile = await fs.openSync(path, "w");

    let s = `use groth16_solana::groth16::Groth16Verifyingkey;\nuse anchor_lang::prelude::*;\n\npub const VERIFYINGKEY${argv[4].toUpperCase()}: Groth16Verifyingkey =  Groth16Verifyingkey {\n\tnr_pubinputs: ${mydata.IC.length},\n`;
    s += "\tvk_alpha_g1: [\n";
    for (var j = 0; j < mydata.vk_alpha_1.length - 1; j++) {
      console.log(typeof mydata.vk_alpha_1[j]);
      s +=
        "\t\t" +
        Array.from(mydata.vk_alpha_1[j]) /*.reverse().toString()*/ +
        ",\n";
    }
    s += "\t],\n\n";

    fs.writeSync(resFile, s);
    s = "\tvk_beta_g2: [\n";
    for (var j = 0; j < mydata.vk_beta_2.length - 1; j++) {
      for (var z = 0; z < 2; z++) {
        s +=
          "\t\t" +
          Array.from(mydata.vk_beta_2[j][z]) /*.reverse().toString()*/ +
          ",\n";
      }
    }
    s += "\t],\n\n";
    fs.writeSync(resFile, s);

    s = "\tvk_gamme_g2: [\n";
    for (var j = 0; j < mydata.vk_gamma_2.length - 1; j++) {
      for (var z = 0; z < 2; z++) {
        s +=
          "\t\t" +
          Array.from(mydata.vk_gamma_2[j][z]) /*.reverse().toString()*/ +
          ",\n";
      }
    }
    s += "\t],\n\n";
    fs.writeSync(resFile, s);

    s = "\tvk_delta_g2: [\n";
    for (var j = 0; j < mydata.vk_delta_2.length - 1; j++) {
      for (var z = 0; z < 2; z++) {
        s +=
          "\t\t" +
          Array.from(mydata.vk_delta_2[j][z]) /*.reverse().toString()*/ +
          ",\n";
      }
    }
    s += "\t],\n\n";
    fs.writeSync(resFile, s);
    s = "\tvk_ic: &[\n";
    let x = 0;
    console.log("mydata.IC, ", mydata.IC);
    for (var ic in mydata.IC) {
      s += "\t\t[\n";
      // console.log(mydata.IC[ic])
      for (var j = 0; j < mydata.IC[ic].length - 1; j++) {
        s += "\t\t\t" + mydata.IC[ic][j] /*.reverse().toString()*/ + ",\n";
      }
      x++;
      s += "\t\t],\n";
    }
    s += "\t]\n};";

    console.log("Public inputs", x);
    fs.writeSync(resFile, s);

    // Parse Circuit inputs and Append it to Verifying Key File

    const ProofInputs = await prepareInputs();
    const PublicInputs = ProofInputs.filter(ProofInputs => ProofInputs.Public === 1);
    parseAndAppendRustStruct(
      ProofInputs,
      argv[4] + 'Proof',
      path
    )
    parseAndAppendRustStruct(
      PublicInputs,
      argv[4] + 'Public',
      path
    )
    
  });

}

main();