#!/bin/bash -e

function download_ptau {
  directory="$1"
  ptau_number="$2"
  if [ ! -f "$directory/ptau$ptau_number" ]; then
    echo "Downloading powers of tau file"
    curl -L "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$ptau_number.ptau" --create-dirs -o "./$directory/ptau$ptau_number" || { echo "Download failed"; exit 1; }
  fi
}

function execute_commands {
  merkle_number="$1"
  utxo_count="$2"
  ptau_number="$3"

  [[ $# -ne 3 ]] && { echo "Invalid number of arguments"; exit 1; }

  mkdir -p "build/merkle${merkle_number}_$utxo_count"
  download_ptau "build" "$ptau_number" || { echo "download_ptau failed"; exit 1; }

  circom --r1cs --wasm --sym "circuits/merkle/merkle${merkle_number}_$utxo_count.circom" -o "build/merkle${merkle_number}_$utxo_count" || { echo "circom failed"; exit 1; }

  npx snarkjs groth16 setup "build/merkle${merkle_number}_${utxo_count}/merkle${merkle_number}_$utxo_count.r1cs" "build/ptau$ptau_number" "build/merkle${merkle_number}_$utxo_count/tmp_circuit.zkey" || { echo "snarkjs groth16 setup failed"; exit 1; }

  # Consider storing entropy in a safer way than a hardcoded string
  npx snarkjs zkey contribute "build/merkle${merkle_number}_$utxo_count/tmp_circuit.zkey" "build/merkle${merkle_number}_$utxo_count/circuit.zkey" -e="321432151325321543215" || { echo "snarkjs zkey contribute failed"; exit 1; }

  npx snarkjs zkey verify "build/merkle${merkle_number}_${utxo_count}/merkle${merkle_number}_$utxo_count.r1cs" "build/ptau$ptau_number" "build/merkle${merkle_number}_$utxo_count/circuit.zkey" || { echo "snarkjs zkey verify failed"; exit 1; }
}

POWERS_OF_TAU=16
execute_commands 22 1 "$POWERS_OF_TAU" || exit
execute_commands 22 2 "$POWERS_OF_TAU" || exit
execute_commands 22 3 "$POWERS_OF_TAU" || exit
execute_commands 22 4 "$POWERS_OF_TAU" || exit
execute_commands 22 5 "$POWERS_OF_TAU" || exit
execute_commands 22 6 "$POWERS_OF_TAU" || exit
execute_commands 22 7 "$POWERS_OF_TAU" || exit
execute_commands 22 8 "$POWERS_OF_TAU" || exit
execute_commands 22 9 "$POWERS_OF_TAU" || exit
execute_commands 22 10 "$POWERS_OF_TAU" || exit