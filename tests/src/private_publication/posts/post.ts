
import { DnaSource } from "@holochain/client";
import { pause, runScenario } from "@holochain/tryorama";
import pkg from 'tape-promise/tape';
const { test } = pkg;

import { privatePublicationDna } from  "../../utils";


export default () => test("post CRUD tests", async (t) => {
  await runScenario(async scenario => {

    const dnas: DnaSource[] = [{path: privatePublicationDna }];

    const [alice, bob]  = await scenario.addPlayersWithHapps([dnas, dnas]);

    await scenario.shareAllAgents();

    const createInput = {
  "title": "God up with",
  "content": "We gotta burn the rain forest, dump toxic waste, pollute the air, and rip up the OZONE! Man creates Dinosaurs.  go, go, go, go, go!"
};

    // Alice creates a post
    const createOutput: any = await alice.cells[0].callZome({
      zome_name: "posts",
      fn_name: "create_post",
      payload: createInput,
    });
    t.ok(createOutput.actionHash);  // test 1
    t.ok(createOutput.entryHash);   // test 2

    // Wait for the created entry to be propagated to the other node.
    await pause(100);

    
    // Bob gets the created post
    const readOutput: typeof createInput = await bob.cells[0].callZome({
      zome_name: "posts",
      fn_name: "get_post",
      payload: createOutput.entryHash,
    });
    t.deepEqual(readOutput, createInput); // test 3
    
    
    // Alice updates the post
    const contentUpdate = {
  "title": "I some world",
  "content": "No matter how you travel, it's still you going.  go, go, go, go, go! It must mean my character is interesting in some way."
}

    const updateInput = {
      originalActionHash: createOutput.actionHash,
      updatedPost: contentUpdate,
    }

    const updateOutput: any = await alice.cells[0].callZome({
      zome_name: "posts",
      fn_name: "update_post",
      payload: updateInput,
    });
    t.ok(updateOutput.actionHash);  // test 4
    t.ok(updateOutput.entryHash);   // test 5

    // Wait for the updated entry to be propagated to the other node.
    await pause(100);

      
    // Bob gets the updated post
    const readUpdatedOutput: typeof createInput = await bob.cells[0].callZome({
      zome_name: "posts",
      fn_name: "get_post",
      payload: updateOutput.entryHash,
    });
    t.deepEqual(readUpdatedOutput, contentUpdate);  // test 6

    
    
    // Alice deletes the post
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "posts",
      fn_name: "delete_post",
      payload: createOutput.actionHash,
    })
    t.ok(deleteActionHash); // test 7

      
    // Wait for the deletion action to be propagated to the other node.
    await pause(100);

    // Bob tries to get the deleted post, but he doesn't get it because it has been deleted
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "posts",
      fn_name: "get_post",
      payload: createOutput.entryHash,
    });
    t.notOk(readDeletedOutput); // test 8

    
  });



});
