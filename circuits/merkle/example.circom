pragma circom 2.1.4;
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./merkleProof.circom";

template Merkle(levels, numberOfUTXOs) {
    signal input inPathElements[numberOfUTXOs][levels];
    signal input inPathIndices[numberOfUTXOs];
    signal input root[numberOfUTXOs];
    signal input leaf[numberOfUTXOs];

    component inTree = MerkleProof(levels);

    for (var i = 0; i < numberOfUTXOs; i++) {
        inTree.leaf <== leaf[i];
        inTree.pathIndices <== inPathIndices[i];
        inTree.pathElements <== inPathElements[i];
        inTree.root === root[i];
    }
}