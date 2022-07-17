
import { DnaSource } from "@holochain/client";
import { pause, runScenario } from "@holochain/tryorama";
import pkg from 'tape-promise/tape';
const { test } = pkg;

import { lobbyDna } from  "../../utils";


export default () => test("entry_def_0 CRUD tests", async (t) => {
  await runScenario(async scenario => {

    const dnas: DnaSource[] = [{path: lobbyDna }];

    const [alice, bob]  = await scenario.addPlayersWithHapps([dnas, dnas]);

    await scenario.shareAllAgents();

    const createInput = {
  "title": "dinosaurs do go",
  "content": "They're using our own satellites against us. What do they got in there? It's a delight to trust somebody so completely."
};

    // Alice creates a entry_def_0
    const createOutput: any = await alice.cells[0].callZome({
      zome_name: "private_publication_lobby",
      fn_name: "create_entry_def_0",
      payload: createInput,
    });
    t.ok(createOutput.actionHash);  // test 1
    t.ok(createOutput.entryHash);   // test 2

    // Wait for the created entry to be propagated to the other node.
    await pause(100);

    
    // Bob gets the created entry_def_0
    const readOutput: typeof createInput = await bob.cells[0].callZome({
      zome_name: "private_publication_lobby",
      fn_name: "get_entry_def_0",
      payload: createOutput.entryHash,
    });
    t.deepEqual(readOutput, createInput); // test 3
    
    
    // Alice updates the entry_def_0
    const contentUpdate = {
  "title": "but Must if",
  "content": "Goodbye! This thing comes fully loaded. And the clock is ticking."
}

    const updateInput = {
      originalActionHash: createOutput.actionHash,
      updatedEntryDef0: contentUpdate,
    }

    const updateOutput: any = await alice.cells[0].callZome({
      zome_name: "private_publication_lobby",
      fn_name: "update_entry_def_0",
      payload: updateInput,
    });
    t.ok(updateOutput.actionHash);  // test 4
    t.ok(updateOutput.entryHash);   // test 5

    // Wait for the updated entry to be propagated to the other node.
    await pause(100);

      
    // Bob gets the updated entry_def_0
    const readUpdatedOutput: typeof createInput = await bob.cells[0].callZome({
      zome_name: "private_publication_lobby",
      fn_name: "get_entry_def_0",
      payload: updateOutput.entryHash,
    });
    t.deepEqual(readUpdatedOutput, contentUpdate);  // test 6

    
    
    // Alice deletes the entry_def_0
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "private_publication_lobby",
      fn_name: "delete_entry_def_0",
      payload: createOutput.actionHash,
    })
    t.ok(deleteActionHash); // test 7

      
    // Wait for the deletion action to be propagated to the other node.
    await pause(100);

    // Bob tries to get the deleted entry_def_0, but he doesn't get it because it has been deleted
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "private_publication_lobby",
      fn_name: "get_entry_def_0",
      payload: createOutput.entryHash,
    });
    t.notOk(readDeletedOutput); // test 8

    
  });



});
