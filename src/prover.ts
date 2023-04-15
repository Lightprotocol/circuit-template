const snarkjs = require('snarkjs');
const { unstringifyBigInts, leInt2Buff, leBuff2int } = require('ffjavascript').utils;
import { ZkBattleship } from '../zk-battleship/target/types/zk_battleship';

const ff = require('ffjavascript');
const fs = require('fs');

interface InputData {
	inputName: string;
	dimension: number;
	size: number[];
	sumSize?: number;
	public?: number;
}

export type circuitFilePaths = {
	zkey: string;
	r1cs: string;
	sym: string;
	wasm: string;
}

export type proofData = {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
}

export class Prover {

	public filePaths: circuitFilePaths;

	public r1csJson;
	public symText: string;
	public vKey;

	public inputs: Array<InputData>;
	public inputsNum: number;
    public proofInputs;
    public publicInputs: string[];
    public proof: proofData;

	public nOut: string[];
	public nPub: string[];
	public nPrv: string[];

	constructor( 
		filePaths: circuitFilePaths
	) {
		this.filePaths = filePaths;

		this.symText = fs.readFileSync(this.filePaths.sym, 'utf-8');
	}

	async getR1csJson() {
		const r1cs = await snarkjs.r1cs.exportJson(this.filePaths.r1cs); 
		this.r1csJson = r1cs;
	}
	
	async prepareInputs() {

		// filter inputData array based on the maximum size of nested arrays([0] otherwise)
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
		
		// Prepare an array of outputs and inputs Input Data objects
		
		// filter signal names from the sym file
		const regex = /main\.(.+)/g;
		
		let match;
		let keys = [];
		while ((match = regex.exec(this.symText)) !== null) {
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
		await this.getR1csJson();
		const r1cs = this.r1csJson;
		
		const nOut = r1cs.nOutputs;
		const nPub = r1cs.nPubInputs;
		const nPrv = r1cs.nPrvInputs;
		const total = nOut + nPub + nPrv;
		
		// Save the main circuit signals .i.e inputs -> nOut, nPub, and nPrv separately 
		const signalsArray = keys.map(name => 
			name.indexOf('[') == -1 
			? name 
			: name.slice(0, name.indexOf('[')))
			.slice(0, total);

		this.nOut = [...new Set(signalsArray.slice(0, nOut))]; 
		this.nPub = [... new Set(signalsArray.slice(nOut, nOut + nPub))];
		this.nPrv = [... new Set(signalsArray.slice(nOut + nPub))];

		// Retrieve the main inputs and outputs and select unique input names
		const inputs_arr = arr.slice(0, total); 
		
		for (let i=0; i<total; i++) {
			if(i < nOut+nPub) arr[i].public = 1;
			else arr[i].public = 0;
		}
		const marr = uniqueMaxSize(inputs_arr);
		
		this.inputsNum = marr.length;
		this.inputs = marr.slice(0, marr.length);
		console.log('inputs: ', this.inputs)
	}

	parseAndAppendRustStruct(inputs: any, title: string, libPath: string) {

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
		let structDefinition = `#[account]\npub struct ZK${title}Inputs {\n`;
		
		inputs.forEach((input) => {
			const { inputName, dimension, size } = input;
			const rustType = buildRustType(dimension, size);
			const inputName_snake = camelToSnakeCase(inputName);
			structDefinition += `    ${inputName_snake}: ${rustType},\n`;
		});
		
		structDefinition += "}";
		
		/// append the rust code to the lib.rs i.e. solana program file
		fs.appendFile(libPath, `\n${structDefinition}\n`, (err) => {
			if (err) {
			  console.error("Failed to append the Rust code to lib.rs:", err);
			} else {
			  console.log("Rust code successfully appended to lib.rs.");
			}
		});
		
	}
	async getProofInputs() {
		
		await this.prepareInputs();
		
		type CircuitObject = ZkBattleship["accounts"][1]["type"]["fields"][number];
		type MappedCircuitObject = {
			[Key in CircuitObject['name']]: Extract<CircuitObject, { name: Key }>['type'];
		};
		const proofInputs = this.inputs.slice(this.r1csJson.nOutputs);
		// needs a generic type to prompt user for correct input
		

	}

	async fullProve(input: any) {
		const { proof, publicSignals } = await snarkjs.groth16.fullProve(
			input, 
			this.filePaths.wasm,
			this.filePaths.zkey
		);

		this.publicInputs = publicSignals;
		this.proof = proof;
	}

	async getVkey() {
		const vKey = await snarkjs.zKey.exportVerificationKey(this.filePaths.zkey);
		this.vKey = vKey;
	}

	async verify(proof?: {proofA, proofB, proofC}): Promise<boolean> {

		// verifies the proof generated by this class or a passed in proof
		await this.getVkey();
		const res = await snarkjs.groth16.verify(
			this.vKey, 
			this.publicInputs, 
			this.proof
		);
		return res
	}
	
    parseProofToBytesArray(data: any): {
		proofA: number[], 
		proofB: number[][],
		proofC: number[]
	} {
		var mydata = JSON.parse(data.toString());

		for (var i in mydata) {
		if (i == "pi_a" || i == "pi_c") {
			for (var j in mydata[i]) {
			mydata[i][j] = Array.from(
				leInt2Buff(unstringifyBigInts(mydata[i][j]), 32),
			).reverse();
			}
		} else if (i == "pi_b") {
			for (var j in mydata[i]) {
			for (var z in mydata[i][j]) {
				mydata[i][j][z] = Array.from(
				leInt2Buff(unstringifyBigInts(mydata[i][j][z]), 32),
				);
			}
			}
		}
		}
	
		return {
		proofA: [mydata.pi_a[0], mydata.pi_a[1]].flat(),
		proofB: [
			mydata.pi_b[0].flat().reverse(),
			mydata.pi_b[1].flat().reverse(),
		].flat(),
		proofC: [mydata.pi_c[0], mydata.pi_c[1]].flat(),
		};
	}

	// mainly used to parse the public signals of groth16 fullProve
	parseToBytesArray(publicSignals: Array<string>): number[][] {
      
		var publicInputsBytes = new Array<Array<number>>();
		for (var i in publicSignals) {
		  let ref: Array<number> = Array.from([
			...leInt2Buff(unstringifyBigInts(publicSignals[i]), 32),
		  ]).reverse();
		  publicInputsBytes.push(ref);
		  
		}
		
		return publicInputsBytes
	}

	/* parsePublicInputsFromArray(publicInputsBytes: number[][]): PublicInputs {
		if (!publicInputsBytes) {
		  throw new VerifierError(
			VerifierErrorCode.PUBLIC_INPUTS_UNDEFINED,
			"parsePublicInputsFromArray",
			"verifier zero",
		  );
		}
		if (publicInputsBytes.length != this.config.nrPublicInputs) {
		  throw new VerifierError(
			VerifierErrorCode.INVALID_INPUTS_NUMBER,
			"parsePublicInputsFromArray",
			`verifier zero: publicInputsBytes.length invalid ${publicInputsBytes.length} != ${this.config.nrPublicInputs}`,
		  );
		}
		return {
		  root: publicInputsBytes[0],
		  publicAmount: publicInputsBytes[1],
		  extDataHash: publicInputsBytes[2],
		  feeAmount: publicInputsBytes[3],
		  mintPubkey: publicInputsBytes[4],
		  nullifiers: [publicInputsBytes[5], publicInputsBytes[6]],
		  leaves: [[publicInputsBytes[7], publicInputsBytes[8]]],
		};
	  } */
}




