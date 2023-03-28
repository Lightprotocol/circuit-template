let circomlibjs = require("circomlibjs");
const calculateWtns = require("../build/Circuit_js/witness_calculator.js");
var ffjavascript = require("ffjavascript");
const { unstringifyBigInts, stringifyBigInts, leInt2Buff, leBuff2int } = ffjavascript.utils;
import {  readFileSync} from "fs";
const snarkjs = require("snarkjs");
import {BN} from "@coral-xyz/anchor";
import { MerkleTree } from "./merkleTree";

describe("Tests", () => {


    it.skip("example circuit proofgen", async () => {
        const completePathZkey = "./build/circuit.zkey";
        const buffer = readFileSync("./build/Circuit_js/Circuit.wasm");
        const poseidon = await circomlibjs.buildPoseidonOpt();
      const leaf = poseidon(["1"]);
      const merkleTree = new MerkleTree(256, poseidon, [leaf]);
      console.log("merkleTree.path(merkleTree.indexOf(leaf))", merkleTree.path(merkleTree.indexOf(leaf)));
      
      const inputs = {
          root: merkleTree.root(),
          inPathIndices: merkleTree.indexOf(leaf),
          inPathElements: merkleTree.path(merkleTree.indexOf(leaf)).pathElements,
          leaf: poseidon.F.toString(leaf)
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

    it("poseidon hash test cases", async () => {
        const poseidon = await circomlibjs.buildPoseidonOpt();
      for (var i = 1; i < 17; i++) {
        const hash = poseidon.F.toObject(
          poseidon(
            Array(i).fill(1)
          ),
        );
        // console.log(new BN(poseidon.F.toObject(hash)).toArray("le", 32).reverse());

        console.log('[' + new BN(hash).toArray("le", 32).reverse().toString() + '],');
      }
    })
})