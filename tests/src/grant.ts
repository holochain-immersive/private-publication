import { pause, runScenario } from "@holochain/tryorama";
import pkg from "tape-promise/tape";
const { test } = pkg;
import { ActionHash } from "@holochain/client";

import { Base64 } from "js-base64";
import { installApp, privatePublicationApp } from "./utils";

export function deserializeHash(hash: string): Uint8Array {
  return Base64.toUint8Array(hash.slice(1));
}

export function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

const isExercise = process.env["EXERCISE"] === "1";
const stepNum = isExercise && parseInt(process.env["STEP"] as string);

export default () =>
  test("Grant capability", async (t) => {
    try {
      await runScenario(async (scenario) => {
        const [aliceConductor, alice] = await installApp(scenario);
        const [bobConductor, bob] = await installApp(scenario);

        const alicePrivatePublicationCell = await aliceConductor.appAgentWs().createCloneCell({
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

        await aliceConductor.appAgentWs().callZome({
          role_name: "private_publication.0",
          fn_name: "create_post",
          payload: {
            title: "Post 1",
            content: "Posts post",
          },
          zome_name: "posts",
        });

        let allPosts: Array<ActionHash>;

        try {
          const allPosts: any = await bobLobby.callZome({
            fn_name: "read_posts_for_author",
            payload: alice.agentPubKey,
            zome_name: "private_publication_lobby",
          });
          t.ok(false);
        } catch (e) {
          t.ok(true);
        }

        const secret = await aliceLobby.callZome({
          fn_name: "grant_capability_to_read",
          payload: {
            reader: bob.agentPubKey,
            private_publication_dna_hash: alicePrivatePublicationCell.cell_id[0]
          },
          zome_name: "private_publication_lobby",
        });
        if (isExercise && stepNum === 1) return;

        await bobLobby.callZome({
          fn_name: "store_capability_claim",
          payload: { cap_secret: secret, grantor: alice.agentPubKey },
          zome_name: "private_publication_lobby",
        });
        if (isExercise && stepNum === 2) return;

        if (isExercise && stepNum === 3) {
          try {
            allPosts = await bobLobby.callZome({
              fn_name: "read_posts_for_author",
              payload: alice.agentPubKey,
              zome_name: "private_publication_lobby",
            });
            t.ok(false);
          } catch (e) {
            t.ok(JSON.stringify(e).includes('zome function not found'), 'read_posts_for_author should make a call_remote to `request_read_private_publication_posts` ')
          }
        } else {
        
          allPosts = await bobLobby.callZome({
            fn_name: "read_posts_for_author",
            payload: alice.agentPubKey,
            zome_name: "private_publication_lobby",
          });
          t.equal(allPosts.length, 1);
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
