# Exercises

You are going to re-implement this private publication happ, one exercise at a time. Every exercise has a series of steps, and in each step there will be some missing feature in the DNA code that you'll have to implement, and then run the tests to confirm that your solution is correct.

These are the instructions for the first step, amenable to all the other steps:

1. Run `EXERCISE=1 STEP=1 npm test`.

- This is the error message you should see:

```
# profiles zome: create profile and retrieve it
not ok 1 Error: There are no entries defined in the profiles zome
  ---
    operator: error
    at: bound (/home/guillem/projects/immersive/forum-happ/node_modules/tape-promise/node_modules/onetime/index.js:30:12)
    stack: |-
      Error: There are no entries defined in the profiles zome
          at file:///home/guillem/projects/immersive/forum-happ/tests/src/profile.ts:35:13
          at processTicksAndRejections (node:internal/process/task_queues:96:5)
          at async runScenario (file:///home/guillem/projects/immersive/forum-happ/node_modules/@holochain/tryorama/ts/src/local/scenario.ts:202:5)
  ...

1..1
# tests 1
# pass  0
# fail  1
```

2. Implement the missing function that that step requires (see step 1 in the "Exercise 1: Profiles zome" section of this document).
3. Run the tests again, until **all tests** pass again.
4. Move on to the next step, and run the new tests.

- Eg. for the second step, you should run `EXERCISE=1 STEP=2 npm test`.

5. When you are done with all the steps in an exercise, move to the next exercise (see step 1 in the "Exercise 2: Comments zome" of this document):

- Eg. for first step of the 2nd exercise, you should run `EXERCISE=2 STEP=1 npm test`.

## Exercise 1: Capability Tokens

In this setup, there are two DNAs:

- Lobby: everyone is able to join this DNA.
- Private publication: only the authors of the publication join this DNA.

We are going to create the zome for the lobby DNA, with this functionality:

- Grant permissions to read the private publication to an agent in the lobby.

Solve the next steps in the `private_publication_lobby` coordinator zome, in `dnas/lobby/coordinator_zomes/private_publication_lobby/src/lib.rs`.

1. Add a `Properties` struct, with only a `progenitor` field of type `AgentPubKeyB64`.

- Annotate this struct with `#[derive(Serialize, Deserialize, Debug, SerializedBytes)]`.
- Create an extern function `progenitor` that doesn't have any input parameters and that returns the `AgentPubKey` for the progenitor of this DNA.
  - Get the serialized properties with `dna_info()?.properties`.
  - Transform that serialized properties type into our `Properties` struct.

2. Create a function `request_read_all_posts` that doesn't receive any input, and makes a bridge call to the cell with role id `private_publication`, zome name `posts`, and function name `get_all_posts`, and just returns its contents.

3. Create a function `grant_capability_to_read` that receives an `AgentPubKey` struct, generates a capability secret with `random_bytes()`, grants capability to call `request_read_all_posts` to the given agent, and returns the `CapSecret` that was generated.

4. Create a function `store_capability_claim` that receives an `CapSecret`, and stores a capability claim with that secret, the progenitor agent as the grantor.


5. Create a function `read_all_posts` that doesn't receive any input, and returns a `Vec<Record>`:

- Query the source chain to get the capability claim.
- Call remote to the progenitor agent's `request_read_all_posts`.
- Return the result.


## Exercise 2: Validation Rules

We are going to implement these new functionalities:

- As the progenitor of the private publication, I should be able to invite other agents into the private publication DNA.
- As the progenitor of the private publication, only I should be able to assign the editor role to agents in the private publication DNA.
- Only agents with the editor role should be able to create posts in the private publication DNA.
- Only the creator of a post should be able to update it.

Go into `dnas/lobby/coordinator_zomes/private_publication_lobby/src/lib.rs`:

1. Create a  `create_membrane_proof_for` zome function that receives an `AgentPubKey` and returns no output. This function will be executed by the progenitor of the app.
   - Does a bridge call to the `get_dna_hash` of the `posts` zome of the `private_publication` DNA, without passing any arguments. That function is already defined and returns a `DnaHash`.
   - Create a `PrivatePublicationMembraneProof` entry with the private publication DNA hash and the recipient for that membrane. 
   - Create a link from the agent public key of the recipient to the newly created action.
2. Create a `get_my_membrane` zome function that doesn't receive any parameters, and returns an `Option<Record>`.
   - Get the links from your public key of type `LinkTypes::AgentToMembraneProof`.
   - If there is some link, return the record that the target is pointing to.

Now go into `dnas/private_publication/integrity_zomes/private_publication/src/validation.rs`. There you can see boilerplate that allows for the genesis self-check and for different validations for the two kinds of entries present in that DNA.

Go into `dnas/private_publication/integrity_zomes/private_publication/src/membrane.rs`. 

3. Implement the membrane proof check to avoid unwanted agents coming into the DHT:
    - If the agent we are validating for is the progenitor, then the membrane proof check is valid.
    - If not, serialize the membrane proof into a `Record`.
    - Check that the author of the action in the record is the progenitor.
    - Check that the signature in the Record is valid for the `record.action_hashed().content()` of the record.
    - Serialize the record's entry into a `PrivatePublicationMembraneProof`.
    - Check that the dna hash inside the `PrivatePublicationMembraneProof` is equal to the dna hash of the `private_publication` DNA.
    - Check that the agent we are checking the membrane for is the agent that is inside the `PrivatePublicationMembraneProof`.

Go into `dnas/private_publication/coordinator_zomes/roles/src/lib.rs`. 

4. Create an `assign_editor_role` function that takes an `AgentPubKey`, and creates a `PublicationRole` entry with role equal to `String::from("editor")`.

Go into `dnas/private_publication/integrity_zomes/private_publication/src/publication_role.rs`. 

5. Implement the `validate_create_role`, only allowing the progenitor to create the `PublicationRole` entry.

Go into `dnas/private_publication/integrity_zomes/private_publication/src/post.rs`. 

6. Implement the `validate_create_post` function so that only agents for which a `PublicationRole` with role "editor" has been created can create posts.

7. Implement the `validate_update_post` function so that only the original author of the post can modify their posts.

