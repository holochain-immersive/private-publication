use hdi::prelude::{holo_hash::DnaHash, *};

#[derive(Clone)]
#[hdk_entry_helper]
pub struct PrivatePublicationMembraneProof {
    pub recipient: AgentPubKey,
    pub dna_hash: DnaHash,
}
