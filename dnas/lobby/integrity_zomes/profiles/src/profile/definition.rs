use hdi::prelude::*;



#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Profile {
  pub nickname: String,
}