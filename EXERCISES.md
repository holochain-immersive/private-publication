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
- Create an extern function that returns the progenitor for this DNA.
  - Get the serialized properties with `dna_info()?.properties`.
  - Transform that serialized properties type into our `Properties` struct.

2. Create a function `request_read_all_posts` that doesn't receive any input, and makes a bridge call to the cell with role id `private_publication`, zome name `posts`, and function name `get_all_posts`, and just returns its contents.

3. Create a function `grant_capability_to_read` that receives an `AgentPubKey` struct, generates a capability secret with `random_bytes()`, and grants capability to call `request_read_all_posts` to the given agent.

4. Create a function `store_capability_claim` that receives an `CapSecret`, and stores a capability claim with that secret, the progenitor agent as the grantor.


5. Create a function `read_all_posts` that doesn't receive any input, and returns a `Vec<Record>`:

- Query the source chain to get the capability claim.
- Call remote to the progenitor agent's `request_read_all_posts`.
- Return the result.


## Exercise 2: Validation Rules

TBD