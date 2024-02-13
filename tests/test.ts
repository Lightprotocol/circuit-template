import {MerkleTreeCircomPoseidon} from "./merkleTreeCircomPoseidon";

let circomlibjs = require("circomlibjs");
const calculateWtns = require("../build/multiplier/circuit_js/witness_calculator.js");
var ffjavascript = require("ffjavascript");
const {unstringifyBigInts, stringifyBigInts, leInt2Buff, leBuff2int} = ffjavascript.utils;
import {readFileSync} from "fs";

const snarkjs = require("snarkjs");
import {BN} from "@coral-xyz/anchor";
import {MerkleTree} from "./merkleTree";

import {LightWasm, WasmFactory} from "@lightprotocol/account.rs";

describe("Tests", () => {

    let lightWasm: LightWasm;

    before(async () => {
        lightWasm = await WasmFactory.getInstance();
    });

    it("merkle proofgen", async () => {
        const hasher = await WasmFactory.getInstance();
        const merkle_heights = [22]; //[22, 30, 40, 128];
        for (let i = 0; i < merkle_heights.length; i++) {
            const completePathZkey = `./build/merkle${merkle_heights[i]}/circuit.zkey`;
            const buffer = readFileSync(`./build/merkle${merkle_heights[i]}/merkle${merkle_heights[i]}_js/merkle${merkle_heights[i]}.wasm`);
            // const leaf = "1"; //hasher.poseidonHashString(["1"]);
            const leaf = hasher.poseidonHashString(["1"]);
            const merkleTree = new MerkleTree(merkle_heights[i], hasher, [leaf]);

            const inputs = {
                root: merkleTree.root(),
                inPathIndices: merkleTree.indexOf(leaf),
                inPathElements: merkleTree.path(merkleTree.indexOf(leaf)).pathElements,
                leaf: [leaf]
            }

            console.log("inputs = ", inputs);
            console.log("let root = ",inputs.root);
            console.log("let inPathIndices = ", inputs.inPathIndices);
            console.log("let inPathElements = vec![", );
            for (let i = 0; i < inputs.inPathElements.length; i++) {
                console.log("BigInt::from_str(\"" + inputs.inPathElements[i] + "\"), ");
            }
            console.log("]")
            console.log("let leaf = ", inputs.leaf);

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
        }
    });


    it.skip("proofgen (circom poseidon)", async () => {
        const completePathZkey = "./build/merkle22/circuit.zkey";
        const buffer = readFileSync("./build/merkle22/merkle22_js/merkle22.wasm");

        const poseidon = await circomlibjs.buildPoseidonOpt();
        const leaf = poseidon(["1"]);
        const merkleTree = new MerkleTreeCircomPoseidon(22, poseidon, [leaf]);
        // console.log("merkleTree.path(merkleTree.indexOf(leaf))", merkleTree.path(merkleTree.indexOf(leaf)));

        const inputs = {
            root: merkleTree.root(),
            inPathIndices: merkleTree.indexOf(leaf),
            inPathElements: merkleTree.path(merkleTree.indexOf(leaf)).pathElements,
            leaf: poseidon.F.toString(leaf)
        }

        console.log("merkle circom poseidon inputs = ", inputs);

        let witnessCalculator = await calculateWtns(buffer);


        console.time("Proof generation");
        let wtns = await witnessCalculator.calculateWTNSBin(
            inputs,
            0,
        );

        const {proof, publicSignals} = await snarkjs.groth16.prove(
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
    });

})