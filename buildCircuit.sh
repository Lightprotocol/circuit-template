#!/bin/bash

set -eux

POWERS_OF_TAU=12 # circuit will support max 2^POWERS_OF_TAU constraints

function build_circuit {
  local circuit_name=$1

  if [ ! -f build/ptau$POWERS_OF_TAU ]; then
    echo "Downloading powers of tau file"
    curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o ./build/ptau$POWERS_OF_TAU
  fi
  circom --r1cs --wasm circuit/${circuit_name}.circom -o build/
  npx snarkjs groth16 setup \
    build/${circuit_name}.r1cs \
    build/ptau$POWERS_OF_TAU build/tmp_${circuit_name}.zkey
  npx snarkjs zkey contribute \
    build/tmp_${circuit_name}.zkey \
    build/${circuit_name}.zkey \
    -e="321432151325321543215"
  npx snarkjs zkey verify \
    build/${circuit_name}.r1cs \
    build/ptau${POWERS_OF_TAU} \
    build/${circuit_name}.zkey
  rm ./build/${circuit_name}.r1cs
  rm ./build/tmp_${circuit_name}.zkey
}

mkdir -p build
build_circuit "Nand"
build_circuit "Multiplier"
