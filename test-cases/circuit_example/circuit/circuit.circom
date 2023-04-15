pragma circom 2.0.0;
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/comparators.circom";

template Example() {
    signal input a;
    signal input b;
    signal input c;
    signal input enforce;
    signal input d;
    signal input f;
    signal output out1[2];
    signal output out2[3];

    component if_enforce = ForceEqualIfEnabled();
    if_enforce.in[0] <== a + b;
    if_enforce.in[1] <== c;
    if_enforce.enabled <== enforce;

    out1[0] <== a + b;
    out1[1] <== a - b;
    out2[0] <== d + f;
    out2[1] <== d * f;
    out2[2] <== d - f;
}