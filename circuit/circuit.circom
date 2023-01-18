pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template Example() {
    signal input a;
    signal input b;
    signal input c;
    signal input enforce;

    component if_enforce = ForceEqualIfEnabled();
    if_enforce.in[0] <== a + b;
    if_enforce.in[1] <== c;
    if_enforce.enabled <== enforce;

}