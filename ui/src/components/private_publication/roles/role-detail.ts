
import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { InstalledCell, AppWebsocket, EntryHash, InstalledAppInfo } from '@holochain/client';
import { contextProvided } from '@lit-labs/context';
import { appInfoContext, appWebsocketContext } from '../../../contexts';
import { Role } from '../../../types/private_publication/roles';
import '@material/mwc-circular-progress';
import '@type-craft/title/title-detail';
import '@holochain-open-dev/utils/copiable-hash';

@customElement('role-detail')
export class RoleDetail extends LitElement {
  @property()
  entryHash!: EntryHash;

  @state()
  _role: Role | undefined;

  @contextProvided({ context: appWebsocketContext })
  appWebsocket!: AppWebsocket;

  @contextProvided({ context: appInfoContext })
  appInfo!: InstalledAppInfo;

  async firstUpdated() {
    const cellData = this.appInfo.cell_data.find((c: InstalledCell) => c.role_id === 'private_publication')!;

    this._role = await this.appWebsocket.callZome({
      cap_secret: null,
      cell_id: cellData.cell_id,
      zome_name: 'roles',
      fn_name: 'get_role',
      payload: this.entryHash,
      provenance: cellData.cell_id[1]
    });
  }

  render() {
    if (!this._role) {
      return html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`;
    }

    return html`
      <div style="display: flex; flex-direction: column">
        <span style="font-size: 18px">Role</span>

        
    <title-detail
    
    .value=${this._role.role}
      style="margin-top: 16px"
    ></title-detail>

        
    <copiable-hash
    
    .value=${this._role.agent}
      style="margin-top: 16px"
    ></copiable-hash>

      </div>
    `;
  }
}
