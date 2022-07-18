use hdi::prelude::*;

use crate::membrane::is_membrane_proof_valid;
use crate::post::{validate_create_post, validate_update_post};
use crate::publication_role::validate_create_role;

pub use crate::post::Post;
pub use crate::publication_role::PublicationRole;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Post(Post),
    PublicationRole(PublicationRole),
}

#[hdk_link_types]
pub enum LinkTypes {
    PathToPost,
    PathToRole,
}

////////////////////////////////////////////////////////////////////////////////
// Genesis self-check callback
////////////////////////////////////////////////////////////////////////////////
#[hdk_extern]
pub fn genesis_self_check(data: GenesisSelfCheckData) -> ExternResult<ValidateCallbackResult> {
    is_membrane_proof_valid(data.agent_key, data.membrane_proof)
}

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op {
        // Validation for entries
        Op::StoreEntry {
            action:
                SignedHashed {
                    hashed:
                        HoloHashed {
                            content: action, ..
                        },
                    ..
                },
            entry,
        } => {
            if let Some(AppEntryType {
                id: entry_def_index,
                zome_id,
                ..
            }) = action.app_entry_type()
            {
                match EntryTypes::deserialize_from_type(*zome_id, *entry_def_index, &entry)? {
                    Some(EntryTypes::Post(post)) => validate_create_post(action),
                    Some(EntryTypes::PublicationRole(role)) => validate_create_role(action, entry),
                    None => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "expected app entry type, got none".to_string(),
                        ))
                    }
                }
            } else {
                return Ok(ValidateCallbackResult::Invalid(
                    "expected app entry type, got none".to_string(),
                ));
            }
        }
        Op::RegisterUpdate {
            update,
            new_entry,
            original_action,
            original_entry,
        } => {
            if let Some(AppEntryType {
                id: entry_def_index,
                zome_id,
                ..
            }) = EntryCreationAction::Update(update.hashed.content.clone()).app_entry_type()
            {
                match EntryTypes::deserialize_from_type(*zome_id, *entry_def_index, &new_entry)? {
                    Some(EntryTypes::Post(post)) => validate_update_post(
                        original_action,
                        original_entry,
                        update.hashed.content,
                        new_entry,
                    ),
                    Some(EntryTypes::PublicationRole(role)) => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "Roles cannot be updated".to_string(),
                        ))
                    }
                    None => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "expected app entry type, got none".to_string(),
                        ))
                    }
                }
            } else {
                return Ok(ValidateCallbackResult::Invalid(
                    "expected app entry type, got none".to_string(),
                ));
            }
        }

        Op::RegisterDelete {
            delete,
            original_action,
            original_entry,
        } => {
            if let Some(AppEntryType {
                id: entry_def_index,
                zome_id,
                ..
            }) = original_action.app_entry_type()
            {
                match EntryTypes::deserialize_from_type(
                    *zome_id,
                    *entry_def_index,
                    &original_entry,
                )? {
                    Some(EntryTypes::Post(post)) => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "Posts cannot be deleted".to_string(),
                        ))
                    }
                    Some(EntryTypes::PublicationRole(role)) => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "Roles cannot be deleted".to_string(),
                        ))
                    }
                    None => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "expected app entry type, got none".to_string(),
                        ))
                    }
                }
            } else {
                return Ok(ValidateCallbackResult::Invalid(
                    "expected app entry type, got none".to_string(),
                ));
            }
        }
        Op::StoreRecord { record } => match record.action() {
            Action::AgentValidationPkg(agent_validation_package) => is_membrane_proof_valid(
                record.action().author().clone(),
                agent_validation_package.membrane_proof.clone(),
            ),
            _ => Ok(ValidateCallbackResult::Valid),
        },
        _ => Ok(ValidateCallbackResult::Valid),
    }
}