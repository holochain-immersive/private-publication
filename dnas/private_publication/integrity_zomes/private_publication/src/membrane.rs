use std::sync::Arc;

use hdi::prelude::*;
use membrane_proof::PrivatePublicationMembraneProof;

use crate::properties::progenitor;

pub fn is_membrane_proof_valid(
    for_agent: AgentPubKey,
    membrane_proof: Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
  Ok(ValidateCallbackResult::Valid)
}