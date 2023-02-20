use hdi::prelude::{holo_hash::DnaHash, *};

#[hdk_entry_helper]
pub struct PrivatePublicationMembraneProof {
    pub recipient: AgentPubKey,
    pub dna_hash: DnaHash,
}
