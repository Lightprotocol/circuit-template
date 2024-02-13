use tests_rs::{prepare_inputs, proof};
const ZK_BYTES: &[u8] = include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22/circuit.zkey");
const WASM_PATH: &str = "/Users/tsv/Developer/circuit-template/build/merkle22/merkle22_js/merkle22.wasm";
// const WASM_BYTES: &[u8] = include_bytes!("../../../build/merkle22/merkle22_js/merkle22.wasm");

#[test]
fn test_generate_merkle_tree() {
    let inputs = prepare_inputs();
    proof(inputs, ZK_BYTES, WASM_PATH);
}
