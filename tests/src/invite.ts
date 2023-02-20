import { pause, runScenario, CallableCell } from "@holochain/tryorama";
import { encode } from "@msgpack/msgpack";
import pkg from "tape-promise/tape";
const { test } = pkg;

import { installApp, privatePublicationApp } from "./utils";
import { Base64 } from "js-base64";

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

        await aliceConductor.appWs().createCloneCell({
          app_id: "private_publication",
          role_name: "private_publication",
          modifiers: {
            network_seed: "test",
            properties: {
              progenitor: serializeHash(alice.agentPubKey),
            },
          },
        });

        // Shortcut peer discovery through gossip and register all agents in every
        // conductor of the scenario.
        await scenario.shareAllAgents();

        const aliceLobby = alice.namedCells.get("lobby")!;
        const bobLobby = bob.namedCells.get("lobby")!;

        await aliceLobby.callZome({
          fn_name: "create_membrane_proof_for",
          payload: bob.agentPubKey,
          provenance: alice.agentPubKey,
          zome_name: "private_publication_lobby",
        });
        t.ok(true);

        if (isExercise && stepNum === 1) return;

        await pause(100);

        const membraneProof = await bobLobby.callZome({
          fn_name: "get_my_membrane_proof",
          payload: null,
          provenance: bob.agentPubKey,
          zome_name: "private_publication_lobby",
        });
        t.ok(membraneProof);

        try {
          await bobConductor.appWs().createCloneCell({
            app_id: "private_publication",
            role_name: "private_publication",
            modifiers: {
              properties: {
                progenitor: serializeHash(alice.agentPubKey),
              },
            },
            membrane_proof: Buffer.from(encode(membraneProof)),
          });
          t.ok(true);
        } catch (e) {
          t.ok(
            false,
            "An agent that has been given a membrane proof should be able to enter the private publications DNA"
          );
          throw e;
        }

        if (isExercise && stepNum === 2) return;

        const progenitor = await aliceConductor.appAgentWs().callZome({
          role_name: "private_publication.0",
          fn_name: "progenitor",
          payload: null,
          zome_name: "private_publication",
        });
        t.deepEqual(progenitor, alice.agentPubKey);

        if (isExercise && stepNum === 3) return;

        try {
          await carolConductor.appWs().createCloneCell({
            app_id: "private_publication",
            role_name: "private_publication",
            modifiers: {
              properties: {
                progenitor: serializeHash(alice.agentPubKey),
              },
            },
          });
          t.ok(
            false,
            "An agent other than the progenitor shouldn't be able to install the private_publication cell"
          );
        } catch (e) {
          console.log(e);
          t.ok(true);
        }

        try {
          await carolConductor.appWs().createCloneCell({
            app_id: "private_publication",
            role_name: "private_publication",
            modifiers: {
              properties: {
                progenitor: serializeHash(alice.agentPubKey),
              },
            },
            membrane_proof: Buffer.from(encode(membraneProof)),
          });
          t.ok(
            false,
            "An agent other than the progenitor shouldn't be able to install the private_publication cell"
          );
        } catch (e) {
          t.ok(true);
        }
        if (isExercise && stepNum === 4) return;

        if (isExercise && stepNum === 5) {
          await aliceConductor.appAgentWs().callZome({
            role_name: "private_publication.0",
            fn_name: "assign_editor_role",
            payload: bob.agentPubKey,
            provenance: alice.agentPubKey,
            zome_name: "roles",
          });
          await bobConductor.appAgentWs().callZome({
            role_name: "private_publication.0",
            fn_name: "assign_editor_role",
            payload: alice.agentPubKey,
            provenance: bob.agentPubKey,
            zome_name: "roles",
          });
          return;
        }

        if (isExercise && stepNum == 6) {
          await aliceConductor.appAgentWs().callZome({
            role_name: "private_publication.0",
            fn_name: "assign_editor_role",
            payload: bob.agentPubKey,
            provenance: alice.agentPubKey,
            zome_name: "roles",
          });
          try {
            await bobConductor.appAgentWs().callZome({
              role_name: "private_publication.0",
              fn_name: "assign_editor_role",
              payload: alice.agentPubKey,
              provenance: bob.agentPubKey,
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
          await bobConductor.appAgentWs().callZome({
            role_name: "private_publication.0",
            fn_name: "create_post",
            payload: {
              title: "hello",
              content: "hi",
            },
            provenance: bob.agentPubKey,
            zome_name: "posts",
          });
          t.ok(
            false,
            "An agent that hasn't been granted the editor role shouldn't be able to create posts"
          );
        } catch (e) {
          t.ok(true);
        }

        await aliceConductor.appAgentWs().callZome({
          role_name: "private_publication.0",
          fn_name: "assign_editor_role",
          payload: bob.agentPubKey,
          provenance: alice.agentPubKey,
          zome_name: "roles",
        });

        await bobConductor.appAgentWs().callZome({
          role_name: "private_publication.0",
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          provenance: bob.agentPubKey,
          zome_name: "posts",
        });

        if (isExercise && stepNum === 7) return;

        const bobsPostHash = await bobConductor.appAgentWs().callZome({
          role_name: "private_publication.0",
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          provenance: bob.agentPubKey,
          zome_name: "posts",
        });

        const alicesPostHash = await aliceConductor.appAgentWs().callZome({
          role_name: "private_publication.0",
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          provenance: alice.agentPubKey,
          zome_name: "posts",
        });

        try {
          await aliceConductor.appAgentWs().callZome({
            role_name: "private_publication.0",
            fn_name: "update_post",
            payload: {
              post_to_update: bobsPostHash,
              updated_post: {
                title: "asdf",
                content: "yes!",
              },
            },
            provenance: alice.agentPubKey,
            zome_name: "posts",
          });
          await bobConductor.appAgentWs().callZome({
            role_name: "private_publication.0",
            fn_name: "update_post",
            payload: {
              post_to_update: alicesPostHash,
              updated_post: {
                title: "asdf",
                content: "yes!",
              },
            },
            provenance: bob.agentPubKey,
            zome_name: "posts",
          });
          t.ok(
            false,
            "An agent that's not the author of a post shouldn't be able to update it"
          );
        } catch (e) {
          t.ok(true);
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
