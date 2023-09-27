import { pause, runScenario, CallableCell } from "@holochain/tryorama";
import { Record } from "@holochain/client";
import { decode, encode } from "@msgpack/msgpack";
import pkg from "tape-promise/tape";
const { test } = pkg;

import { installApp, privatePublicationApp } from "./utils";
import { Base64 } from "js-base64";
import { cloneDeep } from "lodash-es";

export function deserializeHash(hash: string): Uint8Array {
  return Base64.toUint8Array(hash.slice(1));
}

export function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

const isExercise = process.env["EXERCISE"] === "2";
const stepNum = isExercise && parseInt(process.env["STEP"] as string);

export default () =>
  test("Invite agent to edit the publication", async (t) => {
    try {
      await runScenario(async (scenario) => {
        const [aliceConductor, alice] = await installApp(scenario);
        const [bobConductor, bob] = await installApp(scenario);
        const [carolConductor, carol] = await installApp(scenario);

        console.log(
          "Private Publication - Exercise 2: Alice, Bob and Carol install the private publication app"
        );

        const privatePublicationCell = await aliceConductor
          .appWs()
          .createCloneCell({
            app_id: "private_publication",
            role_name: "private_publication",
            modifiers: {
              network_seed: "test",
              properties: {
                progenitor: serializeHash(alice.agentPubKey),
              },
            },
          });

        console.log(
          "Private Publication - Exercise 2: Alice creates a cloned cell of the 'private_publication' Dna, with its own public key as the 'progenitor' field in the properties"
        );

        // Shortcut peer discovery through gossip and register all agents in every
        // conductor of the scenario.
        await scenario.shareAllAgents();

        const aliceLobby = alice.namedCells.get("lobby")!;
        const bobLobby = bob.namedCells.get("lobby")!;

        console.log(
          "Private Publication - Exercise 2: Alice tries to create a membrane proof for Bob"
        );
        const membraneProofEntry = {
          recipient: bob.agentPubKey,
          dna_hash: privatePublicationCell.cell_id[0],
        };
        await aliceLobby.callZome({
          fn_name: "create_membrane_proof_for",
          payload: membraneProofEntry,
          provenance: alice.agentPubKey,
          zome_name: "private_publication_lobby",
        });
        t.ok(
          true,
          "Alice as the progenitor should be able to create membrane proofs for their private publication clone"
        );

        if (isExercise && stepNum === 1) return;

        await pause(1000);
        console.log(
          "Private Publication - Exercise 2: Bob tries get their own membrane proof"
        );

        const membraneProof: Record | undefined = await bobLobby.callZome({
          fn_name: "get_my_membrane_proof",
          payload: null,
          provenance: bob.agentPubKey,
          zome_name: "private_publication_lobby",
        });
        t.ok(
          membraneProof,
          "get_my_membrane_proof should return a Record, but undefined was returned"
        );
        t.deepEqual(
          decode((membraneProof as any).entry.Present.entry),
          membraneProofEntry,
          "the record returned by get_my_membrane_proof does not match the membrane proof that Alice created"
        );

        let bobsPrivatePublicationCellId;
        try {
          console.log(
            "Private Publication - Exercise 2: Bob tries to join Alice's private_publication clone using the membrane proof that Alice created"
          );
          const cloneCell = await bobConductor.appWs().createCloneCell({
            app_id: "private_publication",
            role_name: "private_publication",
            modifiers: {
              network_seed: "test",
              properties: {
                progenitor: serializeHash(alice.agentPubKey),
              },
            },
            membrane_proof: Buffer.from(encode(membraneProof)),
          });
          bobsPrivatePublicationCellId = cloneCell.cell_id;
          t.ok(true);
        } catch (e) {
          console.log(e);
          t.ok(
            false,
            "An agent that has been given a membrane proof should be able to enter the private publications DNA"
          );
          throw e;
        }

        if (isExercise && stepNum === 2) return;
        console.log(
          "Private Publication - Exercise 2: Alice tries to get the progenitor's public key for their private_publication clone"
        );

        const progenitor = await aliceConductor.appAgentWs().callZome({
          cell_id: privatePublicationCell.cell_id,
          fn_name: "progenitor",
          payload: null,
          zome_name: "private_publication_integrity",
        });
        t.deepEqual(progenitor, alice.agentPubKey);

        if (isExercise && stepNum === 3) return;

        try {
          console.log(
            "Private Publication - Exercise 2: Carol tries to join Alice's private_publication clone without providing any membrane proof"
          );
          await carolConductor.appWs().createCloneCell({
            app_id: "private_publication",
            role_name: "private_publication",
            modifiers: {
              network_seed: "test",
              properties: {
                progenitor: serializeHash(alice.agentPubKey),
              },
            },
          });
          t.ok(
            false,
            "An agent that doesn't provide a membrane proof shouldn't be able to install the private_publication cell"
          );
        } catch (e) {
          t.ok(true);
        }

        try {
          console.log(
            "Private Publication - Exercise 2: Carol tries to join Alice's private_publication clone without providing any membrane proof"
          );
          await carolConductor.appWs().createCloneCell({
            app_id: "private_publication",
            role_name: "private_publication",
            modifiers: {
              network_seed: "test",
              properties: {
                progenitor: serializeHash(alice.agentPubKey),
              },
            },
            membrane_proof: Buffer.from(encode(membraneProof)),
          });
          t.ok(
            false,
            "An agent that hasn't been invited by the progenitor shouldn't be able to install the private_publication cell"
          );
        } catch (e) {
          try {
            console.log(
              "Private Publication - Exercise 2: Carol tries to join Alice's private_publication clone with Bob's the membrane proof, but tampering with it and substituting Bob's public key in the recipient field with Carol's public key"
            );
            const tamperedMembraneProof = cloneDeep(membraneProof!);
            const tamperedMembraneProofEntry = {
              recipient: carol.agentPubKey,
              dna_hash: privatePublicationCell.cell_id[0],
            };

            tamperedMembraneProof.entry = {
              Present: {
                entry_type: "App",
                entry: encode(tamperedMembraneProofEntry),
              },
            };
            await carolConductor.appWs().createCloneCell({
              app_id: "private_publication",
              role_name: "private_publication",
              modifiers: {
                network_seed: "test",
                properties: {
                  progenitor: serializeHash(alice.agentPubKey),
                },
              },
              membrane_proof: Buffer.from(encode(membraneProof)),
            });
            t.ok(
              false,
              "An attacker that tries to tamper the membrane proof entry shouldn't be able to install the Dna"
            );
          } catch (e) {
            t.ok(true);
          }
        }
        if (isExercise && stepNum === 4) return;

        if (isExercise && stepNum === 5) {
          console.log(
            "Private Publication - Exercise 2: Alice tries to assign the editor role to Bob in Alice's private publication clone"
          );
          await aliceConductor.appAgentWs().callZome({
            cell_id: privatePublicationCell.cell_id,
            fn_name: "assign_editor_role",
            payload: bob.agentPubKey,
            zome_name: "roles",
          });
          console.log(
            "Private Publication - Exercise 2: Bobe tries to assign the editor role to Alice in Alice's private publication clone"
          );
          await bobConductor.appAgentWs().callZome({
            cell_id: bobsPrivatePublicationCellId,
            fn_name: "assign_editor_role",
            payload: alice.agentPubKey,
            zome_name: "roles",
          });
          return;
        }

        if (isExercise && stepNum == 6) {
          console.log(
            "Private Publication - Exercise 2: Alice tries to assign the editor role to Bob in Alice's private publication clone"
          );
          await aliceConductor.appAgentWs().callZome({
            cell_id: privatePublicationCell.cell_id,
            fn_name: "assign_editor_role",
            payload: bob.agentPubKey,
            zome_name: "roles",
          });
          try {
            console.log(
              "Private Publication - Exercise 2: Bob tries to assign the editor role to Alice in Alice's private publication clone"
            );
            await bobConductor.appAgentWs().callZome({
              cell_id: bobsPrivatePublicationCellId,
              fn_name: "assign_editor_role",
              payload: alice.agentPubKey,
              zome_name: "roles",
            });
            t.ok(
              false,
              "An agent other than the progenitor should not be able to assign roles"
            );
          } catch (e) {
            t.ok(true);
          }
          return;
        }

        try {
          console.log(
            "Private Publication - Exercise 2: Bob tries to create a post in Alice's private publication clone"
          );
          await bobConductor.appAgentWs().callZome({
            cell_id: bobsPrivatePublicationCellId,
            fn_name: "create_post",
            payload: {
              title: "hello",
              content: "hi",
            },
            zome_name: "posts",
          });
          t.ok(
            false,
            "An agent that hasn't been granted the editor role shouldn't be able to create posts"
          );
        } catch (e) {
          t.ok(true);
        }

        console.log(
          "Private Publication - Exercise 2: Alice tries to assign the editor role to Bob in Alice's private publication clone"
        );
        await aliceConductor.appAgentWs().callZome({
          cell_id: privatePublicationCell.cell_id,
          fn_name: "assign_editor_role",
          payload: bob.agentPubKey,
          zome_name: "roles",
        });

        console.log(
          "Private Publication - Exercise 2: Bob tries to create a post in Alice's private publication clone"
        );
        const bobsPostHash = await bobConductor.appAgentWs().callZome({
          cell_id: bobsPrivatePublicationCellId,
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          zome_name: "posts",
        });
        if (isExercise && stepNum === 7) return;

        console.log(
          "Private Publication - Exercise 2: Alice tries to create a post in Alice's private publication clone"
        );
        const alicesPostHash = await aliceConductor.appAgentWs().callZome({
          cell_id: privatePublicationCell.cell_id,
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          zome_name: "posts",
        });

        await pause(2000);
        try {
          console.log(
            "Private Publication - Exercise 2: Alice tries to update Bob's post in Alice's private publication clone"
          );
          await aliceConductor.appAgentWs().callZome({
            cell_id: privatePublicationCell.cell_id,
            fn_name: "update_post",
            payload: {
              post_to_update: bobsPostHash,
              updated_post: {
                title: "asdf",
                content: "yes!",
              },
            },
            zome_name: "posts",
          });
          t.ok(
            false,
            "An agent that's not the author of a post shouldn't be able to update it"
          );
        } catch (e) {
          if (
            JSON.stringify(e).includes(
              "Source chain error: InvalidCommit error: Only the author of a post can update it"
            )
          ) {
            t.ok(true);
          } else {
            throw e;
          }
        }

        try {
          console.log(
            "Private Publication - Exercise 2: Bob tries to update Alice's post in Alice's private publication clone"
          );
          await bobConductor.appAgentWs().callZome({
            cell_id: bobsPrivatePublicationCellId,
            fn_name: "update_post",
            payload: {
              post_to_update: alicesPostHash,
              updated_post: {
                title: "asdf",
                content: "yes!",
              },
            },
            zome_name: "posts",
          });
          t.ok(
            false,
            "An agent that's not the author of a post shouldn't be able to update it"
          );
        } catch (e) {
          if (
            JSON.stringify(e).includes(
              "Source chain error: InvalidCommit error: Only the author of a post can update it"
            )
          ) {
            t.ok(true);
          } else {
            throw e;
          }
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
