import { assert } from "chai";
import * as circomlibjs from "circomlibjs";
const calculateWtns = require("../build/Circuit_js/witness_calculator.js")
import * as ffjavascript from "ffjavascript";
const { unstringifyBigInts, stringifyBigInts, leInt2Buff, leBuff2int } = ffjavascript.utils;
import { readFileSync } from "fs";
import * as snarkjs from "snarkjs";

describe("Tests", () => {


  it("example circuit proofgen", async () => {
    const completePathZkey = "./build/circuit.zkey";
    const buffer = readFileSync("./build/Circuit_js/Circuit.wasm");

    const inputs = {
      leaf: "11",
      subtrees: [
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
        "3",
      ],
      indices: ["0"],
    }

    let witnessCalculator = await calculateWtns(buffer);

    console.time("Proof generation");
    let wtns = await witnessCalculator.calculateWTNSBin(
      inputs,
      0,
    );

    const { proof, publicSignals } = await snarkjs.groth16.prove(
      completePathZkey,
      wtns,
    );
    console.timeEnd("Proof generation");
    console.log("publicSignals", publicSignals);
    // assert(publicSignals[0] === "33");
    console.log("proof", proof);

    const vKey = await snarkjs.zKey.exportVerificationKey(
      completePathZkey,
    );
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