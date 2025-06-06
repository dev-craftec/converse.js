import { __ } from 'i18n';
import { api } from '@converse/headless';
import { html } from 'lit';
import { getUnreadMsgsDisplay } from 'shared/chat/utils.js';
import { tplDetailsButton, tplRemoveButton } from './roster_item';


/**
 * @param {import('../contactview').default} el
 */
function tplAddContactButton(el) {
    const display_name = el.model.getDisplayName();
    const i18n_add_contact = __('Click to add %1$s as a contact', display_name);
    return html`<a
        class="dropdown-item add-contact"
        role="button"
        @click="${(ev) => el.addContact(ev)}"
        title="${i18n_add_contact}"
        data-toggle="modal"
    >
        <converse-icon class="fa fa-user-plus" size="1.5em"></converse-icon>
        ${__('Save as contact')}
    </a>`;
}


/**
 * @param {import('../contactview').default} el
 */
export default (el) => {
    const num_unread = getUnreadMsgsDisplay(el.model);
    const display_name = el.model.getDisplayName();
    const jid = el.model.get('jid');
		const i18n_chat = `Click to chat with ${display_name}`;
    const btns = [
       tplDetailsButton(el),
       tplAddContactButton(el),
       ...(api.settings.get('allow_contact_removal') ? [tplRemoveButton(el)] : []),
    ];

    return html`
        <a
            class="list-item-link cbox-list-item open-chat ${num_unread ? 'unread-msgs' : ''}"
            title="${i18n_chat}"
            href="#"
            data-jid=${jid}
            @click=${el.openChat}
        >
            <span>
                <converse-avatar
                    .model=${el.model}
                    class="avatar"
                    name="${el.model.getDisplayName()}"
                    nonce=${el.model.vcard?.get('vcard_updated')}
                    height="30"
                    width="30"
                ></converse-avatar>
            </span>
            ${num_unread ? html`<span class="msgs-indicator badge">${num_unread}</span>` : ''}
            <span class="contact-name ${num_unread ? 'unread-msgs' : ''}">${display_name}</span>
        </a>
        <span class="contact-actions">
            <converse-dropdown class="btn-group dropstart list-item-action" .items=${btns}></converse-dropdown>
        </span>
    `;
};
