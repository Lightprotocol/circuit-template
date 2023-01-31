#!/bin/bash -e
POWERS_OF_TAU=17 # circuit will support max 2^POWERS_OF_TAU constraints
mkdir build
if [ ! -f build/ptau$POWERS_OF_TAU ]; then
  echo "Downloading powers of tau file"
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o ./build/ptau$POWERS_OF_TAU
fi
circom --r1cs --wasm circuit/Circuit.circom -o build/
npx snarkjs groth16 setup build/Circuit.r1cs build/ptau$POWERS_OF_TAU build/tmp_circuit.zkey
npx snarkjs zkey contribute build/tmp_circuit.zkey build/circuit.zkey -e="321432151325321543215"
npx snarkjs zkey verify build/Circuit.r1cs build/ptau$POWERS_OF_TAU build/circuit.zkey
rm ./build/Circuit.r1cs
rm ./build/tmp_circuit.zkey