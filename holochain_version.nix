# This file was generated with the following command:
# update-holochain-versions --git-src=revision:375d68070f397c572fa2205fb889f117a7092e70 --lair-version-req=~0.2 --output-file=holochain_version.nix
# For usage instructions please visit https://github.com/holochain/holochain-nixpkgs/#readme

{
    url = "https://github.com/holochain/holochain";
    rev = "375d68070f397c572fa2205fb889f117a7092e70";
    sha256 = "sha256-14ABpgjpoUjQkaw9blv8NJrD5xu1YQd19tzQhvawiS4=";
    cargoLock = {
        outputHashes = {
        };
    };

    binsFilter = [
        "holochain"
        "hc"
        "kitsune-p2p-proxy"
        "kitsune-p2p-tx2-proxy"
    ];


    lair = {
        url = "https://github.com/holochain/lair";
        rev = "lair_keystore_api-v0.2.0";
        sha256 = "sha256-n7nZyZR0Q68Uff7bTSVFtSDLi21CNcyKibOBx55Gasg=";

        binsFilter = [
            "lair-keystore"
        ];


        cargoLock = {
            outputHashes = {
            };
        };
    };
}
