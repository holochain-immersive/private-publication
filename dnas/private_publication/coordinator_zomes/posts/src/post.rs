use hdk::prelude::*;
use posts_integrity::Post;
use posts_integrity::EntryTypes;

#[hdk_extern]
pub fn get_post(entry_hash: EntryHash) -> ExternResult<Option<Post>> {
  let maybe_element = get(entry_hash, GetOptions::default())?;

  match maybe_element {
    None => Ok(None),
    Some(record) => {
      let post: Post = record.entry()
        .to_app_option()
        .map_err(|error| wasm_error!(WasmErrorInner::Guest(format!("Could not deserialize Record to Post: {}", error))))?
        .ok_or(wasm_error!(WasmErrorInner::Guest("No Post found for the given hash.".into())))?;

      Ok(Some(post))
    }
  }
}


#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewPostOutput {
  action_hash: ActionHash,
  entry_hash: EntryHash,
}

#[hdk_extern]
pub fn create_post(post: Post) -> ExternResult<NewPostOutput> {
  let action_hash = create_entry(&EntryTypes::Post(post.clone()))?;

  let entry_hash = hash_entry(&EntryTypes::Post(post))?;

  let output = NewPostOutput {
    action_hash,
    entry_hash
  };

  Ok(output)
}


#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePostInput {
  original_action_hash: ActionHash,
  updated_post: Post
}

#[hdk_extern]
pub fn update_post(input: UpdatePostInput) -> ExternResult<NewPostOutput> {
  let action_hash = update_entry(input.original_action_hash, &input.updated_post)?;

  let entry_hash = hash_entry(&input.updated_post)?;

  let output = NewPostOutput {
    action_hash,
    entry_hash
  };

  Ok(output)
}


#[hdk_extern]
pub fn delete_post(action_hash: ActionHash) -> ExternResult<ActionHash> {
  delete_entry(action_hash)
}

