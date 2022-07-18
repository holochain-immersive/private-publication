use hdk::prelude::*;
use private_publication_integrity::{EntryTypes, LinkTypes, Post};

#[hdk_extern]
pub fn get_all_posts(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_posts");

    let links = get_links(path.path_entry_hash()?, LinkTypes::PathToPost, None)?;

    let records = links
        .into_iter()
        .map(|link| get_post(ActionHash::from(link.target)))
        .collect::<ExternResult<Vec<Record>>>()?;

    Ok(records)
}

#[hdk_extern]
pub fn create_post(post: Post) -> ExternResult<ActionHash> {
    let action_hash = create_entry(EntryTypes::Post(post))?;

    let path = Path::from("all_posts");

    create_link(
        path.path_entry_hash()?,
        action_hash.clone(),
        LinkTypes::PathToPost,
        (),
    )?;

    Ok(action_hash)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdatePostInput {
    post_to_update: ActionHash,
    updated_post: Post,
}

// Updates the original_action_hash post with the given contents
#[hdk_extern]
pub fn update_post(input: UpdatePostInput) -> ExternResult<ActionHash> {
    update_entry(input.post_to_update, &input.updated_post)
}

// Get the latest post content from its original header hash
#[hdk_extern]
pub fn get_post(action_hash: ActionHash) -> ExternResult<Record> {
    let element = get_latest_post(action_hash)?;

    Ok(element)
}

fn get_latest_post(action_hash: ActionHash) -> ExternResult<Record> {
    let details = get_details(action_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Post not found".into())))?;

    match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(element_details) => match element_details.updates.last() {
            Some(update) => get_latest_post(update.action_address().clone()),
            None => Ok(element_details.record),
        },
    }
}
