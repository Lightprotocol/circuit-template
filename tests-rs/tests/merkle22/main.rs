use tests_rs::{merkle_tree_inputs, prepare_inputs, prove, verify};
const ZK_BYTES: &[&[u8]; 10] = &[
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_1/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_2/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_3/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_4/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_5/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_6/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_7/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_8/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_9/circuit.zkey"),
    include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_10/circuit.zkey"),
];
// #[test]
// fn test_prove_and_verify_merkle_tree_utxos_1() {
//     const zk_bytes: &[u8] = ZK_BYTES[0];
//     const WASM_PATH: &str = "/Users/tsv/Developer/circuit-template/build/merkle22_1/merkle22_1_js/merkle22_1.wasm";
//
//     let inputs = vec![merkle_tree_inputs()];
//     let proof_inputs = prepare_inputs(&inputs, zk_bytes, WASM_PATH);
//     let proof_outputs = prove(&proof_inputs);
//     let verified = verify(&proof_inputs, &proof_outputs);
//     assert!(verified);
// }

// #[test]
// fn test_prove_and_verify_merkle_tree_utxos_2() {
//     const ZK_BYTES: &[u8] = include_bytes!("/Users/tsv/Developer/circuit-template/build/merkle22_2/circuit.zkey");
//     const WASM_PATH: &str = "/Users/tsv/Developer/circuit-template/build/merkle22_2/merkle22_2_js/merkle22_2.wasm";
//
//     let inputs = vec![merkle_tree_inputs(), merkle_tree_inputs()];
//     let proof_inputs = prepare_inputs(&inputs, ZK_BYTES, WASM_PATH);
//     let proof_outputs = prove(&proof_inputs);
//     let verified = verify(&proof_inputs, &proof_outputs);
//     assert!(verified);
// }

#[test]
fn test_prove_and_very_1_to_10() {
    let indices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (i, el) in indices.iter().enumerate() {
        println!("Proving merkle22_{}...", el);

        let wasm_path = format!("/Users/tsv/Developer/circuit-template/build/merkle22_{}/merkle22_{}_js/merkle22_{}.wasm", el, el, el);
        let zk_bytes: &[u8] = ZK_BYTES[i];
        let inputs = vec![merkle_tree_inputs(); i+1];
        let proof_inputs = prepare_inputs(&inputs, zk_bytes, &wasm_path);
        let proof_outputs = prove(&proof_inputs);
        println!("Verifying merkle22_{}...", el);
        let verified = verify(&proof_inputs, &proof_outputs);
        assert!(verified);
    }
}
