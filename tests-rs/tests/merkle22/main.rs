use tests_rs::{merkle_tree_inputs, prepare_inputs, prove, verify};

#[test]
fn test_prove_and_verify_merkle_tree_utxos_1() {
    const ZK_BYTES: &[u8] = include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_1/circuit.zkey");
    const WASM_PATH: &str = "/Users/tsv/Developer/circuit-template/build/merkle22_1/merkle22_1_js/merkle22_1.wasm";

    let inputs = merkle_tree_inputs();
    let proof_inputs = prepare_inputs(&[inputs], ZK_BYTES, WASM_PATH);
    let proof_outputs = prove(&proof_inputs);
    let verified = verify(&proof_inputs, &proof_outputs);
    assert!(verified);
}

#[test]
fn test_prove_and_verify_merkle_tree_utxos_2() {
    const ZK_BYTES: &[u8] = include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_2/circuit.zkey");
    const WASM_PATH: &str = "/Users/tsv/Developer/circuit-template/build/merkle22_2/merkle22_2_js/merkle22_2.wasm";

    let inputs = vec![merkle_tree_inputs(), merkle_tree_inputs()];
    let proof_inputs = prepare_inputs(&inputs, ZK_BYTES, WASM_PATH);
    let proof_outputs = prove(&proof_inputs);
    let verified = verify(&proof_inputs, &proof_outputs);
    assert!(verified);
}