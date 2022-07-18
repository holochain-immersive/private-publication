use hdi::prelude::*;
use crate::{properties::progenitor, *};

#[hdk_entry_helper]
pub struct Post {
    pub title: String,
    pub content: String,
}

pub fn validate_create_post(action: EntryCreationAction) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_update_post(
    original_action: EntryCreationAction,
    original_entry: Entry,
    action: Update,
    new_entry: Entry,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
