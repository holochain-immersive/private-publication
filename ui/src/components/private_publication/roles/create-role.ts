
import { LitElement, html } from 'lit';
import { state, customElement } from 'lit/decorators.js';
import { InstalledCell, AppWebsocket, InstalledAppInfo } from '@holochain/client';
import { contextProvided } from '@lit-labs/context';
import { appWebsocketContext, appInfoContext } from '../../../contexts';
import { Role } from '../../../types/private_publication/roles';
import '@material/mwc-button';
import '@type-craft/title/create-title';

@customElement('create-role')
export class CreateRole extends LitElement {

    @state()
  _role: string | undefined;

  @state()
  _agent: string | undefined;

  isRoleValid() {
    return this._role && 
      this._agent;
  }

  @contextProvided({ context: appWebsocketContext })
  appWebsocket!: AppWebsocket;

  @contextProvided({ context: appInfoContext })
  appInfo!: InstalledAppInfo;

  async createRole() {
    const cellData = this.appInfo.cell_data.find((c: InstalledCell) => c.role_id === 'private_publication')!;

    const role: Role = {
      role: this._role!,
        agent: this._agent!,    // TODO: set the agent
    };

    const { entryHash } = await this.appWebsocket.callZome({
      cap_secret: null,
      cell_id: cellData.cell_id,
      zome_name: 'roles',
      fn_name: 'create_role',
      payload: role,
      provenance: cellData.cell_id[1]
    });

    this.dispatchEvent(new CustomEvent('role-created', {
      composed: true,
      bubbles: true,
      detail: {
        entryHash
      }
    }));
  }

  render() {
    return html`
      <div style="display: flex; flex-direction: column">
        <span style="font-size: 18px">Create Role</span>

        <create-title 
      
      @change=${(e: Event) => this._role = (e.target as any).value}
      style="margin-top: 16px"
    ></create-title>

        

        <mwc-button 
          label="Create Role"
          .disabled=${!this.isRoleValid()}
          @click=${() => this.createRole()}
        ></mwc-button>
    </div>`;
  }
}
