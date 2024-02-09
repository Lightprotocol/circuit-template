#!/bin/bash -e
POWERS_OF_TAU=13 # merkle will support max 2^POWERS_OF_TAU constraints
mkdir -p build/multiplier
if [ ! -f build/ptau$POWERS_OF_TAU ]; then
  echo "Downloading powers of tau file"
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o ./build/ptau$POWERS_OF_TAU
fi
circom --r1cs --wasm --c circuits/multiplier/circuit.circom -o build/multiplier/
npx snarkjs groth16 setup build/multiplier/circuit.r1cs build/ptau$POWERS_OF_TAU build/multiplier/tmp_circuit.zkey
npx snarkjs zkey contribute build/multiplier/tmp_circuit.zkey build/multiplier/circuit.zkey -e="321432151325321543215"
npx snarkjs zkey verify build/multiplier/circuit.r1cs build/ptau$POWERS_OF_TAU build/multiplier/circuit.zkey
# rm ./build/multiplier/circuit.r1cs
# rm ./build/multiplier/tmp_circuit.zkey