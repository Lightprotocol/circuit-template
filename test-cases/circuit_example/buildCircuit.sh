#!/bin/bash -e
POWERS_OF_TAU=12 # circuit will support max 2^POWERS_OF_TAU constraints
mkdir ./test-cases/circuit_example/build

if [ ! -f ./test-cases/circuit_example/build/ptau$POWERS_OF_TAU ]; then
  echo "Downloading powers of tau file"
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o ./test-cases/circuit_example/build/ptau$POWERS_OF_TAU
fi

circom --r1cs --wasm --sym ./test-cases/circuit_example/circuit/Circuit.circom -o ./test-cases/circuit_example/build/
npx snarkjs groth16 setup ./test-cases/circuit_example/build/Circuit.r1cs ./test-cases/circuit_example/build/ptau$POWERS_OF_TAU ./test-cases/circuit_example/build/tmp_circuit.zkey
npx snarkjs zkey contribute ./test-cases/circuit_example/build/tmp_circuit.zkey ./test-cases/circuit_example/build/circuit.zkey -e="321432151325321543215"
npx snarkjs zkey verify ./test-cases/circuit_example/build/Circuit.r1cs ./test-cases/circuit_example/build/ptau$POWERS_OF_TAU ./test-cases/circuit_example/build/circuit.zkey

#rm ./build/Circuit.r1cs
rm ./test-cases/circuit_example/build/tmp_circuit.zkey