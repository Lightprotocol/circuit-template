# Circuits Template

This repo contains a minimal circuit in the circuit directory, a script to build it and a test to generate a proof and verify it.

The circuit proves that the addition of a + b == c if enforce unequal 0.
This is an unsafe pattern since you cannot rely that the public input c is actually the sum of a + b since the enforce input is a private input.
Also this highlights the difficulty of implementing conditional logic in circuits. All paths need to be defined at compile time of the circuit.
Enforce is a work around this.

## Run

### Install Deps

npm i

### build the circuit

npm run build 

### run

npm test


