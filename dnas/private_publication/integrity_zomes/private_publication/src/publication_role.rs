use crate::properties::progenitor;
use hdi::prelude::*;

#[hdk_entry_helper]
pub struct PublicationRole {
    pub role: String,
    pub assignee: AgentPubKey,
}

pub fn validate_create_role(
    action: EntryCreationAction,
    role_entry: Entry,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
