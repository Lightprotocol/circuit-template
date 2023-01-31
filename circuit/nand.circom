pragma circom 2.0.0;

template NAND() {
    signal input a;
    signal input b;
    signal output c;

    // Assuming that a and b are binary.
    c <== 1 - (a * b);
    // Require a and be to be binary.
    a * (a - 1) === 0;
    b * (b - 1) === 0;
}
