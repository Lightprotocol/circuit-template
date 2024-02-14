#!/bin/bash
# Create an array with the directories
#dirs=(merkle22_{1..4} merkle22_10)
dirs=(merkle22_1 merkle22_2 merkle22_3 merkle22_4 merkle22_8)

# Iterate over the array
for dir in "${dirs[@]}"; do
    # Run the ls command for files in each directory
    # echo "Listing files under directory: build/$dir"
    ls -lah build/$dir/circuit.zkey
    ls -lah build/$dir/${dir}_js/$dir.wasm
    size_zk=$(du -s build/$dir/circuit.zkey | cut -f1)
    size_wasm=$(du -s build/$dir/${dir}_js/$dir.wasm | cut -f1)
    total_size_zkey=$((total_size_zkey + size_zk))
    total_size_wasm=$((total_size_wasm + size_wasm))
done

total_size_wasm=$((total_size_wasm/1024))
total_size_zkey=$((total_size_zkey/1024))

echo "Total size of zk files: $total_size_zkey MB"
echo "Total size of wasm files: $total_size_wasm MB"
