pragma circom 2.1.4;
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkleProof.circom";

template Example() {
    var levels = 256;

    signal input inPathIndices;
    signal input inPathElements[levels];
    signal input root;
    signal input leaf;

    component inTree = MerkleProof(levels);
    inTree.leaf <== leaf;
    inTree.pathIndices <== inPathIndices;
    inTree.pathElements <== inPathElements;
    inTree.root === root;

}