let circomlibjs = require("circomlibjs");
const calculateWtns = require("../build/multiplier/circuit_js/witness_calculator.js");
var ffjavascript = require("ffjavascript");
const {unstringifyBigInts, stringifyBigInts, leInt2Buff, leBuff2int} = ffjavascript.utils;
import {readFileSync} from "fs";

const snarkjs = require("snarkjs");
import {BN} from "@coral-xyz/anchor";
import {MerkleTree} from "./merkleTree";

describe("Tests", () => {

    it.skip("multiplier proofgen", async () => {
        const completePathZkey = "./build/multiplier/circuit.zkey";
        const buffer = readFileSync("./build/multiplier/circuit_js/circuit.wasm");
        const inputs = {
            a: "1",
            b: "2",
            c: "3",
            enforce: "1"
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
        // console.log("publicSignals", publicSignals);
        // console.log("proof", proof);
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

    it("merkle proofgen", async () => {
        const completePathZkey = "./build/merkle/circuit.zkey";
        const buffer = readFileSync("./build/merkle/circuit_js/circuit.wasm");
        const poseidon = await circomlibjs.buildPoseidonOpt();
        const leaf = poseidon(["1"]);
        const merkleTree = new MerkleTree(30, poseidon, [leaf]);

        const inputs = {
            root: merkleTree.root(),
            inPathIndices: merkleTree.indexOf(leaf),
            inPathElements: merkleTree.path(merkleTree.indexOf(leaf)).pathElements,
            leaf: poseidon.F.toString(leaf)
        }

        console.log("inputs = ", inputs);
        console.log("let root = ", new BN(inputs.root).toArray("be", 32));
        console.log("let inPathIndices = ", new BN(inputs.inPathIndices).toArray("be", 32));
        console.log("let inPathElements = [", );
        for (let element in inputs.inPathElements) {
            let b = new BN(element).toArray("be", 32);
            console.log(b + ", ");
        }
        console.log("]")
        console.log("let leaf = ", new BN(inputs.leaf).toArray("be", 32));

        let witnessCalculator = await calculateWtns(buffer);

        console.time("Proof generation");
        let wtns = await witnessCalculator.calculateWTNSBin(inputs, 0,);

        const {proof, publicSignals} = await snarkjs.groth16.prove(
            completePathZkey,
            wtns,
        );
        console.timeEnd("Proof generation");
        // console.log("publicSignals", publicSignals);
        // console.log("proof", proof);

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

    it.skip("poseidon hash test cases", async () => {
        const poseidon = await circomlibjs.buildPoseidonOpt();
        for (let i = 1; i < 22; i++) {
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