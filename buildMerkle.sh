#!/bin/bash -e

function download_ptau {
  directory=$1
  ptau_number=$2
  if [ ! -f $directory/ptau$ptau_number ]; then
    echo "Downloading powers of tau file"
    curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$ptau_number.ptau --create-dirs -o ./$directory/ptau$ptau_number
  fi
}

function execute_commands {
  merkle_number=$1
  ptau_number=$2
  mkdir -p build/merkle$merkle_number
  download_ptau "build" $ptau_number
  circom --r1cs --wasm --sym circuits/merkle/merkle$merkle_number.circom -o build/merkle$merkle_number
  npx snarkjs groth16 setup build/merkle$merkle_number/merkle$merkle_number.r1cs build/ptau$ptau_number build/merkle$merkle_number/tmp_circuit.zkey
  npx snarkjs zkey contribute build/merkle$merkle_number/tmp_circuit.zkey build/merkle$merkle_number/circuit.zkey -e="321432151325321543215"
  npx snarkjs zkey verify build/merkle$merkle_number/merkle$merkle_number.r1cs build/ptau$ptau_number build/merkle$merkle_number/circuit.zkey
#  npx snarkjs zkey export verificationkey build/merkle$merkle_number/circuit.zkey verification_key.json
#  npx ts-node createRustVerifyingKey.ts $2 $3  $1 $4
}

POWERS_OF_TAU=16

execute_commands 22 $POWERS_OF_TAU
