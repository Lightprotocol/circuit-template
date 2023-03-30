let circomlibjs = require("circomlibjs");
const calculateWtns = require("../build/Circuit_js/witness_calculator.js");
var ffjavascript = require("ffjavascript");
const { unstringifyBigInts, stringifyBigInts, leInt2Buff, leBuff2int } = ffjavascript.utils;
import { readFileSync } from "fs";
const snarkjs = require("snarkjs");

describe("Tests", () => {


    it("example circuit proofgen", async () => {
        const completePathZkey = "./build/circuit.zkey";
        const buffer = readFileSync("./build/Circuit_js/Circuit.wasm");


        const inputs = {
            b: "2",
            a: "1",
            c: "3",
            enforce: "1",
            d: "3",
            f: "2"
        }

        let witnessCalculator = await calculateWtns(buffer);


        console.time("Proof generation");
        let wtns = await witnessCalculator.calculateWTNSBin(
            inputs,
            0,
        );
        //console.log('wtns: ', wtns);
        const { proof, publicSignals } = await snarkjs.groth16.prove(
            completePathZkey,
            wtns,
        );
        console.timeEnd("Proof generation");
        console.log("publicSignals", publicSignals);
        //console.log("proof", proof);

        const vKey = await snarkjs.zKey.exportVerificationKey(
            completePathZkey,
          );
        const r1cs = await snarkjs.r1cs.exportJson('./build/Circuit.r1cs');
        console.log('r1cs json: ', r1cs);
        
        const zkey = await snarkjs.zKey.exportJson(completePathZkey);
        //console.log('reading zkey: : ', zkey);
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        if (res === true) {
          console.log("Verification OK");
        } else {
          console.log("Invalid proof");
          throw new Error("Invalid Proof");
        }
    })

    it("example poseidon hash", async () => {
        const poseidon = await circomlibjs.buildPoseidonOpt();

        const hash = poseidon.F.toString(
            poseidon(
              [1, 2]
            ),
          );
        console.log(hash);
        
    })
})