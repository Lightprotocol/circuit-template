pragma circom 2.1.4;
include "./example.circom";

component main {public [root, leaf]} = Merkle(30, 1);
