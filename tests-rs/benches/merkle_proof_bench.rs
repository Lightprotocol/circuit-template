
use ark_bn254::Bn254;
use ark_circom::{CircomBuilder, CircomConfig};
use ark_circom::circom::Inputs;
use ark_std::rand::thread_rng;
use criterion::{Criterion, criterion_group, criterion_main};
use num_bigint::BigInt;
use std::str::FromStr;
use ark_crypto_primitives::snark::SNARK;
use ark_groth16::Groth16;

type GrothBn = Groth16<Bn254>;

struct MerkleInputs {
    root: BigInt,
    leaf: BigInt,
    in_path_indices: BigInt,
    in_path_elements: Vec<BigInt>,
}

pub fn groth16_merkle_proof_bench_22(c: &mut Criterion) {
    let MERKLE_INPUTS_22: MerkleInputs = MerkleInputs {
        root: BigInt::from_str("18475809180757524180094921250867816994543302831149038483389836765641083762504").unwrap(),
        leaf: BigInt::from_str("18586133768512220936620570745912940619677854269274689475585506675881198879027").unwrap(),
        in_path_indices: BigInt::from_str("0").unwrap(),
        in_path_elements: vec![
            BigInt::from_str("14522046728041339886521211779101644712859239303505368468566383402165481390632").unwrap(),
            BigInt::from_str("12399300409582020702502593817695692114365413884629119646752088755594619792099").unwrap(),
            BigInt::from_str("8395588225108361090185968542078819429341401311717556516132539162074718138649").unwrap(),
            BigInt::from_str("4057071915828907980454096850543815456027107468656377022048087951790606859731").unwrap(),
            BigInt::from_str("3743829818366380567407337724304774110038336483209304727156632173911629434824").unwrap(),
            BigInt::from_str("3362607757998999405075010522526038738464692355542244039606578632265293250219").unwrap(),
            BigInt::from_str("20015677184605935901566129770286979413240288709932102066659093803039610261051").unwrap(),
            BigInt::from_str("10225829025262222227965488453946459886073285580405166440845039886823254154094").unwrap(),
            BigInt::from_str("5686141661288164258066217031114275192545956158151639326748108608664284882706").unwrap(),
            BigInt::from_str("13358779464535584487091704300380764321480804571869571342660527049603988848871").unwrap(),
            BigInt::from_str("20788849673815300643597200320095485951460468959391698802255261673230371848899").unwrap(),
            BigInt::from_str("18755746780925592439082197927133359790105305834996978755923950077317381403267").unwrap(),
            BigInt::from_str("10861549147121384785495888967464291400837754556942768811917754795517438910238").unwrap(),
            BigInt::from_str("7537538922575546318235739307792157434585071385790082150452199061048979169447").unwrap(),
            BigInt::from_str("19170203992070410766412159884086833170469632707946611516547317398966021022253").unwrap(),
            BigInt::from_str("9623414539891033920851862231973763647444234218922568879041788217598068601671").unwrap(),
            BigInt::from_str("3060533073600086539557684568063736193011911125938770961176821146879145827363").unwrap(),
            BigInt::from_str("138878455357257924790066769656582592677416924479878379980482552822708744793").unwrap(),
            BigInt::from_str("15800883723037093133305280672853871715176051618981698111580373208012928757479").unwrap(),
            BigInt::from_str("9637860505097446354938615465189848881949005695944686439357073260024670396314").unwrap(),
            BigInt::from_str("4230405496594752177767097648850446961113946544270644047257607903635152146286").unwrap(),
            BigInt::from_str("19628479516823977714752192155233860702021283416105762098991390975512642753356").unwrap(),
        ],
    };
    let WTNS_PATH = "../build/merkle22/circuit_js/merkle22.wasm";
    let R1CS_PATH = "../build/merkle22/merkle22.r1cs";

    let cfg = CircomConfig::<Bn254>::new(
        WTNS_PATH,
        R1CS_PATH,
    ).unwrap();
    println!("Witness generated.");
    println!("Generating the proof...");

    let mut builder = CircomBuilder::new(cfg);
    builder.push_input("root", Inputs::BigInt(MERKLE_INPUTS_22.root));
    builder.push_input("inPathElements", Inputs::BigIntVec(MERKLE_INPUTS_22.in_path_elements));
    builder.push_input("inPathIndices", Inputs::BigInt(MERKLE_INPUTS_22.in_path_indices));
    builder.push_input("leaf", Inputs::BigInt(MERKLE_INPUTS_22.leaf));

    let circom = builder.setup();

    let mut rng = thread_rng();
    let params = GrothBn::generate_random_parameters_with_reduction(circom, &mut rng).unwrap();

    let circom = builder.build().unwrap();
    let inputs = circom.get_public_inputs().unwrap();

    let proof = GrothBn::prove(&params, circom.clone(), &mut rng).unwrap();

    c.bench_function("prove", |b| b.iter(|| GrothBn::prove(&params, circom.clone(), &mut rng).unwrap()));
    let pvk = GrothBn::process_vk(&params.vk).unwrap();
    let verified = GrothBn::verify_with_processed_vk(&pvk, &inputs, &proof).unwrap();
    println!("Proof verified: {:?}", verified);
    assert!(verified);
}


pub fn groth16_merkle_proof_bench_30(c: &mut Criterion) {
    let MERKLE_INPUTS_30: MerkleInputs = MerkleInputs {
        root: BigInt::from_str("16155362655714532719199197748131979703883742326298770334973206815681668404150").unwrap(),
        leaf: BigInt::from_str("18586133768512220936620570745912940619677854269274689475585506675881198879027").unwrap(),
        in_path_indices: BigInt::from_str("0").unwrap(),
        in_path_elements: vec![
            BigInt::from_str("14522046728041339886521211779101644712859239303505368468566383402165481390632").unwrap(),
            BigInt::from_str("12399300409582020702502593817695692114365413884629119646752088755594619792099").unwrap(),
            BigInt::from_str("8395588225108361090185968542078819429341401311717556516132539162074718138649").unwrap(),
            BigInt::from_str("4057071915828907980454096850543815456027107468656377022048087951790606859731").unwrap(),
            BigInt::from_str("3743829818366380567407337724304774110038336483209304727156632173911629434824").unwrap(),
            BigInt::from_str("3362607757998999405075010522526038738464692355542244039606578632265293250219").unwrap(),
            BigInt::from_str("20015677184605935901566129770286979413240288709932102066659093803039610261051").unwrap(),
            BigInt::from_str("10225829025262222227965488453946459886073285580405166440845039886823254154094").unwrap(),
            BigInt::from_str("5686141661288164258066217031114275192545956158151639326748108608664284882706").unwrap(),
            BigInt::from_str("13358779464535584487091704300380764321480804571869571342660527049603988848871").unwrap(),
            BigInt::from_str("20788849673815300643597200320095485951460468959391698802255261673230371848899").unwrap(),
            BigInt::from_str("18755746780925592439082197927133359790105305834996978755923950077317381403267").unwrap(),
            BigInt::from_str("10861549147121384785495888967464291400837754556942768811917754795517438910238").unwrap(),
            BigInt::from_str("7537538922575546318235739307792157434585071385790082150452199061048979169447").unwrap(),
            BigInt::from_str("19170203992070410766412159884086833170469632707946611516547317398966021022253").unwrap(),
            BigInt::from_str("9623414539891033920851862231973763647444234218922568879041788217598068601671").unwrap(),
            BigInt::from_str("3060533073600086539557684568063736193011911125938770961176821146879145827363").unwrap(),
            BigInt::from_str("138878455357257924790066769656582592677416924479878379980482552822708744793").unwrap(),
            BigInt::from_str("15800883723037093133305280672853871715176051618981698111580373208012928757479").unwrap(),
            BigInt::from_str("9637860505097446354938615465189848881949005695944686439357073260024670396314").unwrap(),
            BigInt::from_str("4230405496594752177767097648850446961113946544270644047257607903635152146286").unwrap(),
            BigInt::from_str("19628479516823977714752192155233860702021283416105762098991390975512642753356").unwrap(),
            BigInt::from_str("10752138434985301760908661169020382294921002953248926091133111238568141278402").unwrap(),
            BigInt::from_str("8832152504624700401449770057167890569321131921984669229014434815887358390937").unwrap(),
            BigInt::from_str("11347004614081717932944125175785689632220946418443796094366660816613526692072").unwrap(),
            BigInt::from_str("3051443875805177528988564130066437194733628010868431898106208700997051204511").unwrap(),
            BigInt::from_str("3280843894647711167665805442383284798908343826207825003222378769830753112564").unwrap(),
            BigInt::from_str("2885437127318082792676156679496224267537134149125889704006255090894418859184").unwrap(),
            BigInt::from_str("20997803921471190972687386845252368449417136221584210407219428552891406603152").unwrap(),
            BigInt::from_str("5526870653502991543758325832857419578849790775006776838934982108475732717180").unwrap(),
        ],
    };

    let WTNS_PATH = "../build/merkle22/circuit_js/merkle30.wasm";
    let R1CS_PATH = "../build/merkle22/merkle30.r1cs";

    let cfg = CircomConfig::<Bn254>::new(
        WTNS_PATH,
        R1CS_PATH,
    ).unwrap();

    let mut builder = CircomBuilder::new(cfg);
    builder.push_input("root", Inputs::BigInt(MERKLE_INPUTS_30.root));
    builder.push_input("inPathElements", Inputs::BigIntVec(MERKLE_INPUTS_30.in_path_elements));
    builder.push_input("inPathIndices", Inputs::BigInt(MERKLE_INPUTS_30.in_path_indices));
    builder.push_input("leaf", Inputs::BigInt(MERKLE_INPUTS_30.leaf));

    let circom = builder.setup();

    let mut rng = thread_rng();
    let params = GrothBn::generate_random_parameters_with_reduction(circom, &mut rng).unwrap();

    let circom = builder.build().unwrap();
    let inputs = circom.get_public_inputs().unwrap();

    let proof = GrothBn::prove(&params, circom.clone(), &mut rng).unwrap();
    c.bench_function("prove", |b| b.iter(|| GrothBn::prove(&params, circom.clone(), &mut rng).unwrap()));

    let pvk = GrothBn::process_vk(&params.vk).unwrap();
    let verified = GrothBn::verify_with_processed_vk(&pvk, &inputs, &proof).unwrap();
    println!("Proof verified: {:?}", verified);
    assert!(verified);
}


criterion_group!(benches, groth16_merkle_proof_bench_22, groth16_merkle_proof_bench_30);
criterion_main!(benches);
