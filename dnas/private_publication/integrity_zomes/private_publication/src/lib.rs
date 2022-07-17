use hdi::prelude::*;

#[hdk_entry_helper]
pub struct Post {
    pub title: String,
    pub content: String,
}

#[hdk_entry_helper]
pub struct Role {
    pub role: String,
    pub assignee: AgentPubKey,
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Post(Post),
}

////////////////////////////////////////////////////////////////////////////////
// Genesis self-check callback
////////////////////////////////////////////////////////////////////////////////

#[hdk_extern]
pub fn genesis_self_check(data: GenesisSelfCheckData) ->  ExternResult<ValidateCallbackResult> {
    // TODO
    // check data.dna_def
    // check data.membrane_proof
    // check data.agent_key
    Ok(ValidateCallbackResult::Valid)
}

#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
