use hdi::prelude::*;
use membrane_proof::PrivatePublicationMembraneProof;
use std::sync::Arc;

// Uncomment this line
// use crate::properties::progenitor;

/**
 * Add your edits to the bottom of this file
 */

pub fn is_membrane_proof_valid(
    for_agent: AgentPubKey,
    membrane_proof: Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
