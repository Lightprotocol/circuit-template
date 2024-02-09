pragma circom 2.1.4;

include "../../node_modules/circomlib/circuits/comparators.circom";

template Multiplier() {
    signal input a;
    signal input b;
    signal input c;
    signal input enforce;

    component if_enforce = ForceEqualIfEnabled();
    if_enforce.in[0] <== a + b;
    if_enforce.in[1] <== c;
    if_enforce.enabled <== enforce;

}
component main {public [a, b, enforce]} = Multiplier();
