use std::collections::HashMap;
use std::io::Cursor;
use std::time::Instant;
use ark_bn254::Bn254;
use ark_circom::circom::Inputs;
use ark_circom::{CircomReduction, read_zkey, WitnessCalculator};
use ark_groth16::Groth16;
use ark_std::rand::thread_rng;
use ark_std::Zero;
use light_hasher::{Hasher, Poseidon};
use light_merkle_tree_reference::MerkleTree;
use num_bigint::{BigInt, Sign};

pub struct MerkleTreeProofInputs {
    root: BigInt,
    leaf: BigInt,
    in_path_indices: BigInt,
    in_path_elements: Vec<BigInt>,
}

pub fn proof(proof_inputs: MerkleTreeProofInputs, zkey: &[u8], wasm_path: &str) {
    println!("loading zkey file...");
    let mut start = Instant::now();
    let mut cursor = Cursor::new(zkey);
    let (params, matrices) = read_zkey(&mut cursor).unwrap();
    let mut duration = start.elapsed();
    println!("zkey loaded: {:?}", duration);

    let num_inputs = matrices.num_instance_variables;
    let num_constraints = matrices.num_constraints;

    println!("num_inputs={}", num_inputs);
    println!("num_constraints={}", num_constraints);

    let inputs = {
        let mut inputs: HashMap<String, Inputs> = HashMap::new();
        inputs.entry("root".to_string()).or_insert_with(|| Inputs::BigInt(proof_inputs.root));
        inputs.entry("leaf".to_string()).or_insert_with(|| Inputs::BigInt(proof_inputs.leaf));
        inputs.entry("inPathIndices".to_string()).or_insert_with(|| Inputs::BigInt(proof_inputs.in_path_indices));
        inputs.entry("inPathElements".to_string()).or_insert_with(|| Inputs::BigIntVec(proof_inputs.in_path_elements));
        inputs
    };

    println!("generating witness...");
    start = Instant::now();
    let mut wtns = WitnessCalculator::new(wasm_path).unwrap();

    let full_assignment = wtns
        .calculate_witness_element::<Bn254, _>(
            inputs,
            false,
        )
        .unwrap();
    duration = start.elapsed();
    println!("witness generated: {:?}", duration);

    println!("creating proof...");
    start = Instant::now();
    let mut rng = thread_rng();
    use ark_std::UniformRand;
    let rng = &mut rng;

    let r = ark_bn254::Fr::rand(rng);
    let s = ark_bn254::Fr::rand(rng);

    let proof = Groth16::<Bn254, CircomReduction>::create_proof_with_reduction_and_matrices(
        &params,
        r,
        s,
        &matrices,
        num_inputs,
        num_constraints,
        full_assignment.as_slice(),
    )
        .unwrap();

    duration = start.elapsed();
    println!("proof created: {:?}", duration);
    println!("proof: {:?}", proof);
}

pub fn prepare_inputs() -> MerkleTreeProofInputs {
    const HEIGHT: usize = 22;
    const ROOTS: usize = 1;

    let mut merkle_tree = MerkleTree::<Poseidon, HEIGHT, ROOTS>::new().unwrap();

    let mut bn_1: [u8; 32] = [0; 32];
    bn_1[31] = 1;
    let leaf: [u8; 32] = Poseidon::hash(&bn_1).unwrap();
    merkle_tree.update(&leaf, 0).unwrap();
    let root1 = &merkle_tree.roots[1];

    print_node_info(&leaf, "hash_of_leaf");
    print_node_info(root1, "root1");

    let proof_of_leaf = merkle_tree.get_proof_of_leaf(0).map(|el| {
        BigInt::from_bytes_be(Sign::Plus, &el)
    });

    let leaf_bn = BigInt::from_bytes_be(Sign::Plus, &leaf);
    let root_bn = BigInt::from_bytes_be(Sign::Plus, root1);
    let in_path_indices = BigInt::zero();
    let in_path_elements = proof_of_leaf.to_vec();

    MerkleTreeProofInputs {
        leaf: leaf_bn,
        root: root_bn,
        in_path_indices,
        in_path_elements
    }
}

fn print_node_info(node: &[u8; 32], prefix: &str) {
    let node_int = BigInt::from_bytes_be(Sign::Plus, node);
    let node_str = node_int.to_str_radix(10);
    println!("{}: {}", prefix, node_str);
}