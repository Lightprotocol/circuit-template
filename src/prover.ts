const snarkjs = require('snarkjs');
const { unstringifyBigInts, leInt2Buff, leBuff2int } = require('ffjavascript').utils;
import { ZkBattleship as IDL } from '../zk-battleship/target/types/zk_battleship';
import {
	VerifierError,
	VerifierErrorCode,	
} from "./errors";

export namespace IDLGenerics {

	type Account = {
		name: string;
		type: any;
	};

	type SelectAccount<AccountName extends string, T extends Account[]> = 
		T extends [
			infer First,
			...infer Rest
		]
		? First extends { name: AccountName }
			? First
			: SelectAccount<AccountName, Rest extends Account[] ? Rest : never>
		: never;	

	type SelectZKAccount<AccountName extends ZKAccounts['name']> = 
		SelectAccount<AccountName, IDL['accounts']> extends {name: any, type: {kind: any, fields: any}}
			? SelectAccount<AccountName, IDL['accounts']>['type']['fields']
			: never

  
	// Recursive generic type parser till dimension = 4 i.e. for
	// { array: [{ array: [{ array: [{ array: ["u8", 2] }, 3] }, 4] }, 5] } => string[][][][] 	
	type ConvertArray<T> = T extends { array: infer U }
		? U extends [{ array: infer K }, number]
			? Array<ConvertArray<{ array: K }>>
			: U extends ["u8", number]
				? Array<string>
				: never
		: T extends "u8"
			? string
			: never;

	type ConvertToParsedArray<T> = T extends { array: infer U }
	? U extends [{ array: infer K }, number]
		? Array<ConvertArray<{ array: K }>>
		: U extends ["u8", number]
			? Array<Array<number>>
			: never
	: T extends "u8"
		? Array<number>
		: never;
	
	// create a mapped type combing name as key and type as property
	type MapObjectKeys<T extends Array<{ name: any, type: any}>> = {
		[Key in T[number]['name']]: Extract<T[number], { name: Key }>['type'];
	};

	// parse Rust types into TS
	type CircuitInputsObject<T> = {
		[Property in keyof T] : ConvertArray<T[Property]>
	}

	type ParsedPubInObject<T> = {
		[Property in keyof T] : ConvertToParsedArray<T[Property]>

	}
	// SelectZKAccount generic type example
	type zKshotProofInputs = SelectZKAccount<"zKshotProofInputs">;
	//let ada: CircuitInputsObject<MapObjectKeys<zKshotProofInputs>>
	type ExtractPrefix<T extends string> = T extends `zK${infer P}ProofInputs` | `zK${infer P}PublicInputs` ? P : never;

	export type CircuitNames = ExtractPrefix<ZKAccounts['name']>;
	
	type ZKInputsObjectFullName<AccountName extends ZKAccounts['name']>  =
		CircuitInputsObject<MapObjectKeys<SelectZKAccount<AccountName>>>;

	let sampleProofInputs: ZKInputsObject<"shot", "proof">;
	//sampleProofInputs.

	let samplePublicInputs: ZKInputsObject<"board", "public">;
	//samplePublicInputs.
	
	export type ZKInputsObject<CircuitName extends CircuitNames, InputsType extends "proof"|"public">  =
		CircuitInputsObject<MapObjectKeys<SelectZKAccount<`zK${CircuitName}${Capitalize<InputsType>}Inputs`
		>>>;
	
	export type ZKParsedPubInputsObject<CircuitName extends CircuitNames, InputsType extends "proof"|"public">  =
		ParsedPubInObject<MapObjectKeys<SelectZKAccount<`zK${CircuitName}${Capitalize<InputsType>}Inputs`
		>>>;
	let a: ZKParsedPubInputsObject<'shot','public'>
	
	
	//let proofTypes: CircuitInputsObject<MappedCircuitObject>
	
	type Accounts = IDL["accounts"][number];
	type ZKAccounts = FetchZKAccounts<Accounts>;
	type FetchZKAccounts<T> = T extends Accounts 
		? T["name"] extends `zK${infer _}` 
			? T
			: never
		: never

	
	type ZKProofAccounts = FetchProofAccounts<ZKAccounts>
	type FetchProofAccounts<T> = T extends ZKAccounts
		? T["name"] extends `${infer _}Proof${infer _}` 
			? T
			: never
		: never

	export type SelectZKPubInAccount<CircuitName extends CircuitNames> = SelectZKAccount<`zK${CircuitName}PublicInputs`>;
	export type ZKPublicInAccounts = FetchPublicInAccounts<ZKAccounts>
	type FetchPublicInAccounts<T> = T extends ZKAccounts
		? T["name"] extends `${infer _}Public${infer _}` 
			? T
			: never
		: never
	
}

export type proofData = {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
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

export type zkeyData = {
    protocol: string;
    n8q: number;
    q: string;
    n8r: number;
    r: string;
    nVars: number;
    nPublic: number;
    domainSize: number;
    power: number;
    vk_alpha_1: string[];
    vk_beta_1: string[];
    vk_beta_2: string[][];
    vk_gamma_2: string[][];
    vk_delta_1: string[];
    vk_delta_2: string[][];
    IC: string[][];
    ccoefs: {
        matrix: number;
        constraint: number;
        signal: number;
        value: string;
    }[];
    A: string[][];
    B1: string[][];
    B2: ArrayConstructor[][][];
    C: (boolean | string[] | 9)[];
    hExps: string[][];
}

export type circuitFilePaths = {
	zkey: string;
	wasm: string;
}


export class Prover<CircuitName extends IDLGenerics.CircuitNames> {
	
	public circuitName: CircuitName;
	public idl: IDL; 
	public filePaths: circuitFilePaths;
    public proofInputs: IDLGenerics.ZKInputsObject<CircuitName, "proof">;
    public publicInputs: string[];
	public vKey: vKeyData;
    public proof: proofData;

	constructor( 
		idl: IDL,
		filePaths: circuitFilePaths
	) {
		this.idl = idl;
		this.filePaths = filePaths;
	}

	async addProofInputs(proofInputs: typeof this.proofInputs, circuitName: CircuitName) {
		
		this.circuitName = circuitName;
		const circuitIdlObject = this.idl.accounts.find((account) => account.name === `ZK${circuitName}ProofInputs`);

		if (!circuitIdlObject) {
			throw new Error(`${`ZK${circuitName}ProofInputs`} does not exist in anchor idl`);
		}
		
		const fieldNames = circuitIdlObject.type.fields.map((field: { name: string }) => field.name);
		const inputKeys = [];

		fieldNames.forEach((fieldName: string) => {
			inputKeys.push(fieldName);
		});

		let inputsObject = {};

		inputKeys.forEach((key) => {
			inputsObject[key] = proofInputs[key];
			if(!inputsObject[key])
				throw new Error(`Property ${key.toString()} undefined`);
		})

		this.proofInputs = proofInputs;
		
	}

	async fullProve() {

		const { proof, publicSignals } = await snarkjs.groth16.fullProve(
			this.proofInputs, 
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
	
    parseProofToBytesArray(proof: proofData): {
		proofA: number[], 
		proofB: number[][],
		proofC: number[]
	} {
		var mydata = JSON.parse(proof.toString());

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
			proofC: [mydata.pi_c[0], mydata.pi_c[1]].flat()
		};
	}

	// mainly used to parse the public signals of groth16 fullProve
	parseToBytesArray(publicSignals: string[]): number[][] {
      
		var publicInputsBytes = new Array<Array<number>>();
		for (var i in publicSignals) {
			let ref: Array<number> = Array.from([
			...leInt2Buff(unstringifyBigInts(publicSignals[i]), 32),
			]).reverse();
			publicInputsBytes.push(ref);
		}
		
		return publicInputsBytes
	}

	async fullProveAndParse() {

		await this.fullProve();
		const parsedPublicInputsObj = this.parseToBytesArray(this.publicInputs);
		const parsedProofObj = this.parseProofToBytesArray(this.proof);

		return { proof: parsedProofObj, publicInputs: parsedPublicInputsObj }
	}

	parsePublicInputsFromArray(
		publicInputsBytes: number[][]
	): IDLGenerics.ZKParsedPubInputsObject<CircuitName, "public"> {
		
		type ParsedPublicInputs = IDLGenerics.ZKParsedPubInputsObject<CircuitName, "public">;

		function getNrPublicInputs(input: SizeObject): number {
			let arr = [];
			for (const key in input) {
				arr.push(...input[key])
			}
			const updatedArray = arr.map((value) => (value === 0 ? 1 : value));

			return updatedArray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		}

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

		type SizeObject = {
			[key: string]: number[];
		}

		function getObjectSizes(idlObject: any): SizeObject {
			let output: SizeObject = {};
			let nrPublicInputs = 0;
			for (const field of idlObject[0].type.fields) {
			  output[field.name] = getSize(field.type);
			}
		  
			return output;
		}  

		type NestedNumberArray = number | NestedNumberArray[];

		type OutputObject = {
			[key: string]: NestedNumberArray;
		}

		function spreadArrayToObject(input: number[][], sizes: SizeObject): ParsedPublicInputs {
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
		  
			return output as ParsedPublicInputs;
		}
		  
		if (!publicInputsBytes) {
		  throw new VerifierError(
			VerifierErrorCode.PUBLIC_INPUTS_UNDEFINED,
			"parsePublicInputsFromArray",
			this.circuitName,
		  );
		}

		const publicInputs_IdlObject = this.idl.accounts.find(
			(account) => account.name === `ZK${this.circuitName}PublicInputs`);
		
		const key_sizes = getObjectSizes([publicInputs_IdlObject]);
		const nrPublicInputs = getNrPublicInputs(key_sizes);
	
		console.log('nrPublicInputs', nrPublicInputs);

		if (publicInputsBytes.length != nrPublicInputs) {
		  throw new VerifierError(
			VerifierErrorCode.INVALID_INPUTS_NUMBER,
			"parsePublicInputsFromArray",
			`${this.circuitName}: publicInputsBytes.length invalid ${publicInputsBytes.length} != ${nrPublicInputs}`,
		  );
		}		

		const result = spreadArrayToObject(publicInputsBytes, key_sizes);

		return result
		
	  }

}

