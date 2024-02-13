use tests_rs::{merkle_tree_inputs, prepare_inputs, prove, verify};
const ZK_BYTES: &[u8] = include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22/circuit.zkey");
const WASM_PATH: &str = "/Users/tsv/Developer/circuit-template/build/merkle22/merkle22_js/merkle22.wasm";
// const WASM_BYTES: &[u8] = include_bytes!("../../../build/merkle22/merkle22_js/merkle22.wasm");

#[test]
fn test_prove_and_verify_merkle_tree() {
    let inputs = merkle_tree_inputs();
    let proof_inputs = prepare_inputs(inputs, ZK_BYTES, WASM_PATH);
    let proof_outputs = prove(&proof_inputs);
    let verified = verify(proof_inputs, proof_outputs);
    assert!(verified);
}
