use hdk::prelude::*;
use profiles_integrity::Profile;
use profiles_integrity::EntryTypes;

#[hdk_extern]
pub fn get_profile(entry_hash: EntryHash) -> ExternResult<Option<Profile>> {
  let maybe_element = get(entry_hash, GetOptions::default())?;

  match maybe_element {
    None => Ok(None),
    Some(record) => {
      let profile: Profile = record.entry()
        .to_app_option()
        .map_err(|error| wasm_error!(WasmErrorInner::Guest(format!("Could not deserialize Record to Profile: {}", error))))?
        .ok_or(wasm_error!(WasmErrorInner::Guest("No Profile found for the given hash.".into())))?;

      Ok(Some(profile))
    }
  }
}


#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewProfileOutput {
  action_hash: ActionHash,
  entry_hash: EntryHash,
}

#[hdk_extern]
pub fn create_profile(profile: Profile) -> ExternResult<NewProfileOutput> {
  let action_hash = create_entry(&EntryTypes::Profile(profile.clone()))?;

  let entry_hash = hash_entry(&EntryTypes::Profile(profile))?;

  let output = NewProfileOutput {
    action_hash,
    entry_hash
  };

  Ok(output)
}



