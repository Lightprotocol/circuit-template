const snarkjs = require('snarkjs');
const fs = require('fs');
const { unstringifyBigInts, leInt2Buff, leBuff2int } = require('ffjavascript').utils;
import { ZkBattleship } from '../../zk-battleship/target/types/zk_battleship';

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

export type r1csData = {
	nOutputs: number,
	nPubInputs: number,
	nPrvInputs: number,
	nTotalInputs: number
}

export type vKeyData = {
    protocol: string;
    curve: string;
    nPublic: number;
    vk_alpha_1: string[];
    vk_beta_2: string[][];
    vk_gamma_2: string[][];
    vk_delta_2: string[][];
    vk_alphabeta_12: ArrayConstructor[][][];
    IC: string[][];
}

export class Prover {

	public filePaths: circuitFilePaths;

	public r1csInfo: r1csData;
	public symText: string;
	public vKey: vKeyData;

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
		// Later make it shorter by taking the first #r1cs_total lines
		this.symText = fs.readFileSync(this.filePaths.sym, 'utf-8');
	}

	async getR1csJson() {
		const r1cs = await snarkjs.r1cs.exportJson(this.filePaths.r1cs); 
		this.r1csInfo = {
			nOutputs: r1cs.nOutputs,
			nPubInputs: r1cs.nPubInputs,
			nPrvInputs: r1cs.nPrvInputs,
			nTotalInputs: r1cs.nOutputs + r1cs.nPubInputs + r1cs.nPrvInputs
		}
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
		const r1cs = this.r1csInfo;
		
		const nOut = r1cs.nOutputs;
		const nPub = r1cs.nPubInputs;
		const nPrv = r1cs.nPrvInputs;
		const total = r1cs.nTotalInputs;
		
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

	parseAndAppendRustStruct(inputs: any, title: string, outPath: string) {

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
		fs.appendFile(outPath, `\n${structDefinition}\n`, (err) => {
			if (err) {
			  console.error("Failed to append the Rust code to VerifyingKey file!:", err);
			} else {
			  console.log("Rust code successfully appended to VerifyingKey file!.");
			}
		});
		
	}

	async getProofInputs() {
		
		await this.prepareInputs();
		type ShotTypes = ZkBattleship["accounts"][0]["type"]["fields"][number]["type"];
		type ShotNames = ZkBattleship["accounts"][0]["type"]["fields"][number]["name"];
		
		// A conditional generic type that parses proofInputs type from the
		type ConvertArrays<T> = T extends { array: infer U}
			? U extends [{ array: infer K}, number]
				? K extends [{ array: infer F}, number]
					? F extends ["u8", number]
						? string[][][]
						: never
					: K extends ["u8", number]
						? string[][]
						: never	
				: U extends ["u8", number]
					? string[]
					: never
			: T extends "u8"
		  		? string
				: never
		
		// Recursive generic type parser till dimension = 4 i.e. for
		// { array: [{ array: [{ array: [{ array: ["u8", 2] }, 3] }, 4] }, 5] } => string[][][][] 	
		type ConvertArray<T> = T extends { array: infer U }
			? U extends [{ array: infer K }, number]
				? Array<ConvertArrays<{ array: K }>>
				: U extends ["u8", number]
				? Array<string>
				: never
			: T extends "u8"
			? string
			: never;

		type newNestedArray = {
			array: [{
				array: ["u8", 3];
			}, 5];
			}

		type newArray = {
			array: ["u8", 4];
		} 

		type indicesType = {
			"array": [
			  {
				"array": [
				  {
					"array": [
					  "u8",
					  3
					]
				  },
				  2
				]
			  },
			  4
			]
		}
		
		type FourDimensions = ConvertArray<{ array: [{ array: [{ array: [{ array: ["u8", 2] }, 3] }, 4] }, 5] }>; // string[][][][]
		type FiveDimensions = ConvertArray<{ array: [{ array: [{ array: [{ array: [{ array: ["u8", 2] }, 3] }, 4] }, 5] }, 6] }>; // string[][][][][]

		let bbc: ConvertArrays<newArray>
		let ffc: ConvertArrays<newNestedArray>
		let indc: ConvertArray<indicesType>
		let tps : ConvertArrays<ShotTypes>

		// indexed access type of the mock-verifier from the idl types file
		type CircuitObject = ZkBattleship["accounts"][1]["type"]["fields"][number];
		
		// create a mapped type combing name as key and type as property
		type MappedCircuitObject = {
			[Key in CircuitObject['name']]: Extract<CircuitObject, { name: Key }>['type'];
		};

		// generic mapped type combining name and key
		type CombinedCircuitObject<T extends {name: keyof T, type: any}> = {
			[Key in T['name']]: Extract<T, { name: Key }>['type'];
		};


		//let bsg: CombinedCircuitObject<CircuitObject>;
		let msd: MappedCircuitObject;

		type CircuitInputsObject<T> = {
			[Property in keyof T] : ConvertArrays<T[Property]>
		}

		let proofTypes: CircuitInputsObject<MappedCircuitObject>['hash']
		let bb: typeof proofTypes

		type FixedLengthArray<N extends number, T> = N extends N ? number extends N ? T[] : _FixedLengthArray<N, T, []> : never;
		type _FixedLengthArray<N extends number, T, R extends unknown[]> = R['length'] extends N ? R : _FixedLengthArray<N, T, [T, ...R]>;

		// Example usage:
		type ThreeStringArray = FixedLengthArray<3, string>;
		type FiveStringArray = FixedLengthArray<5, string>;
		
		let ssst: ThreeStringArray = ['af', 'afdf', 'asfdasdf']
		const proofInputs = this.inputs.slice(this.r1csInfo.nOutputs);
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




