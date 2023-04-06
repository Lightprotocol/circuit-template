#!/bin/bash -e
POWERS_OF_TAU=14 # circuit will support max 2^POWERS_OF_TAU constraints
mkdir build
if [ ! -f build/ptau$POWERS_OF_TAU ]; then
  echo "Downloading powers of tau file"
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o ./build/ptau$POWERS_OF_TAU
fi
circom --r1cs --wasm --sym mockVerifierCircuit/appTransaction.circom -o build/
npx snarkjs groth16 setup build/appTransaction.r1cs build/ptau$POWERS_OF_TAU build/tmp_circuit.zkey
npx snarkjs zkey contribute build/tmp_circuit.zkey build/appTransaction.zkey -e="321432151325321543215"
npx snarkjs zkey verify build/appTransaction.r1cs build/ptau$POWERS_OF_TAU build/appTransaction.zkey

#rm ./build/Circuit.r1cs
rm ./build/tmp_circuit.zkey