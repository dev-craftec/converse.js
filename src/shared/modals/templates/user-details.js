import { html } from 'lit';
import { until } from 'lit/directives/until.js';
import { api, converse, _converse } from '@converse/headless';
import { __ } from 'i18n';

const { Strophe } = converse.env;

/**
 * @param {import('../user-details').default} el
 */
function tplUnblockButton(el) {
    const i18n_block = __('Remove from blocklist');
    return html`
        <button type="button" @click="${(ev) => el.unblockContact(ev)}" class="btn btn-danger">
            <converse-icon class="fas fa-times" color="var(--background-color)" size="1em"></converse-icon
            >&nbsp;${i18n_block}
        </button>
    `;
}

/**
 * @param {import('../user-details').default} el
 */
function tplBlockButton(el) {
    const i18n_block = __('Add to blocklist');
    return html`
        <button type="button" @click="${(ev) => el.blockContact(ev)}" class="btn btn-danger">
            <converse-icon class="fas fa-list-ul" color="var(--background-color)" size="1em"></converse-icon
            >&nbsp;${i18n_block}
        </button>
    `;
}

/**
 * @param {import('../user-details').default} el
 */
export function tplUserDetailsModal(el) {
    const vcard = el.model?.vcard;
    const vcard_json = vcard ? vcard.toJSON() : {};
    const o = { ...el.model.toJSON(), ...vcard_json };

    const contact = el.getContact();
    const is_roster_contact = contact && !contact.isUnsaved();

    const domain = _converse.session.get('domain');
    const blocking_supported = api.disco.supports(Strophe.NS.BLOCKING, domain).then(
        /** @param {boolean} supported */
        async (supported) => {
            const blocklist = await api.blocklist.get();
            if (supported) {
                if (blocklist.get(el.model.get('jid'))) {
                    tplUnblockButton(el);
                } else {
                    tplBlockButton(el);
                }
            }
        }
    );

    const i18n_full_name = __('Full Name');
    const i18n_profile = __('Profile');
    const ii18n_edit = __('Edit');

    const navigation_tabs = [
        html`<li role="presentation" class="nav-item">
            <a
                class="nav-link ${el.tab === 'profile' ? 'active' : ''}"
                id="profile-tab"
                href="#profile-tabpanel"
                aria-controls="profile-tabpanel"
                role="tab"
                @click="${(ev) => el.switchTab(ev)}"
                data-name="profile"
                data-toggle="tab"
                >${i18n_profile}</a
            >
        </li>`,
    ];

    if (is_roster_contact) {
        navigation_tabs.push(
            html`<li role="presentation" class="nav-item">
                <a
                    class="nav-link ${el.tab === 'edit' ? 'active' : ''}"
                    id="edit-tab"
                    href="#edit-tabpanel"
                    aria-controls="edit-tabpanel"
                    role="tab"
                    @click="${(ev) => el.switchTab(ev)}"
                    data-name="edit"
                    data-toggle="tab"
                    >${ii18n_edit}</a
                >
            </li>`
        );
    }

    return html`
        <ul class="nav nav-pills justify-content-center">
            ${navigation_tabs}
        </ul>
        <div class="tab-content">
            <div
                class="tab-pane ${el.tab === 'profile' ? 'active' : ''}"
                id="profile-tabpanel"
                role="tabpanel"
                aria-labelledby="profile-tab"
            >
                <div class="mb-4 centered">
                    <converse-avatar
                        .model="${el.model}"
                        name="${el.model.getDisplayName()}"
                        height="140"
                        width="140"
                    ></converse-avatar>
                </div>
                ${o.fullname
                    ? html`
                          <div class="row mb-2">
                              <div class="col-sm-4"><label>${i18n_full_name}:</label></div>
                              <div class="col-sm-8">${o.fullname}</div>
                          </div>
                      `
                    : ''}

                ${!contact
                    ? until(
                          blocking_supported.then(() => tplBlockButton(el)),
                          ''
                      )
                    : ''}
            </div>

            ${is_roster_contact
                ? html` <div
                      class="tab-pane ${el.tab === 'edit' ? 'active' : ''}"
                      id="edit-tabpanel"
                      role="tabpanel"
                      aria-labelledby="edit-tab"
                  >
                      ${el.tab === 'edit'
                          ? html`
                                ${until(
                                    blocking_supported.then(() => tplBlockButton(el)),
                                    ''
                                )}`
                          : ''}
                  </div>`
                : ''}
        </div>
    `;
}
