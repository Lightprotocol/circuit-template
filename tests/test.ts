import { assert } from "chai";
import * as circomlibjs from "circomlibjs";
const nandCalculateWtns = require("../build/Nand_js/witness_calculator.js");
const multiplierCalculateWtns = require("../build/Multiplier_js/witness_calculator.js");
import * as ffjavascript from "ffjavascript";
const { unstringifyBigInts, stringifyBigInts, leInt2Buff, leBuff2int } = ffjavascript.utils;
import { readFileSync } from "fs";
import * as snarkjs from "snarkjs";

describe("Tests", () => {
  it("nand circuit proofgen", async () => {
    const completePathZkey = "./build/Nand.zkey";
    const buffer = readFileSync("./build/Nand_js/Nand.wasm");

    const inputs = {
      a: 1,
      b: 1,
    };

    let witnessCalculator = await nandCalculateWtns(buffer);

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

  it("multiplier circuit proofgen", async () => {
    const completePathZkey = "./build/Multiplier.zkey";
    const buffer = readFileSync("./build/Multiplier_js/Multiplier.wasm");

    const inputs = {
      a: "2",
      b: "11",
    };

    let witnessCalculator = await multiplierCalculateWtns(buffer);

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
    console.log("proof", proof);

    console.log("vkey");
    const vKey = await snarkjs.zKey.exportVerificationKey(
      completePathZkey,
    );
    console.log("res");
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