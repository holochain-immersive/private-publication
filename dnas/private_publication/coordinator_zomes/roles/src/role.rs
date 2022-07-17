use hdk::prelude::*;
use roles_integrity::Role;
use roles_integrity::EntryTypes;

#[hdk_extern]
pub fn get_role(entry_hash: EntryHash) -> ExternResult<Option<Role>> {
  let maybe_element = get(entry_hash, GetOptions::default())?;

  match maybe_element {
    None => Ok(None),
    Some(record) => {
      let role: Role = record.entry()
        .to_app_option()
        .map_err(|error| wasm_error!(WasmErrorInner::Guest(format!("Could not deserialize Record to Role: {}", error))))?
        .ok_or(wasm_error!(WasmErrorInner::Guest("No Role found for the given hash.".into())))?;

      Ok(Some(role))
    }
  }
}


#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewRoleOutput {
  action_hash: ActionHash,
  entry_hash: EntryHash,
}

#[hdk_extern]
pub fn create_role(role: Role) -> ExternResult<NewRoleOutput> {
  let action_hash = create_entry(&EntryTypes::Role(role.clone()))?;

  let entry_hash = hash_entry(&EntryTypes::Role(role))?;

  let output = NewRoleOutput {
    action_hash,
    entry_hash
  };

  Ok(output)
}



