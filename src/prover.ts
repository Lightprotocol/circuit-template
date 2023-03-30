const snarkjs = require('snarkjs');
const { unstringifyBigInts, leInt2Buff, leBuff2int } = require('ffjavascript').utils;
const ff = require('ffjavascript');
const fs = require('fs');

interface InputData {
	inputName: string;
	dimension: number;
	size: number[];
	sumSize?: number;
	public?: number;
}

class Prover {

    public zkeyFilePath: string;
	public r1csFilePath: string;
	public symFilePath: string;
	public r1csJson;
	public symText;
	public vKey;
	public inputs: Array<InputData>;
    public proofInputs;
    public publicInputs;
    public proof;

	constructor(
		zkeyFilePath: string, 
		r1csFilePath: string,
		symFilePath: string
	) {
		this.zkeyFilePath = zkeyFilePath;
		this.r1csFilePath = r1csFilePath;
		this.symFilePath = symFilePath;	

		this.symText = fs.readFileSync(this.symFilePath, 'utf-8');
	}

	async genR1csJson() {
		const r1cs = await snarkjs.r1cs.exportJson(this.r1csFilePath); 
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
		
		// filter inputData array based on unique input names
		// this will help determine the exact number of inputs
		function unique(arr: Array<InputData> ): Array<InputData> {
		
			const uniqueArr = arr.reduce((acc, cur) => {
				const idx = acc.findIndex(obj => obj.inputName === cur.inputName);
				if (idx === -1) {
				acc.push(cur);
				}
				return acc;
			}, []);
			
			return uniqueArr
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
			const size = dimension === 0 ? [0] : (name.match(/\[(.*?)\]/g) || []).map(m => m.replace(/\[|\]/g, '')).map(n => parseInt(n));
		
			arr.push({ inputName, dimension, size });
		})
		
		// Retrieve the number of outputs as well as the number of private and public inputs from the R1CS file
		await this.genR1csJson();
		const r1cs = this.r1csJson;
		
		const nOut = r1cs.nOutputs;
		const nPub = r1cs.nPubInputs;
		const nPrv = r1cs.nPrvInputs;
		const total = nOut + nPub + nPrv;
		
		// Retrieve the main inputs and outputs and select unique input names
		const inputs_arr = arr.slice(0, total); 
		const uarr = unique(inputs_arr);
		
		for (let i=0; i<total; i++) {
			if(i < nOut+nPub) arr[i].public = 1;
			else arr[i].public = 0;
		}
		const marr = uniqueMaxSize(inputs_arr);
		
		this.inputs = marr.slice(0, uarr.length);
		
	}

	async ProofInputs() {
		await this.prepareInputs();
		const proofInputs = this.inputs.slice(this.r1csJson.nOutputs);
		// needs a generic type to prompt user for correct input

	}

	async fullProve(wasm_path: string) {
		const { proof, publicSignals } = await snarkjs.groth16.fullProve(
			{
				b: "2",
				a: "1",
				c: "3",
				enforce: "1",
				d: "3",
				f: "2"
			}, 
			wasm_path,
			this.zkeyFilePath
			
		)

		this.publicInputs = publicSignals;
		this.proof = proof;
	}

	async genVkey() {
		const vKey = await snarkjs.zKey.exportVerificationKey(this.zkeyFilePath);
		this.vKey = vKey;
	}

	async verify(proof?: {proofA, proofB, proofC}): Promise<boolean> {

		// verifies the proof generated by this class or a passed in proof
		await this.genVkey();
		const res = await snarkjs.groth16.verify(
			this.vKey, 
			this.publicInputs, 
			this.proof
		);
		return res
	}
	// should make this generic

	parsePublicInputs() {
		// same as with proof inputs we want to get the structure of publicInputs
		// from the zkeyFile and then parse it be bytes for the solana transaction input

		// the goal is to replace the parsePublicInputs functions in the verifier classes in the
		// sdk in light protocol onchain in a generic way
	}
	
	/// parse proof to Solana be bytes
	/// also converts lE to BE
    parseProofToBytesArray(data: any) {
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
	parseToBytesArray(publicSignals: Array<string>) {
      
		var publicInputsBytes = new Array<Array<number>>();
		for (var i in publicSignals) {
		  let ref: Array<number> = Array.from([
			...leInt2Buff(unstringifyBigInts(publicSignals[i]), 32),
		  ]).reverse();
		  publicInputsBytes.push(ref);
		  
		}
		
		return publicInputsBytes
	}

}

const sample_prover = new Prover(
	'./build/circuit.zkey',
	'./build/Circuit.r1cs',
	'./build/Circuit.sym'
);

sample_prover.genR1csJson().then(update => {
	console.log(sample_prover.symText);
	console.log(sample_prover.r1csJson);
});

sample_prover.prepareInputs().then(update => {
	console.log(sample_prover.inputs);
});	

sample_prover.fullProve('./build/Circuit_js/Circuit.wasm').then(update => {
	console.log(sample_prover.publicInputs);
	//console.log(sample_prover.proof);
	sample_prover.verify().then(res => {
		console.log('Verification Ok!', res);
	})
})



