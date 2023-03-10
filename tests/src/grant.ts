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

        console.log(
          "Private Publication - Exercise 2: Alice, Bob and Carol install the private publication app"
        );

        const alicePrivatePublicationCell = await aliceConductor
          .appAgentWs()
          .createCloneCell({
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
          "Private Publication - Exercise 2: Alice tries to create a post in their private publication clone"
        );
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
          console.log(
            "Private Publication - Exercise 2: Bob tries read the posts for Alice's private publication clone"
          );
          const allPosts: any = await bobLobby.callZome({
            fn_name: "read_posts_for_author",
            payload: alice.agentPubKey,
            zome_name: "private_publication_lobby",
          });
          t.ok(false);
        } catch (e) {
          // Bob doesn't have permissions to read yet
        }
        console.log(
          "Private Publication - Exercise 2: Alice tries to create a capability grant to read their private publication posts to Bob"
        );

        const secret = await aliceLobby.callZome({
          fn_name: "grant_capability_to_read",
          payload: {
            reader: bob.agentPubKey,
            private_publication_dna_hash:
              alicePrivatePublicationCell.cell_id[0],
          },
          zome_name: "private_publication_lobby",
        });
        t.ok(
          true,
          "An author should be able to create capability grants to readers"
        );
        if (isExercise && stepNum === 1) return;
        console.log(
          "Private Publication - Exercise 2: Bob tries to store the capability secret with which Alice granted him capability to read the posts in their private publication"
        );

        await bobLobby.callZome({
          fn_name: "store_capability_claim",
          payload: { cap_secret: secret, author: alice.agentPubKey },
          zome_name: "private_publication_lobby",
        });
        t.ok(true);
        if (isExercise && stepNum === 2) return;

        if (isExercise && stepNum === 3) {
          try {
            console.log(
              "Private Publication - Exercise 2: Bob tries read the posts for Alice's private publication clone"
            );
            allPosts = await bobLobby.callZome({
              fn_name: "read_posts_for_author",
              payload: alice.agentPubKey,
              zome_name: "private_publication_lobby",
            });
            t.ok(false);
          } catch (e) {
            t.ok(
              JSON.stringify(e).includes("ZomeFnNotExists"),
              "read_posts_for_author should make a call_remote to `request_read_private_publication_posts` and return the error if ZomeCallResponse contains one"
            );
          }
        } else {
          console.log(
            "Private Publication - Exercise 2: Bob tries read the posts for Alice's private publication clone"
          );
          allPosts = await bobLobby.callZome({
            fn_name: "read_posts_for_author",
            payload: alice.agentPubKey,
            zome_name: "private_publication_lobby",
          });
          t.equal(allPosts.length, 1, "Bob is able to read Alice's posts");
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
